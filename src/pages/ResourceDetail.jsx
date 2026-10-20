import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router';

import { RESOURCE_CATEGORIES, labelFor } from '../../shared/constants.js';
import { CategoryArt } from '../components/art/CategoryArt.jsx';
import { AvailabilityTimeline } from '../components/AvailabilityTimeline.jsx';
import { AvailabilityBadge, Badge } from '../components/Badges.jsx';
import { ErrorState, Loading, PageHeader } from '../components/Feedback.jsx';
import { Icon } from '../components/Icon.jsx';
import { ReservationForm } from '../components/ReservationForm.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDocumentTitle } from '../hooks/useCommon.js';
import { addDays, formatDuration, isSameDay, openingHours, startOfDay } from '../utils/dates.js';

/** After closing time, show tomorrow's availability by default. */
function firstUsefulDay() {
  const now = Date.now();
  const { close } = openingHours(now);
  return now >= close ? addDays(startOfDay(now), 1) : startOfDay(now);
}

export default function ResourceDetail() {
  const { id } = useParams();
  const { data, error, loading, reload } = useApi(`/api/resources/${id}`);
  const resource = data?.resource;
  useDocumentTitle(resource?.name ?? 'Resource');

  const [day, setDay] = useState(firstUsefulDay);
  const [pickedSlot, setPickedSlot] = useState(null);
  const [selection, setSelection] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Keep the timeline on the same day as the selected start time.
  const handleRangeChange = useCallback((range) => {
    setSelection(range);
    if (range) {
      setDay((current) => (isSameDay(current, range.start) ? current : startOfDay(range.start)));
    }
  }, []);

  const handleReserved = useCallback(() => {
    setRefreshKey((key) => key + 1);
    reload();
  }, [reload]);

  if (loading && !resource) {
    return (
      <>
        <PageHeader title="Loading resource…" />
        <Loading />
      </>
    );
  }

  if (error || !resource) {
    return (
      <>
        <PageHeader title="Resource not found" />
        <div className="container section--tight">
          <ErrorState error={error} onRetry={reload} />
          <p>
            <Link to="/catalog" className="text-link">
              <Icon name="arrow-left" size={16} /> Back to the catalog
            </Link>
          </p>
        </div>
      </>
    );
  }

  const categoryLabel = labelFor(RESOURCE_CATEGORIES, resource.category);

  return (
    <>
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link to="/catalog">Catalog</Link>
            </li>
            <li>
              <Link to={`/catalog?category=${resource.category}`}>{categoryLabel}</Link>
            </li>
            <li>
              <span aria-current="page">{resource.name}</span>
            </li>
          </ol>
        </nav>
      </div>

      <div className="container detail">
        <div className="detail__main">
          <section className="detail-hero" aria-labelledby="resource-title">
            <CategoryArt category={resource.category} className="detail-hero__art" />
            <div className="detail-hero__body">
              <p className="eyebrow">{categoryLabel}</p>
              <h1 id="resource-title" className="detail-hero__title" tabIndex={-1}>
                {resource.name}
              </h1>
              <div className="detail-hero__badges">
                <AvailabilityBadge resource={resource} />
                {resource.requiresApproval ? (
                  <Badge tone="outline" icon="shield">
                    Needs staff approval
                  </Badge>
                ) : (
                  <Badge tone="outline" icon="check">
                    Instant confirmation
                  </Badge>
                )}
              </div>
              <p className="detail-hero__description">{resource.description}</p>
            </div>
          </section>

          <dl className="fact-list">
            <div>
              <dt>
                <Icon name="map-pin" size={18} /> Location
              </dt>
              <dd>{resource.location}</dd>
            </div>
            <div>
              <dt>
                <Icon name={resource.kind === 'space' ? 'users' : 'layers'} size={18} />
                {resource.kind === 'space' ? 'Seats' : 'Units'}
              </dt>
              <dd>{resource.kind === 'space' ? `Up to ${resource.capacity ?? '—'} people` : `${resource.quantity} in total`}</dd>
            </div>
            <div>
              <dt>
                <Icon name="clock" size={18} /> Longest booking
              </dt>
              <dd>{formatDuration(resource.maxHours)}</dd>
            </div>
            <div>
              <dt>
                <Icon name="history" size={18} /> Times reserved
              </dt>
              <dd>{resource.totalReservations}</dd>
            </div>
          </dl>

          {resource.openIssues > 0 ? (
            <div className="alert alert--warning">
              <Icon name="wrench" className="alert__icon" />
              <div className="alert__body">
                <p>
                  Staff are working on {resource.openIssues === 1 ? 'a reported issue' : `${resource.openIssues} reported issues`} with this
                  resource.
                </p>
              </div>
            </div>
          ) : null}

          <AvailabilityTimeline
            resource={resource}
            day={day}
            onDayChange={setDay}
            onPickSlot={(start) => {
              setPickedSlot({ start, at: Date.now() });
              // On phones the form sits below the timeline, so bring it into view.
              if (window.matchMedia('(max-width: 959px)').matches) {
                document.getElementById('reserve-panel')?.scrollIntoView({ block: 'start' });
              }
            }}
            selection={selection}
            refreshKey={refreshKey}
          />

          {resource.tags.length > 0 ? (
            <div className="tag-list">
              <h2 className="sr-only">Tags</h2>
              {resource.tags.map((tag) => (
                <Link key={tag} to={`/catalog?q=${encodeURIComponent(tag)}`} className="tag">
                  <Icon name="tag" size={14} />
                  {tag}
                </Link>
              ))}
            </div>
          ) : null}

          <p className="detail__report">
            <Icon name="wrench" size={18} />
            Something wrong with this {resource.kind === 'space' ? 'space' : 'item'}?{' '}
            <Link to={`/requests/new?resource=${resource.id}&category=${resource.kind === 'space' ? 'facilities' : 'it'}`}>
              Report a problem
            </Link>
          </p>
        </div>

        <aside className="detail__aside" id="reserve-panel" aria-label="Reservation">
          <ReservationForm
            resource={resource}
            pickedSlot={pickedSlot}
            onRangeChange={handleRangeChange}
            onReserved={handleReserved}
          />
        </aside>
      </div>
    </>
  );
}
