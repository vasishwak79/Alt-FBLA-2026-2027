import { Link } from 'react-router';

import { EmptyArt } from '../components/art/EmptyArt.jsx';
import { useDocumentTitle } from '../hooks/useCommon.js';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <div className="container not-found">
      <EmptyArt className="not-found__art" />
      <h1 tabIndex={-1}>We couldn’t find that page</h1>
      <p>The link may be old, or the page may have moved. Try one of these instead:</p>
      <div className="not-found__links">
        <Link to="/" className="button button--primary">
          Go to the home page
        </Link>
        <Link to="/catalog" className="button button--secondary">
          Browse the catalog
        </Link>
      </div>
    </div>
  );
}
