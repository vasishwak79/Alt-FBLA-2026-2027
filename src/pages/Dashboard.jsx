import { useState } from 'react';
import { Link } from 'react-router';

import { reservationCode } from '../../shared/constants.js';
import { api } from '../api/client.js';
import { CategoryArt } from '../components/art/CategoryArt.jsx';
import { ReservationBadge } from '../components/Badges.jsx';
import { EmptyState, ErrorState, Loading, PageHeader } from '../components/Feedback.jsx';
import { Icon } from '../components/Icon.jsx';
import { ConfirmDialog } from '../components/Modal.jsx';
import { Tabs, TabPanel } from '../components/Tabs.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDocumentTitle } from '../hooks/useCommon.js';
import { formatRange, relativeTime } from '../utils/dates.js';
import { RequestRow } from './Requests.jsx';

/** Splits reservations into the three dashboard tabs. */
function groupReservations(reservations, now) {
  const upcoming = [];
  const out = [];
  const history = [];
  for (const reservation of reservations) {
    if (reservation.status === 'checked_out') out.push(reservation);
    else if (['pending', 'approved'].includes(reservation.status) && reservation.end > now) upcoming.push(reservation);
    else history.push(reservation);
  }
  upcoming.sort((a, b) => a.start - b.start);
  out.sort((a, b) => a.end - b.end);
  return { upcoming, out, history };
}

function ReservationItem({ reservation, onCancel }) {
  const canCancel = ['pending', 'approved'].includes(reservation.status) && reservation.end > Date.now();
  return (
    <li className={`reservation-item ${reservation.overdue ? 'reservation-item--overdue' : ''}`}>
      <CategoryArt category={reservation.resourceCategory} className="reservation-item__art" />
      <div className="reservation-item__body">
        <p className="reservation-item__code">{reservationCode(reservation.id)}</p>
        <h3 className="reservation-item__title">
          <Link to={`/catalog/${reservation.resourceId}`}>{reservation.resourceName}</Link>
          {reservation.quantity > 1 ? <span className="muted"> × {reservation.quantity}</span> : null}
        </h3>
        <p className="reservation-item__meta">
          <Icon name="calendar" size={16} />
          {formatRange(reservation.start, reservation.end)}
        </p>
        <p className="reservation-item__meta">
          <Icon name="map-pin" size={16} />
          {reservation.resourceLocation}
        </p>
        {reservation.staffNote ? (
          <p className="reservation-item__note">
            <Icon name="message" size={16} />
            Staff note: {reservation.staffNote}
          </p>
        ) : null}
      </div>
      <div className="reservation-item__side">
        <ReservationBadge reservation={reservation} />
        {canCancel ? (
          <button type="button" className="button button--ghost button--sm" onClick={() => onCancel(reservation)}>
            Cancel<span className="sr-only"> reservation for {reservation.resourceName}</span>
          </button>
        ) : null}
      </div>
    </li>
  );
}

function ReservationList({ items, empty, onCancel }) {
  if (items.length === 0) {
    return <p className="muted panel-empty">{empty}</p>;
  }
  return (
    <ul className="reservation-list">
      {items.map((reservation) => (
        <ReservationItem key={reservation.id} reservation={reservation} onCancel={onCancel} />
      ))}
    </ul>
  );
}

