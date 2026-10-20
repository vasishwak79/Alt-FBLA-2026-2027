import { useState } from 'react';
import { Link } from 'react-router';

import { RESOURCE_CATEGORIES, RESOURCE_STATUSES, labelFor } from '../../../shared/constants.js';
import { api } from '../../api/client.js';
import { Badge } from '../../components/Badges.jsx';
import { Field, FormError } from '../../components/Field.jsx';
import { ErrorState, Loading } from '../../components/Feedback.jsx';
import { Icon } from '../../components/Icon.jsx';
import { Modal } from '../../components/Modal.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useApi } from '../../hooks/useApi.js';

const EMPTY_RESOURCE = {
  name: '',
  category: 'technology',
  location: '',
  quantity: '1',
  capacity: '',
  maxHours: '4',
  requiresApproval: false,
  status: 'active',
  tags: '',
  description: '',
};

const STATUS_TONES = { active: 'success', maintenance: 'warning', retired: 'neutral' };

function toFormValues(resource) {
  if (!resource) return EMPTY_RESOURCE;
  return {
    name: resource.name,
    category: resource.category,
    location: resource.location,
    quantity: String(resource.quantity),
    capacity: resource.capacity ? String(resource.capacity) : '',
    maxHours: String(resource.maxHours),
    requiresApproval: resource.requiresApproval,
    status: resource.status,
    tags: resource.tags.join(', '),
    description: resource.description,
  };
}

