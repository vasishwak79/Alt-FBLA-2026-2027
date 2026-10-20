import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { PRIORITIES, REQUEST_CATEGORIES } from '../../shared/constants.js';
import { api } from '../api/client.js';
import { Field, FormError } from '../components/Field.jsx';
import { PageHeader } from '../components/Feedback.jsx';
import { CATEGORY_ICONS, Icon } from '../components/Icon.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDocumentTitle } from '../hooks/useCommon.js';

const CATEGORY_HINTS = {
  it: 'Laptops, Wi-Fi, accounts, printers',
  facilities: 'Repairs, lighting, heating, furniture',
  av: 'Speakers, microphones, projectors',
  supplies: 'Paper, markers, restocking',
  other: 'Ideas, questions, anything else',
};

const PRIORITY_HINTS = {
  low: 'Whenever staff have time',
  normal: 'Within a few school days',
  high: 'Affecting a class or event soon',
  urgent: 'Safety issue or happening right now',
};

const DESCRIPTION_MAX = 2000;

export default function NewRequest() {
  useDocumentTitle('New request');
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const formRef = useRef(null);
  const resources = useApi('/api/resources');

  const [values, setValues] = useState({
    category: REQUEST_CATEGORIES.some((option) => option.id === params.get('category')) ? params.get('category') : '',
    title: '',
    location: '',
    priority: 'normal',
    description: '',
    resourceId: params.get('resource') ?? '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // If the request came from a resource page, suggest that resource's location.
  const linkedResource = resources.data?.resources.find((resource) => String(resource.id) === values.resourceId);
  useEffect(() => {
    if (linkedResource) {
      setValues((current) => (current.location ? current : { ...current, location: linkedResource.location }));
    }
  }, [linkedResource]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
    }
  }, [errors]);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    const problems = {};
    if (!values.category) problems.category = 'Choose the type of request.';
    if (values.title.trim().length < 5) problems.title = 'Write a short summary (at least 5 characters).';
    if (values.location.trim().length < 2) problems.location = 'Tell us where this is.';
    if (values.description.trim().length < 10) problems.description = 'Add a few details (at least 10 characters).';
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;

    setSubmitting(true);
    try {
      const { request } = await api.post('/api/requests', {
        ...values,
        resourceId: values.resourceId ? Number(values.resourceId) : null,
      });
      showToast(`Request ${request.code} submitted. Staff have been notified.`);
      navigate(`/requests/${request.id}`);
    } catch (error) {
      setErrors(error.fields ?? {});
      setFormError(error.message);
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Service requests"
        title="Submit a request"
        description="Tell us what you need. Staff are notified right away, and you can follow progress and reply on the request page."
      />

      <div className="container narrow section--tight">
        <form className="card form-card" onSubmit={handleSubmit} ref={formRef} noValidate>
          <FormError message={formError} />

          <fieldset className={`choice-group ${errors.category ? 'field--invalid' : ''}`} aria-describedby={errors.category ? 'category-error' : undefined}>
            <legend className="field__label">
              What kind of help do you need? <span aria-hidden="true">*</span>
            </legend>
            <div className="choice-grid">
              {REQUEST_CATEGORIES.map((option, index) => (
                <label key={option.id} className="choice-card">
                  <input
                    type="radio"
                    name="category"
                    value={option.id}
                    checked={values.category === option.id}
                    onChange={() => update('category', option.id)}
                    aria-invalid={errors.category && index === 0 ? true : undefined}
                    required
                  />
                  <span className="choice-card__content">
                    <Icon name={CATEGORY_ICONS[option.id]} size={22} />
                    <span className="choice-card__label">{option.label}</span>
                    <span className="choice-card__hint">{CATEGORY_HINTS[option.id]}</span>
                  </span>
                </label>
              ))}
            </div>
            {errors.category ? (
              <p id="category-error" className="field__error">
                <Icon name="alert" size={16} />
                {errors.category}
              </p>
            ) : null}
          </fieldset>

          <Field label="Summary" hint="One line, like “Projector in Room 118 won’t turn on.”" error={errors.title} required>
            {(props) => (
              <input {...props} className="input" maxLength={100} value={values.title} onChange={(event) => update('title', event.target.value)} />
            )}
          </Field>

          <div className="field-row">
            <Field label="Location" error={errors.location} required>
              {(props) => (
                <input
                  {...props}
                  className="input"
                  maxLength={80}
                  placeholder="Room or area"
                  value={values.location}
                  onChange={(event) => update('location', event.target.value)}
                />
              )}
            </Field>
            <Field label="Related resource" error={errors.resourceId} optional>
              {(props) => (
                <select {...props} className="input" value={values.resourceId} onChange={(event) => update('resourceId', event.target.value)}>
                  <option value="">None</option>
                  {(resources.data?.resources ?? []).map((resource) => (
                    <option key={resource.id} value={String(resource.id)}>
                      {resource.name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>

          <fieldset className="choice-group">
            <legend className="field__label">How urgent is it?</legend>
            <div className="priority-options">
              {PRIORITIES.map((option) => (
                <label key={option.id} className={`priority-option priority-option--${option.id}`}>
                  <input
                    type="radio"
                    name="priority"
                    value={option.id}
                    checked={values.priority === option.id}
                    onChange={() => update('priority', option.id)}
                  />
                  <span>
                    <strong>{option.label}</strong>
                    <small>{PRIORITY_HINTS[option.id]}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <Field
            label="Details"
            hint={`What happened, when it started, and anything you already tried. ${values.description.length}/${DESCRIPTION_MAX} characters.`}
            error={errors.description}
            required
          >
            {(props) => (
              <textarea
                {...props}
                className="input"
                rows={6}
                maxLength={DESCRIPTION_MAX}
                value={values.description}
                onChange={(event) => update('description', event.target.value)}
              />
            )}
          </Field>

          {values.priority === 'urgent' ? (
            <div className="alert alert--warning">
              <Icon name="alert" className="alert__icon" />
              <div className="alert__body">
                <p>If anyone is in danger, contact the main office or call 911 first. Then submit this request.</p>
              </div>
            </div>
          ) : null}

          <div className="form-actions">
            <Link to="/requests" className="button button--ghost">
              Cancel
            </Link>
            <button type="submit" className="button button--primary" disabled={submitting}>
              <Icon name="send" size={18} />
              {submitting ? 'Submitting…' : 'Submit request'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
