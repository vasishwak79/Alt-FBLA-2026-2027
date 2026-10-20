import { useEffect, useRef } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';

import { useAuth } from '../context/AuthContext.jsx';
import { Footer } from './Footer.jsx';
import { Header } from './Header.jsx';
import { Loading, PageHeader } from './Feedback.jsx';

/**
 * The frame shared by every page: skip link, header, main content, footer.
 *
 * In a single-page app the browser does not reload between pages, so screen
 * reader users would not hear that the page changed. After each navigation
 * we move focus to the new page's <h1>, which announces it.
 */
export function Layout() {
  const location = useLocation();
  const mainRef = useRef(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Links such as /sources#pew jump to that section (also on first load).
    if (location.hash) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView();
      isFirstRender.current = false;
      return;
    }

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo(0, 0);
    const heading = mainRef.current?.querySelector('h1');
    (heading ?? mainRef.current)?.focus({ preventScroll: true });
  }, [location.pathname, location.hash]);

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <Header />
      <main id="main" ref={mainRef} tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

/** Protects pages that need a signed-in user (and optionally a staff account). */
export function RequireAuth({ admin = false, children }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <Loading label="Checking your sign-in…" />;

  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (admin && user.role !== 'admin') {
    return (
      <PageHeader
        eyebrow="Staff only"
        title="You need a staff account for this page"
        description="The staff console is only available to resource managers. If you think this is a mistake, contact the library help desk."
      />
    );
  }

  return children;
}
