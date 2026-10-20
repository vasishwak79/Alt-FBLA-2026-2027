import { useEffect, useRef, useState } from 'react';

/** Sets the browser tab title, e.g. "Catalog · Commons". */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · Commons` : 'Commons · Lakeside High School';
  }, [title]);
}

/** Returns `value`, but only after it has stopped changing for `delay` ms. */
export function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

/**
 * Calls `onDismiss` when the user clicks outside `ref` or presses Escape.
 * Used by dropdown menus and popovers.
 */
export function useDismiss(ref, active, onDismiss) {
  const callback = useRef(onDismiss);
  callback.current = onDismiss;

  useEffect(() => {
    if (!active) return undefined;

    function handlePointer(event) {
      if (ref.current && !ref.current.contains(event.target)) callback.current('outside');
    }
    function handleKey(event) {
      if (event.key === 'Escape') callback.current('escape');
    }

    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [ref, active]);
}

/** The current time, refreshed every `interval` ms so "5 minutes ago" text stays accurate. */
export function useNow(interval = 60000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(timer);
  }, [interval]);
  return now;
}
