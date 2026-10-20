import { useState } from 'react';
import { Link } from 'react-router';

import { reservationCode } from '../../../shared/constants.js';
import { api } from '../../api/client.js';
import { ReservationBadge } from '../../components/Badges.jsx';
import { Field } from '../../components/Field.jsx';
import { EmptyState, ErrorState, Loading } from '../../components/Feedback.jsx';
import { Icon } from '../../components/Icon.jsx';
import { Modal } from '../../components/Modal.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import { formatRange } from '../../utils/dates.js';

export const RESERVATION_FILTERS = [
  { id: 'pending', label: 'Needs approval' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'checked_out', label: 'Checked out' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'all', label: 'All' },
];

const SUCCESS_MESSAGES = {
  approve: 'approved',
  deny: 'denied',
  checkout: 'checked out',
  return: 'checked back in',
  cancel: 'cancelled',
};

/** The buttons that make sense for a reservation in its current state. */
function actionsFor(reservation) {
  const actions = [];
  if (reservation.status === 'pending') {
    actions.push({ id: 'approve', label: 'Approve', style: 'primary', icon: 'check' });
    actions.push({ id: 'deny', label: 'Deny', style: 'danger-ghost', icon: 'x' });
  }
  if (reservation.status === 'approved') {
    if (reservation.kind === 'equipment') {
      actions.push({ id: 'checkout', label: 'Check out', style: 'primary', icon: 'package' });
    }
    if (reservation.end > Date.now()) {
      actions.push({ id: 'cancel', label: 'Cancel', style: 'ghost' });
    }
  }
  if (reservation.status === 'checked_out') {
    actions.push({ id: 'return', label: 'Check in', style: 'primary', icon: 'check-circle' });
  }
  return actions;
}

export function ReservationsAdmin({ filter, onFilterChange, onChanged }) {
  const { showToast } = useToast();
  const { data, error, loading, reload } = useApi(`/api/admin/reservations?status=${filter}`);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [denying, setDenying] = useState(null);
  const [note, setNote] = useState('');
  const [noteError, setNoteError] = useState('');

  async function runAction(reservation, action, body = {}) {
    setBusyId(reservation.id);
    try {
      if (action === 'cancel') {
        await api.post(`/api/reservations/${reservation.id}/cancel`);
      } else {
        await api.post(`/api/admin/reservations/${reservation.id}/${action}`, body);
      }
      showToast(`${reservationCode(reservation.id)} ${SUCCESS_MESSAGES[action]}. ${reservation.userName} was notified.`);
      reload();
      onChanged();
      return true;
    } catch (actionError) {
      showToast(actionError.message, { tone: 'error' });
      return false;
    } finally {
      setBusyId(null);
    }
  }

  function handleAction(reservation, action) {
    if (action === 'deny') {
      setNote('');
      setNoteError('');
      setDenying(reservation);
      return;
    }
    runAction(reservation, action);
  }

  async function submitDenial(event) {
    event.preventDefault();
    if (note.trim().length === 0) {
      setNoteError('Add a short reason so the member knows what to do next.');
      return;
    }
    const done = await runAction(denying, 'deny', { note });
    if (done) setDenying(null);
  }

  const term = search.trim().toLowerCase();
  const rows = (data?.reservations ?? []).filter(
    (reservation) =>
      !term ||
      [reservationCode(reservation.id), reservation.resourceName, reservation.userName, reservation.purpose]
        .join(' ')
        .toLowerCase()
        .includes(term),
  );

  return (
    <div>
      <div className="admin-toolbar">
        <div className="segmented-buttons" role="group" aria-label="Filter reservations">
          {RESERVATION_FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              className="segmented-buttons__button"
              aria-pressed={filter === option.id}
              onClick={() => onFilterChange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="search-field search-field--compact">
          <label htmlFor="reservation-search" className="sr-only">
            Search these reservations
          </label>
          <Icon name="search" className="search-field__icon" />
          <input
            id="reservation-search"
            type="search"
            className="input search-field__input"
            placeholder="Search by code, item, or member"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      <p className="muted small" role="status">
        {data ? `${rows.length} ${rows.length === 1 ? 'reservation' : 'reservations'} shown.` : ''}
      </p>

      {error ? <ErrorState error={error} onRetry={reload} /> : null}
      {loading && !data ? <Loading /> : null}
      {data && rows.length === 0 ? (
        <EmptyState title={filter === 'pending' ? 'Nothing needs approval' : 'No reservations here'}>
          <p>{filter === 'pending' ? 'You are all caught up. New requests will appear here.' : 'Try another filter or clear the search.'}</p>
        </EmptyState>
      ) : null}

      {rows.length > 0 ? (
        <div className="table-wrap">
          <table className="data-table data-table--responsive">
            <caption className="sr-only">Reservations: {RESERVATION_FILTERS.find((option) => option.id === filter)?.label}</caption>
            <thead>
              <tr>
                <th scope="col">Reservation</th>
                <th scope="col">Member</th>
                <th scope="col">When</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((reservation) => (
                <tr key={reservation.id} className={reservation.overdue ? 'is-overdue' : ''}>
                  <th scope="row" data-label="Reservation">
                    <span className="code">{reservationCode(reservation.id)}</span>
                    <Link to={`/catalog/${reservation.resourceId}`} className="table-title">
                      {reservation.resourceName}
                      {reservation.quantity > 1 ? ` × ${reservation.quantity}` : ''}
                    </Link>
                    <span className="table-sub">{reservation.purpose}</span>
                  </th>
                  <td data-label="Member">
                    {reservation.userName}
                    <span className="table-sub">{reservation.userEmail}</span>
                  </td>
                  <td data-label="When">{formatRange(reservation.start, reservation.end)}</td>
                  <td data-label="Status">
                    <ReservationBadge reservation={reservation} />
                  </td>
                  <td className="table-actions">
                    {actionsFor(reservation).map((action) => (
                      <button
                        key={action.id}
                        type="button"
                        className={`button button--sm button--${action.style}`}
                        disabled={busyId === reservation.id}
                        onClick={() => handleAction(reservation, action.id)}
                      >
                        {action.icon ? <Icon name={action.icon} size={16} /> : null}
                        {action.label}
                        <span className="sr-only"> {reservationCode(reservation.id)}</span>
                      </button>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <Modal
        open={Boolean(denying)}
        onClose={() => setDenying(null)}
        title="Deny this reservation?"
        description={denying ? `${denying.resourceName} for ${denying.userName}, ${formatRange(denying.start, denying.end)}` : ''}
        size="sm"
        footer={
          <>
            <button type="button" className="button button--secondary" onClick={() => setDenying(null)}>
              Go back
            </button>
            <button type="submit" form="deny-form" className="button button--danger" disabled={busyId !== null}>
              Deny reservation
            </button>
          </>
        }
      >
        <form id="deny-form" onSubmit={submitDenial} noValidate>
          <Field label="Reason for the member" hint="They will see this in their notification." error={noteError} required>
            {(props) => (
              <textarea
                {...props}
                className="input"
                rows={3}
                maxLength={300}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Example: Already reserved for the band concert. Try Thursday instead."
              />
            )}
          </Field>
        </form>
      </Modal>
    </div>
  );
}
