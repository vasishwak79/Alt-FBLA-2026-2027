import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';

import { RESOURCE_CATEGORIES, labelFor } from '../../shared/constants.js';
import { toQuery } from '../api/client.js';
import { EmptyState, ErrorState, Loading, PageHeader } from '../components/Feedback.jsx';
import { Icon } from '../components/Icon.jsx';
import { ResourceCard } from '../components/ResourceCard.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDebouncedValue, useDocumentTitle } from '../hooks/useCommon.js';

const SORTS = [
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'available', label: 'Most available' },
  { value: 'category', label: 'Category' },
];

const VIEW_KEY = 'commons:catalog-view';

function loadView() {
  try {
    return window.localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
}

/**
 * The catalog: search, filter, and sort every shared resource. Filters are
 * kept in the URL (for example /catalog?category=media&available=1) so a
 * filtered view can be bookmarked or shared.
 */
export default function Catalog() {
  useDocumentTitle('Catalog');
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState(loadView);
  const searchRef = useRef(null);

  const category = params.get('category') ?? '';
  const available = params.get('available') === '1';
  const sort = params.get('sort') ?? 'name';
  const [searchText, setSearchText] = useState(params.get('q') ?? '');
  const search = useDebouncedValue(searchText.trim(), 250);

  // Keep the URL in step with the (debounced) search box.
  useEffect(() => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (search) next.set('q', search);
        else next.delete('q');
        return next;
      },
      { replace: true },
    );
  }, [search, setParams]);

  // Press "/" anywhere on the page to jump to the search box.
  useEffect(() => {
    function handleKey(event) {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
      if (event.key === '/' && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  function updateParam(key, value) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  }

  function changeView(nextView) {
    setView(nextView);
    try {
      window.localStorage.setItem(VIEW_KEY, nextView);
    } catch {
      // Storage may be unavailable; the choice still applies for this visit.
    }
  }

  function clearFilters() {
    setSearchText('');
    setParams({}, { replace: true });
  }

  const { data, error, loading, reload } = useApi(
    `/api/resources${toQuery({ q: search, category, available: available ? 1 : '', sort })}`,
  );
  const resources = data?.resources ?? [];
  const hasFilters = Boolean(search || category || available);

  let summary = `${resources.length} ${resources.length === 1 ? 'resource' : 'resources'}`;
  if (category) summary += ` in ${labelFor(RESOURCE_CATEGORIES, category)}`;
  if (search) summary += ` matching “${search}”`;
  if (available) summary += ', available now';

  return (
    <>
      <PageHeader
        eyebrow="Browse & reserve"
        title="Catalog"
        description="Every piece of equipment and every space the school shares, with live availability."
      />

      <div className="container catalog">
        <div className="catalog-toolbar">
          <div className="search-field">
            <label htmlFor="catalog-search" className="sr-only">
              Search resources
            </label>
            <Icon name="search" className="search-field__icon" />
            <input
              ref={searchRef}
              id="catalog-search"
              type="search"
              className="input search-field__input"
              placeholder="Search by name, use, or location"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              aria-describedby="search-shortcut"
            />
            <span id="search-shortcut" className="sr-only">
              Tip: press the slash key anywhere on this page to jump to search.
            </span>
            <kbd className="search-field__kbd" aria-hidden="true">
              /
            </kbd>
          </div>

          <div className="catalog-toolbar__controls">
            <label className="checkbox-pill">
              <input type="checkbox" checked={available} onChange={(event) => updateParam('available', event.target.checked ? '1' : '')} />
              <span>Available now</span>
            </label>

            <div className="inline-field">
              <label htmlFor="catalog-sort">Sort by</label>
              <select id="catalog-sort" className="input input--compact" value={sort} onChange={(event) => updateParam('sort', event.target.value === 'name' ? '' : event.target.value)}>
                {SORTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="view-toggle" role="group" aria-label="Layout">
              <button type="button" className="icon-button" aria-pressed={view === 'grid'} onClick={() => changeView('grid')}>
                <Icon name="grid" title="Grid view" />
              </button>
              <button type="button" className="icon-button" aria-pressed={view === 'list'} onClick={() => changeView('list')}>
                <Icon name="list" title="List view" />
              </button>
            </div>
          </div>
        </div>

        <div className="chip-row" role="group" aria-label="Filter by category">
          <button type="button" className="chip" aria-pressed={!category} onClick={() => updateParam('category', '')}>
            All
          </button>
          {RESOURCE_CATEGORIES.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`chip chip--${option.id}`}
              aria-pressed={category === option.id}
              onClick={() => updateParam('category', category === option.id ? '' : option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="catalog__status">
          <p role="status" className="catalog__count">
            {loading && !data ? 'Loading resources…' : `Showing ${summary}.`}
          </p>
          {hasFilters ? (
            <button type="button" className="button button--ghost button--sm" onClick={clearFilters}>
              <Icon name="x" size={16} />
              Clear filters
            </button>
          ) : null}
        </div>

        {error ? <ErrorState error={error} onRetry={reload} /> : null}
        {loading && !data ? <Loading label="Loading resources…" /> : null}

        {data && resources.length === 0 ? (
          <EmptyState
            title="Nothing matches those filters"
            action={
              <button type="button" className="button button--secondary" onClick={clearFilters}>
                Clear all filters
              </button>
            }
          >
            <p>Try a shorter search, another category, or turn off “Available now.”</p>
          </EmptyState>
        ) : null}

        {resources.length > 0 ? (
          <ul className={`resource-grid resource-grid--${view} ${loading ? 'is-loading' : ''}`}>
            {resources.map((resource) => (
              <li key={resource.id}>
                <ResourceCard resource={resource} layout={view} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </>
  );
}
