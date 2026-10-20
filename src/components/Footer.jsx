import { Link } from 'react-router';

import { ORGANIZATION_NAME } from '../../shared/constants.js';
import { LogoMark } from './art/Logo.jsx';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__brand">
          <p className="brand brand--footer">
            <LogoMark size={28} />
            <span className="brand__name">Commons</span>
          </p>
          <p>
            The shared resource hub for {ORGANIZATION_NAME}: borrow equipment, book spaces, and get help, all in one
            place.
          </p>
        </div>

        <nav className="site-footer__nav" aria-label="Footer">
          <div>
            <h2 className="site-footer__heading">Use Commons</h2>
            <ul>
              <li>
                <Link to="/catalog">Browse the catalog</Link>
              </li>
              <li>
                <Link to="/requests/new">Request help</Link>
              </li>
              <li>
                <Link to="/dashboard">My dashboard</Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="site-footer__heading">Learn more</h2>
            <ul>
              <li>
                <Link to="/about">How it works</Link>
              </li>
              <li>
                <Link to="/about#faq">Frequently asked questions</Link>
              </li>
              <li>
                <Link to="/about#accessibility">Accessibility</Link>
              </li>
              <li>
                <Link to="/sources">Sources &amp; credits</Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      <div className="container site-footer__legal">
        <p>
          Built from scratch for FBLA Website Coding &amp; Development, 2026–2027. {ORGANIZATION_NAME}, its people,
          and all data shown are fictional.
        </p>
      </div>
    </footer>
  );
}
