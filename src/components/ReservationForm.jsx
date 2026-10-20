import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';

import { MAX_DAYS_AHEAD, reservationCode } from '../../shared/constants.js';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useDebouncedValue } from '../hooks/useCommon.js';
import {
  addDays,
  combineDateTime,
  formatDuration,
  formatRange,
  hoursBetween,
  openingHours,
  startOfDay,
  timeOptions,
  toDateInput,
  toTimeInput,
} from '../utils/dates.js';
import { Field, FormError } from './Field.jsx';
import { Icon } from './Icon.jsx';

const TIME_OPTIONS = timeOptions();
const START_OPTIONS = TIME_OPTIONS.slice(0, -1);
const HOUR = 60 * 60 * 1000;

/** Shown in place of the form when the visitor is not signed in. */
function SignInPrompt() {
  const location = useLocation();
  return (
    <div className="reserve-card reserve-card--prompt">
      <Icon name="lock" size={28} className="reserve-card__icon" />
      <h2 className="section-title">Sign in to reserve</h2>
      <p>Anyone can browse availability. Sign in with your school account to make a reservation.</p>
      <Link className="button button--primary button--block" to={`/login?next=${encodeURIComponent(location.pathname)}`}>
        Sign in
      </Link>
      <p className="reserve-card__small">
        New here? <Link to="/register">Create an account</Link>
      </p>
    </div>
  );
}

/**
 * Reservation form with a live availability check. As soon as the time and
 * quantity are filled in, it asks the server whether the request would be
 * accepted and explains why not, before the member presses "Reserve".
 */
