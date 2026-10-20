import { MAX_DAYS_AHEAD } from '../../shared/constants.js';
import { useApi } from '../hooks/useApi.js';
import { addDays, formatLongDate, formatTime, isSameDay, openingHours, startOfDay, toDateInput } from '../utils/dates.js';
import { ErrorState } from './Feedback.jsx';
import { Icon } from './Icon.jsx';

/** Groups a slot as open, limited, full, or past so it can be styled and described. */
function slotLevel(slot, quantity, now) {
  if (slot.end <= now) return 'past';
  if (slot.available === 0) return 'full';
  if (quantity > 1 && slot.available <= Math.max(1, Math.floor(quantity / 4))) return 'limited';
  return 'open';
}

function describeSlot(slot, level, quantity, kind) {
  if (level === 'past') return 'already passed';
  if (level === 'full') return kind === 'space' ? 'booked' : 'none available';
  if (quantity === 1) return 'available';
  return `${slot.available} of ${quantity} available`;
}

/**
 * A day view of availability in 30-minute slots. Choosing a free slot fills
 * in the reservation form. Each slot is a real button, so the timeline works
 * with a keyboard and screen reader, and every state has a text label.
 */
export function AvailabilityTimeline({ resource, day, onDayChange, onPickSlot, selection, refreshKey }) {
  const { open, close } = openingHours(day);
  const { data, error, loading, reload } = useApi(
    `/api/resources/${resource.id}/availability?from=${open}&to=${close}&v=${refreshKey}`,
  );

  const now = Date.now();
  const today = startOfDay(now);
  const lastDay = addDays(today, MAX_DAYS_AHEAD);
  const quantity = resource.quantity;

  return (
    <section className="timeline-card" aria-labelledby="timeline-heading">
      <div className="timeline-card__header">
        <div>
          <h2 id="timeline-heading" className="section-title">
            Availability
          </h2>
          <p className="timeline-card__date" aria-live="polite">
            {formatLongDate(day)}
            {isSameDay(day, now) ? ' (today)' : ''}
          </p>
        </div>
        <div className="timeline-card__nav">
          <button
            type="button"
            className="icon-button icon-button--bordered"
            onClick={() => onDayChange(addDays(day, -1))}
            disabled={day <= today}
          >
            <Icon name="chevron-left" title="Previous day" />
          </button>
          <label className="sr-only" htmlFor="timeline-date">
            Choose a date
          </label>
          <input
            id="timeline-date"
            type="date"
            className="input input--compact"
            value={toDateInput(day)}
            min={toDateInput(today)}
            max={toDateInput(lastDay)}
            onChange={(event) => {
              if (event.target.value) {
                const [year, month, date] = event.target.value.split('-').map(Number);
                onDayChange(new Date(year, month - 1, date).getTime());
              }
            }}
          />
          <button
            type="button"
            className="icon-button icon-button--bordered"
            onClick={() => onDayChange(addDays(day, 1))}
            disabled={day >= lastDay}
          >
            <Icon name="chevron-right" title="Next day" />
          </button>
        </div>
      </div>

      {error ? <ErrorState error={error} onRetry={reload} /> : null}

      {data ? (
        <ol className={`timeline ${loading ? 'is-loading' : ''}`} aria-label={`Half-hour time slots for ${formatLongDate(day)}`}>
          {data.slots.map((slot) => {
            const level = slotLevel(slot, quantity, now);
            const selected = selection && slot.start >= selection.start && slot.end <= selection.end;
            const text = describeSlot(slot, level, quantity, resource.kind);
            return (
              <li key={slot.start}>
                <button
                  type="button"
                  className={`slot slot--${level} ${selected ? 'is-selected' : ''}`}
                  disabled={level === 'past' || level === 'full' || resource.status !== 'active'}
                  aria-pressed={selected ? 'true' : 'false'}
                  aria-label={`${formatTime(slot.start)}, ${text}`}
                  onClick={() => onPickSlot(slot.start)}
                >
                  <span className="slot__time">{formatTime(slot.start)}</span>
                  <span className="slot__status" aria-hidden="true">
                    {level === 'full' ? <Icon name="x" size={14} /> : null}
                    {level === 'past' ? '–' : null}
                    {level === 'open' || level === 'limited' ? (quantity > 1 ? slot.available : <Icon name="check" size={14} />) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      ) : (
        !error && <div className="timeline timeline--placeholder" aria-hidden="true" />
      )}

      <ul className="legend" aria-label="Legend">
        <li>
          <span className="legend__swatch slot--open" /> Available
        </li>
        {quantity > 1 ? (
          <li>
            <span className="legend__swatch slot--limited" /> Almost gone
          </li>
        ) : null}
        <li>
          <span className="legend__swatch slot--full" /> {resource.kind === 'space' ? 'Booked' : 'None left'}
        </li>
        <li>
          <span className="legend__swatch slot--selected" /> Your selection
        </li>
      </ul>
      <p className="timeline-card__tip">
        <Icon name="info" size={16} />
        Select a time to start your reservation. {quantity > 1 ? 'Numbers show how many are free.' : ''}
      </p>
    </section>
  );
}
