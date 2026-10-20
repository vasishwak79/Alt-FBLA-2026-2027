import { useCallback, useEffect, useState } from 'react';

import { api } from '../api/client.js';

/**
 * Loads JSON from the API whenever `path` changes.
 * Returns { data, error, loading, reload }. While reloading, the previous
 * data stays on screen so the page does not flicker.
 * Pass `null` as the path to skip loading.
 */
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: Boolean(path) });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!path) {
      setState({ data: null, error: null, loading: false });
      return undefined;
    }

    let cancelled = false;
    setState((previous) => ({ data: previous.data, error: null, loading: true }));

    api
      .get(path)
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false });
      })
      .catch((error) => {
        if (!cancelled) setState({ data: null, error, loading: false });
      });

    // Ignore a slow response if the user has already moved on.
    return () => {
      cancelled = true;
    };
  }, [path, version]);

  const reload = useCallback(() => setVersion((value) => value + 1), []);
  return { ...state, reload };
}
