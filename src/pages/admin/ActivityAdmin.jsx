import { ErrorState, Loading } from '../../components/Feedback.jsx';
import { useApi } from '../../hooks/useApi.js';
import { formatDateTime, relativeTime } from '../../utils/dates.js';

/** The audit log: the 100 most recent actions, newest first. */
export function ActivityAdmin() {
  const { data, error, loading, reload } = useApi('/api/admin/audit');

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading && !data) return <Loading />;

  return (
    <div>
      <p className="muted small">Every reservation, approval, check-out, return, and change is recorded here for accountability.</p>
      <div className="table-wrap">
        <table className="data-table data-table--responsive">
          <caption className="sr-only">Recent activity</caption>
          <thead>
            <tr>
              <th scope="col">When</th>
              <th scope="col">Who</th>
              <th scope="col">Action</th>
              <th scope="col">Details</th>
            </tr>
          </thead>
          <tbody>
            {data.entries.map((entry) => (
              <tr key={entry.id}>
                <td data-label="When">
                  <time dateTime={new Date(entry.createdAt).toISOString()} title={formatDateTime(entry.createdAt)}>
                    {relativeTime(entry.createdAt)}
                  </time>
                </td>
                <td data-label="Who">{entry.actorName}</td>
                <td data-label="Action">
                  <span className={`activity-action activity-action--${entry.action.replace(/\s+/g, '-')}`}>{entry.action}</span>
                </td>
                <td data-label="Details">{entry.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
