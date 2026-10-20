import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';

import { api } from '../api/client.js';
import { useDismiss } from '../hooks/useCommon.js';
import { relativeTime } from '../utils/dates.js';
import { Icon } from './Icon.jsx';

const REFRESH_MS = 30000;

/**
 * The bell in the header. Checks for new notifications every 30 seconds
 * and whenever the user returns to the tab.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ notifications: [], unread: 0 });
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const panelId = useId();
  const location = useLocation();

  const refresh = useCallback(() => {
    api
      .get('/api/notifications')
      .then(setData)
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, REFRESH_MS);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', refresh);
    };
  }, [refresh]);

  // Pages often create notifications (e.g. after reserving), so refresh on navigation.
  useEffect(() => {
    refresh();
    setOpen(false);
  }, [location.pathname, refresh]);

  useDismiss(containerRef, open, (reason) => {
    setOpen(false);
    if (reason === 'escape') buttonRef.current?.focus();
  });

  async function markAllRead() {
    await api.post('/api/notifications/read-all').catch(() => {});
    refresh();
  }

  function markRead(notification) {
    if (!notification.read) {
      api.post(`/api/notifications/${notification.id}/read`).then(refresh, () => {});
    }
  }

  const label = data.unread > 0 ? `Notifications, ${data.unread} unread` : 'Notifications';

  return (
    <div className="popover-anchor" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        className="icon-button bell"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="bell" size={22} title={label} />
        {data.unread > 0 ? (
          <span className="bell__count" aria-hidden="true">
            {data.unread > 9 ? '9+' : data.unread}
          </span>
        ) : null}
      </button>

      <div id={panelId} className="popover popover--notifications" hidden={!open}>
        <div className="popover__header">
          <h2 className="popover__title">Notifications</h2>
          {data.unread > 0 ? (
            <button type="button" className="button button--ghost button--sm" onClick={markAllRead}>
              Mark all as read
            </button>
          ) : null}
        </div>

        {data.notifications.length === 0 ? (
          <p className="popover__empty">You’re all caught up.</p>
        ) : (
          <ul className="notification-list">
            {data.notifications.map((notification) => {
              const content = (
                <>
                  <span className="notification__message">{notification.message}</span>
                  <span className="notification__time">{relativeTime(notification.createdAt)}</span>
                </>
              );
              return (
                <li key={notification.id} className={`notification ${notification.read ? '' : 'notification--unread'}`}>
                  {!notification.read ? <span className="sr-only">Unread: </span> : null}
                  {notification.link ? (
                    <Link to={notification.link} className="notification__link" onClick={() => markRead(notification)}>
                      {content}
                    </Link>
                  ) : (
                    <div className="notification__link">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