/** Add or edit a resource. All rules are checked again on the server. */
function ResourceForm({ resource, onSaved, onCancel }) {
  const { showToast } = useToast();
  const [values, setValues] = useState(() => toFormValues(resource));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const isSpace = values.category === 'spaces';

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    const body = {
      ...values,
      quantity: Number(values.quantity),
      maxHours: Number(values.maxHours),
      capacity: isSpace && values.capacity ? Number(values.capacity) : null,
    };
    try {
      if (resource) {
        await api.put(`/api/resources/${resource.id}`, body);
        showToast(`${values.name} was updated.`);
      } else {
        await api.post('/api/resources', body);
        showToast(`${values.name} was added to the catalog.`);
      }
      onSaved();
    } catch (error) {
      setErrors(error.fields ?? {});
      setFormError(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form id="resource-form" onSubmit={handleSubmit} noValidate className="stack">
      <FormError message={formError} />
      <Field label="Name" error={errors.name} required>
        {(props) => <input {...props} className="input" maxLength={80} value={values.name} onChange={(event) => update('name', event.target.value)} />}
      </Field>

      <div className="field-row">
        <Field label="Category" error={errors.category} required>
          {(props) => (
            <select {...props} className="input" value={values.category} onChange={(event) => update('category', event.target.value)}>
              {RESOURCE_CATEGORIES.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Status" error={errors.status} required>
          {(props) => (
            <select {...props} className="input" value={values.status} onChange={(event) => update('status', event.target.value)}>
              {RESOURCE_STATUSES.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </Field>
      </div>

      <Field label="Location" error={errors.location} required>
        {(props) => (
          <input {...props} className="input" maxLength={80} value={values.location} onChange={(event) => update('location', event.target.value)} />
        )}
      </Field>

      <div className="field-row field-row--3">
        <Field label={isSpace ? 'Rooms' : 'Units'} hint={isSpace ? 'Usually 1' : 'How many exist'} error={errors.quantity} required>
          {(props) => (
            <input {...props} type="number" min="1" max="500" className="input" value={values.quantity} onChange={(event) => update('quantity', event.target.value)} />
          )}
        </Field>
        <Field label="Longest booking" hint="In hours" error={errors.maxHours} required>
          {(props) => (
            <input {...props} type="number" min="1" max="336" className="input" value={values.maxHours} onChange={(event) => update('maxHours', event.target.value)} />
          )}
        </Field>
        {isSpace ? (
          <Field label="Seats" hint="Maximum people" error={errors.capacity} optional>
            {(props) => (
              <input {...props} type="number" min="1" max="2000" className="input" value={values.capacity} onChange={(event) => update('capacity', event.target.value)} />
            )}
          </Field>
        ) : null}
      </div>

      <label className="checkbox">
        <input type="checkbox" checked={values.requiresApproval} onChange={(event) => update('requiresApproval', event.target.checked)} />
        <span>
          <strong>Requires staff approval</strong>
          <small>Reservations wait in the approval queue instead of being confirmed instantly.</small>
        </span>
      </label>

      <Field label="Description" error={errors.description} optional>
        {(props) => (
          <textarea {...props} className="input" rows={3} maxLength={1000} value={values.description} onChange={(event) => update('description', event.target.value)} />
        )}
      </Field>
      <Field label="Search tags" hint="Separate with commas, e.g. camera, video, interviews" error={errors.tags} optional>
        {(props) => <input {...props} className="input" maxLength={200} value={values.tags} onChange={(event) => update('tags', event.target.value)} />}
      </Field>

      <div className="form-actions">
        <button type="button" className="button button--secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="button button--primary" disabled={saving}>
          {saving ? 'Saving…' : resource ? 'Save changes' : 'Add resource'}
        </button>
      </div>
    </form>
  );
}

export function InventoryAdmin({ onChanged }) {
  const { data, error, loading, reload } = useApi('/api/resources?all=1');
  const [editing, setEditing] = useState(null); // null = closed, 'new', or a resource
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const term = search.trim().toLowerCase();
  const rows = (data?.resources ?? []).filter(
    (resource) =>
      (!category || resource.category === category) &&
      (!term || `${resource.name} ${resource.location}`.toLowerCase().includes(term)),
  );

  function handleSaved() {
    setEditing(null);
    reload();
    onChanged();
  }

  return (
    <div>
      <div className="admin-toolbar">
        <div className="search-field search-field--compact">
          <label htmlFor="inventory-search" className="sr-only">
            Search inventory
          </label>
          <Icon name="search" className="search-field__icon" />
          <input
            id="inventory-search"
            type="search"
            className="input search-field__input"
            placeholder="Search by name or location"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="inline-field">
          <label htmlFor="inventory-category">Category</label>
          <select id="inventory-category" className="input input--compact" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">All categories</option>
            {RESOURCE_CATEGORIES.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="button button--primary" onClick={() => setEditing('new')}>
          <Icon name="plus" size={18} />
          Add resource
        </button>
      </div>

      {error ? <ErrorState error={error} onRetry={reload} /> : null}
      {loading && !data ? <Loading /> : null}

      {data ? (
        <div className="table-wrap">
          <table className="data-table data-table--responsive">
            <caption className="sr-only">Inventory ({rows.length} resources)</caption>
            <thead>
              <tr>
                <th scope="col">Resource</th>
                <th scope="col">Category</th>
                <th scope="col" className="numeric">
                  Free now
                </th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((resource) => (
                <tr key={resource.id}>
                  <th scope="row" data-label="Resource">
                    <Link to={`/catalog/${resource.id}`} className="table-title">
                      {resource.name}
                    </Link>
                    <span className="table-sub">
                      {resource.location}
                      {resource.requiresApproval ? ' · Needs approval' : ''}
                    </span>
                  </th>
                  <td data-label="Category">{labelFor(RESOURCE_CATEGORIES, resource.category)}</td>
                  <td data-label="Free now" className="numeric">
                    {resource.availableNow} / {resource.quantity}
                  </td>
                  <td data-label="Status">
                    <Badge tone={STATUS_TONES[resource.status]}>{labelFor(RESOURCE_STATUSES, resource.status)}</Badge>
                  </td>
                  <td className="table-actions">
                    <button type="button" className="button button--sm button--secondary" onClick={() => setEditing(resource)}>
                      <Icon name="edit" size={16} />
                      Edit<span className="sr-only"> {resource.name}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add a resource' : `Edit ${editing?.name ?? ''}`}
        size="lg"
      >
        <ResourceForm resource={editing === 'new' ? null : editing} onSaved={handleSaved} onCancel={() => setEditing(null)} />
      </Modal>
    </div>
  );
}
