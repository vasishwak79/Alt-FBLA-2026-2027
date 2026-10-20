import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';

import { PRIORITIES, REQUEST_CATEGORIES, REQUEST_STATUSES, labelFor } from '../../shared/constants.js';
import { api } from '../api/client.js';
import { PriorityBadge, RequestStatusBadge } from '../components/Badges.jsx';
import { Field, FormError } from '../components/Field.jsx';
import { ErrorState, Loading, PageHeader } from '../components/Feedback.jsx';
import { CATEGORY_ICONS, Icon } from '../components/Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDocumentTitle } from '../hooks/useCommon.js';
import { formatDateTime, relativeTime } from '../utils/dates.js';

const PROGRESS = [
  { status: 'open', label: 'Submitted' },
  { status: 'in_progress', label: 'In progress' },
  { status: 'resolved', label: 'Resolved' },
];

/** Shows where a request is in its lifecycle: Submitted → In progress → Resolved. */
function ProgressTracker({ request }) {
  const order = ['open', 'in_progress', 'resolved', 'closed'];
  const current = Math.min(order.indexOf(request.status), 2);
  return (
    <ol className="progress" aria-label="Request progress">
      {PROGRESS.map((step, index) => {
        const state = index < current ? 'done' : index === current ? 'current' : 'upcoming';
        return (
          <li key={step.status} className={`progress__step progress__step--${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="progress__marker" aria-hidden="true">
              {state === 'done' || (state === 'current' && index === 2) ? <Icon name="check" size={16} /> : index + 1}
            </span>
            <span className="progress__label">
              {step.label}
              <span className="sr-only">{state === 'done' ? ' (complete)' : state === 'current' ? ' (current step)' : ' (not started)'}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** Staff-only panel for changing the status and priority. */
function StaffControls({ request, onUpdated }) {
  const { showToast } = useToast();
  const [status, setStatus] = useState(request.status);
  const [priority, setPriority] = useState(request.priority);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStatus(request.status);
    setPriority(request.priority);
  }, [request.status, request.priority]);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/api/requests/${request.id}`, { status, priority });
      showToast(`${request.code} updated. The requester has been notified.`);
      onUpdated();
    } catch (error) {
      showToast(error.message, { tone: 'error' });
    } finally {
      setSaving(false);
    }
  }

  const changed = status !== request.status || priority !== request.priority;

  return (
    <form className="card staff-panel" onSubmit={save}>
      <h2 className="card__title">
        <Icon name="shield" size={18} /> Staff controls
      </h2>
      <Field label="Status">
        {(props) => (
          <select {...props} className="input" value={status} onChange={(event) => setStatus(event.target.value)}>
            {REQUEST_STATUSES.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Priority">
        {(props) => (
          <select {...props} className="input" value={priority} onChange={(event) => setPriority(event.target.value)}>
            {PRIORITIES.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </Field>
      <button type="submit" className="button button--primary button--block" disabled={!changed || saving}>
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  );
}

export default function RequestDetail() {
  const { id } = useParams();
  const { user, isAdmin } = useAuth();
  const { showToast } = useToast();
  const { data, error, loading, reload } = useApi(`/api/requests/${id}`);
  const [reply, setReply] = useState('');
  const [replyError, setReplyError] = useState('');
  const [sending, setSending] = useState(false);

  const request = data?.request;
  useDocumentTitle(request ? `${request.code}: ${request.title}` : 'Request');

  if (loading && !request) {
    return (
      <>
        <PageHeader title="Loading request…" />
        <Loading />
      </>
    );
  }

  if (error || !request) {
    return (
      <>
        <PageHeader title="Request not found" />
        <div className="container section--tight">
          <ErrorState error={error} onRetry={reload} />
        </div>
      </>
    );
  }

  async function sendReply(event) {
    event.preventDefault();
    if (!reply.trim()) {
      setReplyError('Write a message before sending.');
      return;
    }
    setSending(true);
    setReplyError('');
    try {
      await api.post(`/api/requests/${request.id}/comments`, { body: reply });
      setReply('');
      showToast('Reply sent.');
      reload();
    } catch (sendError) {
      setReplyError(sendError.message);
    } finally {
      setSending(false);
    }
  }

  const comments = data.comments;
  const closed = request.status === 'closed';

  return (
    <>
      <PageHeader
        eyebrow={`${request.code} · ${labelFor(REQUEST_CATEGORIES, request.category)}`}
        title={request.title}
        actions={
          <Link to={isAdmin ? '/admin?tab=requests' : '/requests'} className="button button--ghost">
            <Icon name="arrow-left" size={18} />
            {isAdmin ? 'Request board' : 'All my requests'}
          </Link>
        }
      >
        <div className="page-header__badges">
          <RequestStatusBadge status={request.status} />
          <PriorityBadge priority={request.priority} />
        </div>
      </PageHeader>

      <div className="container detail section--tight">
        <div className="detail__main">
          <ProgressTracker request={request} />

          <section className="card" aria-labelledby="details-heading">
            <h2 id="details-heading" className="card__title">
              <Icon name={CATEGORY_ICONS[request.category]} size={18} /> Details
            </h2>
            <p className="prewrap">{request.description}</p>
            <dl className="meta-grid">
              <div>
                <dt>Location</dt>
                <dd>{request.location}</dd>
              </div>
              <div>
                <dt>Submitted by</dt>
                <dd>{request.userName}</dd>
              </div>
              <div>
                <dt>Submitted</dt>
                <dd>{formatDateTime(request.createdAt)}</dd>
              </div>
              <div>
                <dt>Handled by</dt>
                <dd>{request.assigneeName ?? 'Not assigned yet'}</dd>
              </div>
              {request.resourceName ? (
                <div>
                  <dt>Related resource</dt>
                  <dd>
                    <Link to={`/catalog/${request.resourceId}`}>{request.resourceName}</Link>
                  </dd>
                </div>
              ) : null}
              {request.resolvedAt ? (
                <div>
                  <dt>Resolved</dt>
                  <dd>{formatDateTime(request.resolvedAt)}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section aria-labelledby="conversation-heading">
            <h2 id="conversation-heading" className="section-title">
              Conversation
            </h2>
            {comments.length === 0 ? <p className="muted">No replies yet. Staff will respond here.</p> : null}
            <ol className="thread">
              {comments.map((comment) => (
                <li key={comment.id} className={`message ${comment.userId === user?.id ? 'message--mine' : ''}`}>
                  <div className="message__header">
                    <span className="message__author">{comment.userName}</span>
                    {comment.isStaff ? <span className="badge badge--info">Staff</span> : null}
                    <time className="message__time" dateTime={new Date(comment.createdAt).toISOString()}>
                      {relativeTime(comment.createdAt)}
                    </time>
                  </div>
                  <p className="message__body prewrap">{comment.body}</p>
                </li>
              ))}
            </ol>

            {closed ? (
              <p className="muted">This request is closed. Submit a new request if you still need help.</p>
            ) : (
              <form className="reply-form" onSubmit={sendReply} noValidate>
                <FormError message={replyError} />
                <Field label="Add a reply">
                  {(props) => (
                    <textarea
                      {...props}
                      className="input"
                      rows={3}
                      maxLength={1000}
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      placeholder={isAdmin ? 'Let the requester know what is happening…' : 'Add more details or answer a question…'}
                    />
                  )}
                </Field>
                <button type="submit" className="button button--primary" disabled={sending}>
                  <Icon name="send" size={18} />
                  {sending ? 'Sending…' : 'Send reply'}
                </button>
              </form>
            )}
          </section>
        </div>

        {isAdmin ? (
          <aside className="detail__aside" aria-label="Staff controls">
            <StaffControls request={request} onUpdated={reload} />
          </aside>
        ) : null}
      </div>
    </>
  );
}
