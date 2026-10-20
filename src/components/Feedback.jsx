/**
 * Shared building blocks for page states: headers, loading, errors,
 * empty results, and inline alerts.
 */

import { Link } from 'react-router';

import { EmptyArt } from './art/EmptyArt.jsx';
import { Icon } from './Icon.jsx';

/**
 * The title area at the top of every page. The <h1> can receive focus so
 * screen readers announce the new page after navigation.
 */
export function PageHeader({ eyebrow, title, description, actions, children }) {
  return (
    <header className="page-header">
      <div className="container page-header__inner">
        <div className="page-header__text">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1 className="page-header__title" tabIndex={-1}>
            {title}
          </h1>
          {description ? <p className="page-header__description">{description}</p> : null}
          {children}
        </div>
        {actions ? <div className="page-header__actions">{actions}</div> : null}
      </div>
    </header>
  );
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  const signedOut = error?.status === 401;
  return (
    <div className="alert alert--danger" role="alert">
      <Icon name="alert" className="alert__icon" />
      <div className="alert__body">
        <p className="alert__title">{signedOut ? 'Please sign in' : 'Something went wrong'}</p>
        <p>{error?.message ?? 'Please try again.'}</p>
        {signedOut ? (
          <Link className="button button--sm button--secondary" to="/login">
            Sign in
          </Link>
        ) : onRetry ? (
          <button type="button" className="button button--sm button--secondary" onClick={onRetry}>
            Try again
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function EmptyState({ title, children, action }) {
  return (
    <div className="empty-state">
      <EmptyArt className="empty-state__art" />
      <h2 className="empty-state__title">{title}</h2>
      {children ? <div className="empty-state__text">{children}</div> : null}
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  );
}

const ALERT_ICONS = { info: 'info', success: 'check-circle', warning: 'alert', danger: 'alert' };

export function Alert({ tone = 'info', title, children, role }) {
  return (
    <div className={`alert alert--${tone}`} role={role}>
      <Icon name={ALERT_ICONS[tone]} className="alert__icon" />
      <div className="alert__body">
        {title ? <p className="alert__title">{title}</p> : null}
        {children}
      </div>
    </div>
  );
}
