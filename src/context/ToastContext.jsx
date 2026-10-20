import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

import { Icon } from '../components/Icon.jsx';

const ToastContext = createContext(null);

const TONE_ICONS = { success: 'check-circle', error: 'alert', info: 'info' };

/**
 * Short pop-up messages ("Reservation confirmed"). The container is an
 * ARIA live region, so screen readers announce each message as it appears.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, { tone = 'success', duration = 5000 } = {}) => {
      const id = nextId.current++;
      setToasts((current) => [...current.slice(-2), { id, message, tone }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext value={value}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.tone}`}>
            <Icon name={TONE_ICONS[toast.tone]} className="toast__icon" />
            <p className="toast__message">{toast.message}</p>
            <button type="button" className="icon-button icon-button--sm" onClick={() => dismiss(toast.id)}>
              <Icon name="x" title="Dismiss message" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
