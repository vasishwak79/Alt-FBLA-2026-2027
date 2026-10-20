import { Link } from 'react-router';

import { RESOURCE_CATEGORIES, labelFor } from '../../../shared/constants.js';
import { BarList, ColumnChart, DonutChart } from '../../components/charts/Charts.jsx';
import { ErrorState, Loading } from '../../components/Feedback.jsx';
import { Icon } from '../../components/Icon.jsx';
import { isSameDay } from '../../utils/dates.js';

const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'narrow' });
const fullDay = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

function formatHours(hours) {
  if (hours === null || hours === undefined) return '—';
  return hours < 24 ? `${Math.round(hours)} h` : `${(hours / 24).toFixed(1)} d`;
}

function Kpi({ icon, label, value, tone = 'neutral', action }) {
  return (
    <li className={`kpi kpi--${tone}`}>
      <span className="kpi__icon" aria-hidden="true">
        <Icon name={icon} size={20} />
      </span>
      <span className="kpi__value">{value}</span>
      <span className="kpi__label">{label}</span>
      {action}
    </li>
  );
}

/** The analytics tab. Its data is loaded by the Admin page so the tab badges can share it. */
export function Overview({ overview, onOpenTab }) {
  const { data, error, loading, reload } = overview;

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading && !data) return <Loading label="Loading analytics…" />;

  const { kpis, daily, byCategory, requestsByStatus, topResources } = data;

  return (
    <div className="admin-overview">
      <ul className="kpi-grid" aria-label="Key numbers">
        <Kpi
          icon="clock"
          label="Awaiting approval"
          value={kpis.pendingApprovals}
          tone={kpis.pendingApprovals > 0 ? 'warning' : 'neutral'}
          action={
            kpis.pendingApprovals > 0 ? (
              <button type="button" className="kpi__action" onClick={() => onOpenTab('reservations', 'pending')}>
                Review now <Icon name="arrow-right" size={14} />
              </button>
            ) : null
          }
        />
        <Kpi icon="package" label="Checked out now" value={kpis.checkedOut} />
        <Kpi
          icon="alert"
          label="Overdue returns"
          value={kpis.overdue}
          tone={kpis.overdue > 0 ? 'danger' : 'neutral'}
          action={
            kpis.overdue > 0 ? (
              <button type="button" className="kpi__action" onClick={() => onOpenTab('reservations', 'overdue')}>
                See overdue <Icon name="arrow-right" size={14} />
              </button>
            ) : null
          }
        />
        <Kpi
          icon="clipboard"
          label={`Open requests${kpis.urgentRequests ? ` (${kpis.urgentRequests} urgent)` : ''}`}
          value={kpis.openRequests}
          tone={kpis.urgentRequests > 0 ? 'danger' : 'neutral'}
          action={
            <button type="button" className="kpi__action" onClick={() => onOpenTab('requests')}>
              Open board <Icon name="arrow-right" size={14} />
            </button>
          }
        />
        <Kpi icon="chart" label="Resources used this week" value={`${kpis.resourcesUsed.used} of ${kpis.resourcesUsed.total}`} />
        <Kpi icon="history" label="Median time to resolve" value={formatHours(kpis.medianResolutionHours)} />
      </ul>

      <div className="chart-grid">
        <div className="card chart-card chart-card--wide">
          <ColumnChart
            title="Reservations per day (last 14 days)"
            valueLabel="Reservations"
            data={daily.map((day) => ({
              label: weekday.format(day.date),
              fullLabel: fullDay.format(day.date),
              value: day.count,
              highlight: isSameDay(day.date, Date.now()),
            }))}
          />
        </div>
        <div className="card chart-card">
          <BarList
            title="Reservations by category (30 days)"
            valueLabel="Reservations"
            data={byCategory.map((category) => ({ label: category.label, value: category.count, tone: category.id }))}
          />
        </div>
        <div className="card chart-card">
          <DonutChart
            title="Service requests by status"
            centerLabel="requests"
            data={requestsByStatus.map((row) => ({
              label: { open: 'Open', in_progress: 'In progress', resolved: 'Resolved', closed: 'Closed' }[row.status],
              value: row.count,
              tone: row.status,
            }))}
          />
        </div>
      </div>

      <section className="card" aria-labelledby="top-resources-heading">
        <h2 id="top-resources-heading" className="card__title">
          Most reserved (30 days)
        </h2>
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Resource</th>
              <th scope="col">Category</th>
              <th scope="col" className="numeric">
                Reservations
              </th>
            </tr>
          </thead>
          <tbody>
            {topResources.map((resource, index) => (
              <tr key={resource.id}>
                <td>{index + 1}</td>
                <th scope="row">
                  <Link to={`/catalog/${resource.id}`}>{resource.name}</Link>
                </th>
                <td>{labelFor(RESOURCE_CATEGORIES, resource.category)}</td>
                <td className="numeric">{resource.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small">
          Use this list to decide where to add more units, and “Resources used this week” to spot items that sit idle.
        </p>
      </section>
    </div>
  );
}
