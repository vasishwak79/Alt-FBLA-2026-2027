import { useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { ORGANIZATION_NAME, RESOURCE_CATEGORIES } from '../../shared/constants.js';
import { CategoryArt } from '../components/art/CategoryArt.jsx';
import { HeroArt } from '../components/art/HeroArt.jsx';
import { Icon } from '../components/Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDocumentTitle } from '../hooks/useCommon.js';
import { relativeTime } from '../utils/dates.js';
import { SOURCES } from './sourcesData.js';

/** Research that explains why Commons exists. Each fact links to its source. */
const FACTS = [
  {
    figure: '96%',
    text: 'of U.S. public schools reported providing digital devices to students who needed them in 2021–22.',
    takeaway: 'Schools now manage large pools of shared equipment that must be tracked.',
    source: 'nces',
  },
  {
    figure: '95%',
    text: 'of U.S. teens have or have access to a smartphone.',
    takeaway: 'So Commons is designed for phones first and works on any screen.',
    source: 'pew',
  },
  {
    figure: '1 in 4',
    text: 'U.S. adults (up to 27%) have some type of disability.',
    takeaway: 'So accessibility features are built into every page, not added later.',
    source: 'cdc',
  },
  {
    figure: '94.8%',
    text: 'of the top one million home pages had detectable accessibility failures in 2025.',
    takeaway: 'We designed around the most common failures: contrast, labels, alt text, and keyboard access.',
    source: 'webaim',
  },
];

const STEPS = [
  {
    icon: 'search',
    title: 'Find it',
    text: 'Search the catalog or browse by category. Live availability shows what is free right now.',
  },
  {
    icon: 'calendar',
    title: 'Reserve it',
    text: 'Pick a time on the timeline. Most items are confirmed instantly; special gear is approved by staff.',
  },
  {
    icon: 'package',
    title: 'Pick up & return',
    text: 'Staff check items out and back in, so everyone knows where every item is and when it is due.',
  },
];

function SourceLink({ id }) {
  const index = SOURCES.findIndex((source) => source.id === id);
  const source = SOURCES[index];
  return (
    <Link to={`/sources#${id}`} className="citation">
      {source.shortName}
      <span className="sr-only"> (source {index + 1})</span>
    </Link>
  );
}

function formatHours(hours) {
  if (hours === null || hours === undefined) return '—';
  return hours < 24 ? `${Math.round(hours)} hrs` : `${(hours / 24).toFixed(1)} days`;
}

export default function Home() {
  useDocumentTitle('');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const stats = useApi('/api/stats/summary');
  const news = useApi('/api/announcements');

  function handleSearch(event) {
    event.preventDefault();
    navigate(search.trim() ? `/catalog?q=${encodeURIComponent(search.trim())}` : '/catalog');
  }

  const summary = stats.data;
  const categoryCount = (id) => summary?.categories.find((category) => category.id === id)?.count ?? 0;

  return (
    <>
      <section className="hero">
        <div className="container hero__inner">
          <div className="hero__text">
            <p className="eyebrow">{ORGANIZATION_NAME} · Resource hub</p>
            <h1 className="hero__title" tabIndex={-1}>
              Everything our school shares, <span className="hero__highlight">in one place.</span>
            </h1>
            <p className="hero__lead">
              Commons replaces paper sign-out sheets and scattered emails. Reserve equipment, book rooms, and request
              repairs or tech help in a few clicks, while staff track every approval and return on one dashboard.
            </p>

            <form className="hero-search" role="search" onSubmit={handleSearch}>
              <label htmlFor="hero-search" className="sr-only">
                Search the catalog
              </label>
              <Icon name="search" className="hero-search__icon" />
              <input
                id="hero-search"
                type="search"
                className="hero-search__input"
                placeholder="Try “camera”, “study room”, or “laptop”"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button type="submit" className="button button--primary">
                Search
              </button>
            </form>

            <div className="hero__links">
              <Link to="/catalog" className="text-link">
                Browse all resources <Icon name="arrow-right" size={16} />
              </Link>
              <Link to="/requests/new" className="text-link">
                Report a problem <Icon name="arrow-right" size={16} />
              </Link>
            </div>
          </div>
          <div className="hero__art">
            <HeroArt />
          </div>
        </div>
      </section>

      <section className="stats-band" aria-labelledby="live-stats-heading">
        <div className="container">
          <h2 id="live-stats-heading" className="sr-only">
            Commons right now
          </h2>
          <dl className="stats-band__list">
            <div className="stat">
              <dt>Shared resources</dt>
              <dd>{summary ? summary.resources : '—'}</dd>
            </div>
            <div className="stat">
              <dt>Available right now</dt>
              <dd>{summary ? summary.availableNow : '—'}</dd>
            </div>
            <div className="stat">
              <dt>Reservations in the last 30 days</dt>
              <dd>{summary ? summary.reservationsLast30Days : '—'}</dd>
            </div>
            <div className="stat">
              <dt>Typical time to fix a request</dt>
              <dd>{summary ? formatHours(summary.medianResolutionHours) : '—'}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="section" aria-labelledby="categories-heading">
        <div className="container">
          <div className="section__header">
            <h2 id="categories-heading" className="section__title">
              Browse by category
            </h2>
            <p className="section__lead">From graphing calculators to the auditorium, if the school shares it, it is here.</p>
          </div>
          <ul className="category-grid">
            {RESOURCE_CATEGORIES.map((category) => (
              <li key={category.id} className="category-tile">
                <CategoryArt category={category.id} className="category-tile__art" />
                <div className="category-tile__body">
                  <h3 className="category-tile__title">
                    <Link to={`/catalog?category=${category.id}`} className="stretched-link">
                      {category.label}
                    </Link>
                  </h3>
                  <p>{category.description}</p>
                  <p className="category-tile__count">{summary ? `${categoryCount(category.id)} resources` : ' '}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section--tinted" aria-labelledby="why-heading">
        <div className="container">
          <div className="section__header">
            <p className="eyebrow">Why Commons?</p>
            <h2 id="why-heading" className="section__title">
              Shared resources are everywhere. Tracking them should be easy.
            </h2>
            <p className="section__lead">
              When equipment lives on clipboards and requests live in inboxes, items go missing, rooms get double-booked,
              and problems wait days for an answer. Research shaped how we built Commons:
            </p>
          </div>
          <ul className="fact-grid">
            {FACTS.map((fact) => (
              <li key={fact.source} className="fact">
                <p className="fact__figure">{fact.figure}</p>
                <p className="fact__text">{fact.text}</p>
                <p className="fact__takeaway">{fact.takeaway}</p>
                <p className="fact__source">
                  Source: <SourceLink id={fact.source} />
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" aria-labelledby="steps-heading">
        <div className="container">
          <div className="section__header">
            <h2 id="steps-heading" className="section__title">
              Borrowing takes three steps
            </h2>
          </div>
          <ol className="steps">
            {STEPS.map((step, index) => (
              <li key={step.title} className="step">
                <span className="step__icon" aria-hidden="true">
                  <Icon name={step.icon} size={26} />
                </span>
                <p className="step__number">Step {index + 1}</p>
                <h3 className="step__title">{step.title}</h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
          <p className="section__more">
            <Link to="/about" className="text-link">
              Learn how requests, approvals, and returns work <Icon name="arrow-right" size={16} />
            </Link>
          </p>
        </div>
      </section>

      <section className="section section--tinted" aria-labelledby="audience-heading">
        <div className="container">
          <h2 id="audience-heading" className="section__title section__title--center">
            Built for everyone who shares
          </h2>
          <div className="audience-grid">
            <article className="audience-card">
              <span className="audience-card__icon" aria-hidden="true">
                <Icon name="users" size={26} />
              </span>
              <h3>For students &amp; teachers</h3>
              <ul className="check-list">
                <li>See live availability before walking across campus</li>
                <li>Reserve from a phone in under a minute</li>
                <li>Report broken equipment or request help, then track the fix</li>
                <li>Get notified when requests are approved or answered</li>
              </ul>
            </article>
            <article className="audience-card">
              <span className="audience-card__icon audience-card__icon--accent" aria-hidden="true">
                <Icon name="chart" size={26} />
              </span>
              <h3>For resource managers</h3>
              <ul className="check-list">
                <li>Approve, check out, and check in from one queue</li>
                <li>Spot overdue items and urgent requests instantly</li>
                <li>See usage trends to guide purchasing decisions</li>
                <li>Export records and review a full activity log</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      {news.data?.announcements.length ? (
        <section className="section" aria-labelledby="news-heading">
          <div className="container">
            <div className="section__header">
              <h2 id="news-heading" className="section__title">
                Latest news
              </h2>
            </div>
            <ul className="news-grid">
              {news.data.announcements.slice(0, 3).map((item) => (
                <li key={item.id} className="news-card">
                  {item.pinned ? (
                    <p className="news-card__pinned">
                      <Icon name="pin" size={14} /> Pinned
                    </p>
                  ) : null}
                  <h3 className="news-card__title">{item.title}</h3>
                  <p>{item.body}</p>
                  <p className="news-card__meta">
                    {item.authorName} · {relativeTime(item.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="cta-band">
        <div className="container cta-band__inner">
          <div>
            <h2 className="cta-band__title">Ready to borrow something?</h2>
            <p>{user ? 'Your reservations and requests are waiting on your dashboard.' : 'Sign in with your school account to reserve in seconds.'}</p>
          </div>
          <div className="cta-band__actions">
            {user ? (
              <Link to="/dashboard" className="button button--accent button--lg">
                Go to my dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="button button--accent button--lg">
                  Sign in
                </Link>
                <Link to="/register" className="button button--on-dark button--lg">
                  Create an account
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
