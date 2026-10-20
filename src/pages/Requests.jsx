import { useState } from 'react';
import { Link } from 'react-router';

import { REQUEST_CATEGORIES, labelFor } from '../../shared/constants.js';
import { PriorityBadge, RequestStatusBadge } from '../components/Badges.jsx';
import { EmptyState, ErrorState, Loading, PageHeader } from '../components/Feedback.jsx';
import { CATEGORY_ICONS, Icon } from '../components/Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDocumentTitle } from '../hooks/useCommon.js';
import { relativeTime } from '../utils/dates.js';

const FILTERS = [
  { id: 'active', label: 'Active', statuses: ['open', 'in_progress'] },
  { id: 'done', label: 'Resolved', statuses: ['resolved', 'closed'] },
  { id: 'all', label: 'All', statuses: null },
];

/** A single service request in a list. Shared with the dashboard. */
export function RequestRow({ request, showRequester = false }) {
  return (
    <li className="request-row">
      <span className={`request-row__icon request-row__icon--${request.category}`} aria-hidden="true">
        <Icon name={CATEGORY_ICONS[request.category]} />
      </span>
      <div className="request-row__body">
        <p className="request-row__meta">
          <span className="code">{request.code}</span> · {labelFor(REQUEST_CATEGORIES, request.category)}
          {showRequester ? ` · ${request.userName}` : ''}
        </p>
        <h3 className="request-row__title">
          <Link to={`/requests/${request.id}`} className="stretched-link">
            {request.title}
          </Link>
        </h3>
        <p className="request-row__meta">
          Updated {relativeTime(request.updatedAt)}
          {request.commentCount > 0 ? ` · ${request.commentCount} ${request.commentCount === 1 ? 'reply' : 'replies'}` : ''}
        </p>
      </div>
      <div className="request-row__badges">
        <RequestStatusBadge status={request.status} />
        {request.priority === 'high' || request.priority === 'urgent' ? <PriorityBadge priority={request.priority} /> : null}
      </div>
    </li>
  );
}

export default function Requests() {
  useDocumentTitle('Service requests');
  const { isAdmin } = useAuth();
  const [filter, setFilter] = useState('active');
  const { data, error, loading, reload } = useApi('/api/requests/mine');

  const statuses = FILTERS.find((option) => option.id === filter).statuses;
  const requests = (data?.requests ?? []).filter((request) => !statuses || statuses.includes(request.status));

  return (
    <>
      <PageHeader
        eyebrow="Get help"
        title="Service requests"
        description="Report broken equipment, ask for tech help, request a room setup, or let staff know supplies are running low. Track every request until it is resolved."
        actions={
          <Link to="/requests/new" className="button button--primary">
            <Icon name="plus" size={18} />
            New request
          </Link>
        }
      />

      <div className="container section--tight">
        {isAdmin ? (
          <div className="alert alert--info">
            <Icon name="info" className="alert__icon" />
            <div className="alert__body">
              <p>
                You are signed in as staff. To manage everyone’s requests, open the{' '}
                <Link to="/admin?tab=requests">request board in the staff console</Link>.
              </p>
            </div>
          </div>
        ) : null}

        <div className="segmented-buttons" role="group" aria-label="Show requests">
          {FILTERS.map((option) => (
            <button key={option.id} type="button" className="segmented-buttons__button" aria-pressed={filter === option.id} onClick={() => setFilter(option.id)}>
              {option.label}
            </button>
          ))}
        </div>

        {error ? <ErrorState error={error} onRetry={reload} /> : null}
        {loading && !data ? <Loading /> : null}

        {data && requests.length === 0 ? (
          <EmptyState
            title={filter === 'active' ? 'No active requests' : 'No requests here yet'}
            action={
              <Link to="/requests/new" className="button button--primary">
                Submit a request
              </Link>
            }
          >
            <p>When something needs fixing or you need a hand, submit a request and staff will follow up here.</p>
          </EmptyState>
        ) : null}

        {requests.length > 0 ? (
          <ul className="request-list" aria-label="Your requests">
            {requests.map((request) => (
              <RequestRow key={request.id} request={request} />
            ))}
          </ul>
        ) : null}
      </div>
    </>
  );
}
