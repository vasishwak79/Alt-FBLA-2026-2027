import { useState } from 'react';

import { api } from '../../api/client.js';
import { Field, FormError } from '../../components/Field.jsx';
import { ErrorState, Loading } from '../../components/Feedback.jsx';
import { Icon } from '../../components/Icon.jsx';
import { ConfirmDialog } from '../../components/Modal.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import { formatDateTime } from '../../utils/dates.js';

export function AnnouncementsAdmin() {
  const { showToast } = useToast();
  const { data, error, loading, reload } = useApi('/api/announcements');
  const [values, setValues] = useState({ title: '', body: '', pinned: false });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    setErrors({});
    try {
      await api.post('/api/announcements', values);
      showToast('Announcement posted. Everyone will see it on the home page and dashboard.');
      setValues({ title: '', body: '', pinned: false });
      reload();
    } catch (saveError) {
      setErrors(saveError.fields ?? {});
      setFormError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  async function confirmRemove() {
    setBusy(true);
    try {
      await api.delete(`/api/announcements/${removing.id}`);
      showToast('Announcement removed.', { tone: 'info' });
      setRemoving(null);
      reload();
    } catch (removeError) {
      showToast(removeError.message, { tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-split">
      <form className="card stack" onSubmit={handleSubmit} noValidate>
        <h2 className="card__title">Post an announcement</h2>
        <FormError message={formError} />
        <Field label="Title" error={errors.title} required>
          {(props) => (
            <input {...props} className="input" maxLength={100} value={values.title} onChange={(event) => setValues({ ...values, title: event.target.value })} />
          )}
        </Field>
        <Field label="Message" error={errors.body} required>
          {(props) => (
            <textarea {...props} className="input" rows={4} maxLength={1000} value={values.body} onChange={(event) => setValues({ ...values, body: event.target.value })} />
          )}
        </Field>
        <label className="checkbox">
          <input type="checkbox" checked={values.pinned} onChange={(event) => setValues({ ...values, pinned: event.target.checked })} />
          <span>
            <strong>Pin to the top</strong>
            <small>Pinned announcements stay first until removed.</small>
          </span>
        </label>
        <button type="submit" className="button button--primary" disabled={saving}>
          <Icon name="megaphone" size={18} />
          {saving ? 'Posting…' : 'Post announcement'}
        </button>
      </form>

      <section aria-labelledby="current-announcements">
        <h2 id="current-announcements" className="section-title">
          Current announcements
        </h2>
        {error ? <ErrorState error={error} onRetry={reload} /> : null}
        {loading && !data ? <Loading /> : null}
        {data?.announcements.length === 0 ? <p className="muted">No announcements yet.</p> : null}
        <ul className="news-list news-list--admin">
          {(data?.announcements ?? []).map((item) => (
            <li key={item.id} className="card">
              <div className="card__header">
                <h3 className="news-list__title">
                  {item.pinned ? <Icon name="pin" size={14} title="Pinned" /> : null} {item.title}
                </h3>
                <button type="button" className="button button--sm button--danger-ghost" onClick={() => setRemoving(item)}>
                  <Icon name="trash" size={16} />
                  Remove<span className="sr-only"> {item.title}</span>
                </button>
              </div>
              <p>{item.body}</p>
              <p className="news-card__meta">
                {item.authorName} · {formatDateTime(item.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <ConfirmDialog
        open={Boolean(removing)}
        title="Remove this announcement?"
        message={removing ? `“${removing.title}” will no longer be shown to anyone.` : ''}
        confirmLabel="Remove"
        busy={busy}
        onConfirm={confirmRemove}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}
