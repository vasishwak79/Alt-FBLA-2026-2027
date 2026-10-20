import { useState } from 'react';
import { Link } from 'react-router';

import { REQUEST_CATEGORIES, REQUEST_STATUSES, labelFor } from '../../../shared/constants.js';
import { api } from '../../api/client.js';
import { PriorityBadge } from '../../components/Badges.jsx';
import { ErrorState, Loading } from '../../components/Feedback.jsx';
import { CATEGORY_ICONS, Icon } from '../../components/Icon.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import { relativeTime } from '../../utils/dates.js';

const COLUMNS = [
  { status: 'open', label: 'Open', icon: 'inbox' },
  { status: 'in_progress', label: 'In progress', icon: 'clock' },
  { status: 'resolved', label: 'Resolved', icon: 'check-circle' },
];

function RequestCard({ request, busy, onMove }) {
  return (
    <li className={`board-card board-card--${request.priority}`}>
      <div className="board-card__top">
        <span className="code">{request.code}</span>
        {request.priority !== 'normal' ? <PriorityBadge priority={request.priority} /> : null}
      </div>
      <h3 className="board-card__title">
        <Link to={`/requests/${request.id}`}>{request.title}</Link>
      </h3>
      <p className="board-card__meta">
        <Icon name={CATEGORY_ICONS[request.category]} size={14} />
        {labelFor(REQUEST_CATEGORIES, request.category)} · {request.location}
      </p>
      <p className="board-card__meta">
        <Icon name="user" size={14} />
        {request.userName} · {relativeTime(request.createdAt)}
        {request.commentCount > 0 ? ` · ${request.commentCount} replies` : ''}
      </p>
      <label className="board-card__move">
        <span className="sr-only">Status for {request.code}</span>
        <select className="input input--compact" value={request.status} disabled={busy} onChange={(event) => onMove(request, event.target.value)}>
          {REQUEST_STATUSES.map((option) => (
            <option key={option.id} value={option.id}>
              {option.id === request.status ? option.label : `Move to: ${option.label}`}
            </option>
          ))}
        </select>
      </label>
    </li>
  );
}

/**
 * A board with one column per status. Moving a card uses a normal select
 * menu rather than drag-and-drop, so it works with a keyboard, a screen
 * reader, and on a phone.
 */
export function RequestsBoard({ onChanged }) {
  const { showToast } = useToast();
  const { data, error, loading, reload } = useApi('/api/admin/requests');
  const [busyId, setBusyId] = useState(null);
  const [showClosed, setShowClosed] = useState(false);

  async function move(request, status) {
    setBusyId(request.id);
    try {
      await api.patch(`/api/requests/${request.id}`, { status });
      showToast(`${request.code} moved to “${labelFor(REQUEST_STATUSES, status)}”.`);
      reload();
      onChanged();
    } catch (moveError) {
      showToast(moveError.message, { tone: 'error' });
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading && !data) return <Loading />;

  const requests = data.requests;
  const closed = requests.filter((request) => request.status === 'closed');

  return (
    <div>
      <div className="board">
        {COLUMNS.map((column) => {
          const items = requests.filter((request) => request.status === column.status);
          return (
            <section key={column.status} className={`board__column board__column--${column.status}`} aria-labelledby={`column-${column.status}`}>
              <h2 id={`column-${column.status}`} className="board__heading">
                <Icon name={column.icon} size={18} />
                {column.label}{' '}
                <span className="board__count">
                  {items.length}
                  <span className="sr-only"> requests</span>
                </span>
              </h2>
              {items.length === 0 ? <p className="muted small board__empty">Nothing here.</p> : null}
              <ul className="board__list">
                {items.map((request) => (
                  <RequestCard key={request.id} request={request} busy={busyId === request.id} onMove={move} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <button type="button" className="button button--ghost button--sm" aria-expanded={showClosed} onClick={() => setShowClosed((value) => !value)}>
        <Icon name="chevron-down" size={16} className={showClosed ? 'rotate-180' : ''} />
        {showClosed ? 'Hide' : 'Show'} closed requests ({closed.length})
      </button>
      {showClosed ? (
        <ul className="board__list board__list--closed">
          {closed.map((request) => (
            <RequestCard key={request.id} request={request} busy={busyId === request.id} onMove={move} />
          ))}
        </ul>
      ) : null}
    </div>
  );
}
