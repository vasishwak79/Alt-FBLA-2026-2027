import { Link } from 'react-router';

import { RESOURCE_CATEGORIES, labelFor } from '../../shared/constants.js';
import { CategoryArt } from './art/CategoryArt.jsx';
import { AvailabilityBadge, Badge } from './Badges.jsx';
import { Icon } from './Icon.jsx';

/**
 * One resource in the catalog. The whole card is clickable, but it contains
 * a single real link (on the title) so screen readers hear it only once.
 */
export function ResourceCard({ resource, layout = 'grid' }) {
  return (
    <article className={`resource-card resource-card--${layout}`}>
      <CategoryArt category={resource.category} className="resource-card__art" />
      <div className="resource-card__body">
        <p className="resource-card__category">{labelFor(RESOURCE_CATEGORIES, resource.category)}</p>
        <h2 className="resource-card__title">
          <Link to={`/catalog/${resource.id}`} className="stretched-link">
            {resource.name}
          </Link>
        </h2>
        <p className="resource-card__meta">
          <Icon name="map-pin" size={16} />
          {resource.location}
        </p>
        {layout === 'list' ? <p className="resource-card__description">{resource.description}</p> : null}
        <div className="resource-card__badges">
          <AvailabilityBadge resource={resource} />
          {resource.requiresApproval ? (
            <Badge tone="outline" icon="shield">
              Needs approval
            </Badge>
          ) : null}
        </div>
      </div>
    </article>
  );
}