export function ReservationForm({ resource, pickedSlot, onRangeChange, onReserved }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const formRef = useRef(null);
  const successRef = useRef(null);

  const multiDay = resource.maxHours > 12;
  const today = toDateInput(Date.now());
  const lastDay = toDateInput(addDays(startOfDay(), MAX_DAYS_AHEAD));

  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState(today);
  const [endTime, setEndTime] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [purpose, setPurpose] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [check, setCheck] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(null);

  const start = combineDateTime(date, startTime);
  const end = combineDateTime(multiDay ? endDate : date, endTime);
  const units = Number(quantity) || 1;

  // A slot chosen on the timeline fills in the date and times.
  useEffect(() => {
    if (!pickedSlot) return;
    const { close } = openingHours(pickedSlot.start);
    const suggestedEnd = Math.min(pickedSlot.start + HOUR, close);
    setDate(toDateInput(pickedSlot.start));
    setStartTime(toTimeInput(pickedSlot.start));
    setEndDate(toDateInput(suggestedEnd));
    setEndTime(toTimeInput(suggestedEnd));
    setErrors({});
    setCreated(null);
  }, [pickedSlot]);

  // Tell the page which time range is selected so the timeline can highlight it.
  useEffect(() => {
    onRangeChange(start && end && end > start ? { start, end } : null);
  }, [start, end, onRangeChange]);

  // Live availability check, sent once the user pauses typing.
  const checkKey = useDebouncedValue(start && end ? `${start}-${end}-${units}` : '', 350);
  useEffect(() => {
    if (!checkKey || !user || resource.status !== 'active') {
      setCheck(null);
      return undefined;
    }
    let cancelled = false;
    const [checkStart, checkEnd, checkUnits] = checkKey.split('-');
    api
      .get(`/api/resources/${resource.id}/check?start=${checkStart}&end=${checkEnd}&quantity=${checkUnits}`)
      .then((result) => !cancelled && setCheck(result))
      .catch(() => !cancelled && setCheck(null));
    return () => {
      cancelled = true;
    };
  }, [checkKey, resource.id, resource.status, user]);

  // Move keyboard focus to the first field with a problem.
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      formRef.current?.querySelector('[aria-invalid="true"]')?.focus();
    }
  }, [errors]);

  useEffect(() => {
    if (created) successRef.current?.focus();
  }, [created]);

  if (!user) return <SignInPrompt />;

  if (resource.status !== 'active') {
    return (
      <div className="reserve-card reserve-card--prompt">
        <Icon name="wrench" size={28} className="reserve-card__icon" />
        <h2 className="section-title">Not available to reserve</h2>
        <p>This resource is under maintenance. Check back soon, or browse similar items in the catalog.</p>
        <Link className="button button--secondary button--block" to={`/catalog?category=${resource.category}`}>
          See similar resources
        </Link>
      </div>
    );
  }

  if (created) {
    const pending = created.status === 'pending';
    return (
      <div className="reserve-card reserve-card--success" ref={successRef} tabIndex={-1} role="status">
        <Icon name={pending ? 'clock' : 'check-circle'} size={36} className="reserve-card__icon" />
        <h2 className="section-title">{pending ? 'Request sent for approval' : 'You’re all set!'}</h2>
        <p className="reserve-card__code">{reservationCode(created.id)}</p>
        <p>
          {resource.name}
          {created.quantity > 1 ? ` × ${created.quantity}` : ''}
          <br />
          {formatRange(created.start, created.end)}
        </p>
        <p className="reserve-card__small">
          {pending
            ? 'Staff will review your request and you will get a notification with their decision.'
            : resource.kind === 'space'
              ? `Your room is booked. Head to ${resource.location} at your start time.`
              : `Pick it up at ${resource.location}. Please return it on time so others can use it.`}
        </p>
        <Link className="button button--primary button--block" to="/dashboard">
          View my reservations
        </Link>
        <button type="button" className="button button--ghost button--block" onClick={() => setCreated(null)}>
          Make another reservation
        </button>
      </div>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    const problems = {};
    if (!date) problems.date = 'Choose a date.';
    if (!startTime) problems.start = 'Choose a start time.';
    if (!endTime) problems.end = 'Choose an end time.';
    if (purpose.trim().length < 3) problems.purpose = 'Briefly describe what this is for (at least 3 characters).';
    setErrors(problems);
    if (Object.keys(problems).length > 0) return;

    setSubmitting(true);
    try {
      const { reservation } = await api.post('/api/reservations', {
        resourceId: resource.id,
        start,
        end,
        quantity: units,
        purpose,
      });
      setCreated(reservation);
      // Clear the times so the timeline stops highlighting the old selection.
      setStartTime('');
      setEndTime('');
      setPurpose('');
      onReserved(reservation);
      showToast(
        reservation.status === 'pending'
          ? `Request sent! ${reservationCode(reservation.id)} is waiting for staff approval.`
          : `Reserved! ${reservationCode(reservation.id)} is confirmed.`,
      );
    } catch (error) {
      setErrors(error.fields ?? {});
      setFormError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  const endOptions = multiDay ? TIME_OPTIONS.slice(1) : TIME_OPTIONS.filter((option) => !startTime || option.value > startTime);
  const duration = start && end && end > start ? hoursBetween(start, end) : null;

  return (
    <form className="reserve-card" onSubmit={handleSubmit} ref={formRef} noValidate>
      <h2 className="section-title">Reserve {resource.kind === 'space' ? 'this space' : 'this item'}</h2>
      <p className="reserve-card__small">
        {resource.requiresApproval
          ? 'Staff approve requests for this resource, usually within one school day.'
          : 'Reservations are confirmed instantly.'}{' '}
        Up to {formatDuration(resource.maxHours)} at a time.
      </p>

      <FormError message={formError} />

      <Field label={multiDay ? 'Pick-up date' : 'Date'} error={errors.date} required>
        {(props) => (
          <input
            {...props}
            type="date"
            className="input"
            value={date}
            min={today}
            max={lastDay}
            onChange={(event) => {
              setDate(event.target.value);
              if (!multiDay || endDate < event.target.value) setEndDate(event.target.value);
            }}
          />
        )}
      </Field>

      <div className="field-row">
        <Field label={multiDay ? 'Pick-up time' : 'Start time'} error={errors.start} required>
          {(props) => (
            <select {...props} className="input" value={startTime} onChange={(event) => setStartTime(event.target.value)}>
              <option value="">Choose…</option>
              {START_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </Field>

        {multiDay ? null : (
          <Field label="End time" error={errors.end} required>
            {(props) => (
              <select {...props} className="input" value={endTime} onChange={(event) => setEndTime(event.target.value)}>
                <option value="">Choose…</option>
                {endOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
        )}
      </div>

      {multiDay ? (
        <div className="field-row">
          <Field label="Return date" error={errors.endDate} required>
            {(props) => (
              <input
                {...props}
                type="date"
                className="input"
                value={endDate}
                min={date || today}
                onChange={(event) => setEndDate(event.target.value)}
              />
            )}
          </Field>
          <Field label="Return time" error={errors.end} required>
            {(props) => (
              <select {...props} className="input" value={endTime} onChange={(event) => setEndTime(event.target.value)}>
                <option value="">Choose…</option>
                {endOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </Field>
        </div>
      ) : null}

      {resource.quantity > 1 ? (
        <Field label="How many?" hint={`Up to ${resource.quantity}.`} error={errors.quantity} required>
          {(props) => (
            <input
              {...props}
              type="number"
              inputMode="numeric"
              className="input input--short"
              min="1"
              max={resource.quantity}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          )}
        </Field>
      ) : null}

      <Field label="What is it for?" hint="This helps staff plan and approve requests." error={errors.purpose} required>
        {(props) => (
          <textarea
            {...props}
            className="input"
            rows={3}
            maxLength={300}
            value={purpose}
            placeholder="Example: Group project for AP Biology"
            onChange={(event) => setPurpose(event.target.value)}
          />
        )}
      </Field>

      <div className="availability-check" role="status" aria-live="polite">
        {check?.ok ? (
          <p className="availability-check__ok">
            <Icon name="check-circle" size={18} />
            {resource.quantity > 1 ? `${check.available} of ${check.total} free for this time.` : 'This time is free.'}
            {duration ? ` (${formatDuration(duration)})` : ''}
          </p>
        ) : null}
        {check && !check.ok ? (
          <p className="availability-check__problem">
            <Icon name="alert" size={18} />
            {check.problem}
          </p>
        ) : null}
      </div>

      <button type="submit" className="button button--primary button--block button--lg" disabled={submitting}>
        {submitting ? 'Reserving…' : resource.requiresApproval ? 'Request reservation' : 'Reserve now'}
      </button>
    </form>
  );
}
