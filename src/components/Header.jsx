import { useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router';

import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useDismiss } from '../hooks/useCommon.js';
import { AccessibilityMenu } from './AccessibilityMenu.jsx';
import { LogoMark } from './art/Logo.jsx';
import { Icon } from './Icon.jsx';
import { NotificationBell } from './NotificationBell.jsx';

function initials(name) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function UserMenu({ user }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const panelId = useId();
  const { logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => setOpen(false), [location.pathname]);
  useDismiss(containerRef, open, (reason) => {
    setOpen(false);
    if (reason === 'escape') buttonRef.current?.focus();
  });

  async function handleSignOut() {
    await logout();
    showToast('You are signed out. See you next time!', { tone: 'info' });
    navigate('/');
  }

  return (
    <div className="popover-anchor" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        className="avatar-button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="avatar" aria-hidden="true">
          {initials(user.name)}
        </span>
        <span className="sr-only">Account menu for {user.name}</span>
      </button>

      <div id={panelId} className="popover popover--account" hidden={!open}>
        <div className="account-summary">
          <span className="avatar avatar--lg" aria-hidden="true">
            {initials(user.name)}
          </span>
          <div>
            <p className="account-summary__name">{user.name}</p>
            <p className="account-summary__detail">{user.title ?? user.email}</p>
            {user.role === 'admin' ? <p className="account-summary__role">Staff account</p> : null}
          </div>
        </div>
        <ul className="menu-list">
          <li>
            <Link to="/dashboard">
              <Icon name="home" size={18} />
              My dashboard
            </Link>
          </li>
          <li>
            <Link to="/requests">
              <Icon name="clipboard" size={18} />
              My requests
            </Link>
          </li>
          {user.role === 'admin' ? (
            <li>
              <Link to="/admin">
                <Icon name="chart" size={18} />
                Staff console
              </Link>
            </li>
          ) : null}
          <li>
            <button type="button" onClick={handleSignOut}>
              <Icon name="logout" size={18} />
              Sign out
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}

/** Site header with the logo, main navigation, and account controls. */
export function Header() {
  const { user, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const headerRef = useRef(null);

  // Close the mobile menu after navigating or pressing Escape.
  useEffect(() => setMenuOpen(false), [location.pathname]);
  useDismiss(headerRef, menuOpen, () => setMenuOpen(false));

  const links = [
    { to: '/catalog', label: 'Catalog' },
    { to: '/requests', label: 'Requests' },
    ...(user ? [{ to: '/dashboard', label: 'Dashboard' }] : []),
    ...(isAdmin ? [{ to: '/admin', label: 'Staff console' }] : []),
    { to: '/about', label: 'About' },
    { to: '/sources', label: 'Sources' },
  ];

  return (
    <header className="site-header" ref={headerRef}>
      <div className="container site-header__inner">
        <Link to="/" className="brand">
          <LogoMark />
          <span className="brand__name">Commons</span>
          <span className="sr-only">, home page</span>
        </Link>

        <nav className={`primary-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main">
          <ul className="primary-nav__list" id="primary-nav-list">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} className="primary-nav__link">
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-header__actions">
          <AccessibilityMenu />
          {user ? <NotificationBell /> : null}
          {user ? (
            <UserMenu user={user} />
          ) : (
            <Link to="/login" className="button button--primary button--sm site-header__signin">
              Sign in
            </Link>
          )}
          <button
            type="button"
            className="icon-button nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="primary-nav-list"
            onClick={() => setMenuOpen((value) => !value)}
          >
            <Icon name={menuOpen ? 'x' : 'menu'} size={22} title={menuOpen ? 'Close menu' : 'Open menu'} />
          </button>
        </div>
      </div>
    </header>
  );
}