export default function Dashboard() {
  useDocumentTitle('My dashboard');
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState('upcoming');
  const [cancelling, setCancelling] = useState(null);
  const [busy, setBusy] = useState(false);

  const reservations = useApi('/api/reservations/mine');
  const requests = useApi('/api/requests/mine');
  const news = useApi('/api/announcements');

  const now = Date.now();
  const groups = groupReservations(reservations.data?.reservations ?? [], now);
  const overdue = groups.out.filter((reservation) => reservation.overdue);
  const openRequests = (requests.data?.requests ?? []).filter((request) => ['open', 'in_progress'].includes(request.status));
  const firstName = user.name.split(' ')[0];

  async function confirmCancel() {
    setBusy(true);
    try {
      await api.post(`/api/reservations/${cancelling.id}/cancel`);
      showToast(`${reservationCode(cancelling.id)} was cancelled.`, { tone: 'info' });
      setCancelling(null);
      reservations.reload();
    } catch (error) {
      showToast(error.message, { tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={user.title ?? 'Member'}
        title={`Hello, ${firstName}`}
        description="Your reservations, checked-out items, and requests in one place."
        actions={
          <>
            <Link to="/catalog" className="button button--primary">
              <Icon name="search" size={18} />
              Reserve something
            </Link>
            <Link to="/requests/new" className="button button--secondary">
              <Icon name="wrench" size={18} />
              Request help
            </Link>
          </>
        }
      />

      <div className="container section--tight">
        {overdue.length > 0 ? (
          <div className="alert alert--danger" role="alert">
            <Icon name="alert" className="alert__icon" />
            <div className="alert__body">
              <p className="alert__title">
                You have {overdue.length} overdue {overdue.length === 1 ? 'item' : 'items'}
              </p>
              <p>
                Please return {overdue.map((item) => item.resourceName).join(', ')} as soon as possible so others can use{' '}
                {overdue.length === 1 ? 'it' : 'them'}.
              </p>
            </div>
          </div>
        ) : null}

        <ul className="summary-cards" aria-label="Summary">
          <li className="summary-card">
            <Icon name="calendar" size={22} className="summary-card__icon" />
            <span className="summary-card__value">{groups.upcoming.length}</span>
            <span className="summary-card__label">Upcoming reservations</span>
          </li>
          <li className="summary-card">
            <Icon name="package" size={22} className="summary-card__icon" />
            <span className="summary-card__value">{groups.out.length}</span>
            <span className="summary-card__label">Items checked out</span>
          </li>
          <li className="summary-card">
            <Icon name="clipboard" size={22} className="summary-card__icon" />
            <span className="summary-card__value">{openRequests.length}</span>
            <span className="summary-card__label">Open requests</span>
          </li>
          <li className="summary-card">
            <Icon name="clock" size={22} className="summary-card__icon" />
            <span className="summary-card__value">{groups.upcoming.filter((item) => item.status === 'pending').length}</span>
            <span className="summary-card__label">Awaiting approval</span>
          </li>
        </ul>

        <div className="dashboard-grid">
          <section className="card" aria-labelledby="reservations-heading">
            <h2 id="reservations-heading" className="card__title">
              My reservations
            </h2>
            {reservations.error ? <ErrorState error={reservations.error} onRetry={reservations.reload} /> : null}
            {reservations.loading && !reservations.data ? <Loading /> : null}
            {reservations.data ? (
              <>
                <Tabs
                  label="Reservations"
                  active={tab}
                  onChange={setTab}
                  tabs={[
                    { id: 'upcoming', label: 'Upcoming', count: groups.upcoming.length },
                    { id: 'out', label: 'Checked out', count: groups.out.length },
                    { id: 'history', label: 'History' },
                  ]}
                />
                <TabPanel id="upcoming" active={tab === 'upcoming'}>
                  <ReservationList
                    items={groups.upcoming}
                    onCancel={setCancelling}
                    empty="No upcoming reservations. Browse the catalog to book something."
                  />
                </TabPanel>
                <TabPanel id="out" active={tab === 'out'}>
                  <ReservationList items={groups.out} onCancel={setCancelling} empty="You don’t have anything checked out right now." />
                </TabPanel>
                <TabPanel id="history" active={tab === 'history'}>
                  <ReservationList items={groups.history.slice(0, 20)} onCancel={setCancelling} empty="Your past reservations will appear here." />
                </TabPanel>
              </>
            ) : null}
          </section>

          <div className="dashboard-side">
            <section className="card" aria-labelledby="requests-heading">
              <div className="card__header">
                <h2 id="requests-heading" className="card__title">
                  My requests
                </h2>
                <Link to="/requests" className="text-link">
                  View all
                </Link>
              </div>
              {requests.data && requests.data.requests.length === 0 ? (
                <p className="muted">No requests yet.</p>
              ) : null}
              <ul className="request-list request-list--compact">
                {(requests.data?.requests ?? []).slice(0, 4).map((request) => (
                  <RequestRow key={request.id} request={request} />
                ))}
              </ul>
            </section>

            <section className="card" aria-labelledby="news-heading">
              <h2 id="news-heading" className="card__title">
                Announcements
              </h2>
              {news.data?.announcements.length === 0 ? <p className="muted">No announcements right now.</p> : null}
              <ul className="news-list">
                {(news.data?.announcements ?? []).slice(0, 3).map((item) => (
                  <li key={item.id}>
                    <h3 className="news-list__title">
                      {item.pinned ? <Icon name="pin" size={14} title="Pinned" /> : null} {item.title}
                    </h3>
                    <p>{item.body}</p>
                    <p className="news-card__meta">{relativeTime(item.createdAt)}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        {reservations.data && reservations.data.reservations.length === 0 && requests.data?.requests.length === 0 ? (
          <EmptyState
            title="Welcome to Commons!"
            action={
              <Link to="/catalog" className="button button--primary">
                Explore the catalog
              </Link>
            }
          >
            <p>Reserve a study room, borrow a camera, or check out a laptop. It only takes a minute.</p>
          </EmptyState>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(cancelling)}
        title="Cancel this reservation?"
        message={cancelling ? `${cancelling.resourceName}, ${formatRange(cancelling.start, cancelling.end)}. This frees it up for someone else and can’t be undone.` : ''}
        confirmLabel="Yes, cancel it"
        busy={busy}
        onConfirm={confirmCancel}
        onCancel={() => setCancelling(null)}
      />
    </>
  );
}
