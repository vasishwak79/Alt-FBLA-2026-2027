/**
 * Date and time helpers. The server stores every time as milliseconds since
 * 1970 (UTC); these helpers turn them into friendly local text and back.
 */

import { CLOSING_HOUR, OPENING_HOUR, SLOT_MINUTES } from '../../shared/constants.js';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const shortDateFormat = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
const longDateFormat = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
const relativeFormat = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

export function formatTime(time) {
  return timeFormat.format(time);
}

export function formatDate(time) {
  return shortDateFormat.format(time);
}

export function formatLongDate(time) {
  return longDateFormat.format(time);
}

export function formatDateTime(time) {
  return `${formatDate(time)}, ${formatTime(time)}`;
}

/** "Tue, Oct 21, 3:00 – 4:00 PM" or across days "Tue, Oct 21, 8:00 AM – Thu, Oct 23, 3:00 PM". */
export function formatRange(start, end) {
  if (isSameDay(start, end)) {
    return `${formatDate(start)}, ${formatTime(start)} – ${formatTime(end)}`;
  }
  return `${formatDateTime(start)} – ${formatDateTime(end)}`;
}

/** "3 hours ago", "in 2 days", "yesterday". */
export function relativeTime(time, now = Date.now()) {
  const difference = time - now;
  const minutes = Math.round(difference / 60000);
  if (Math.abs(minutes) < 1) return 'just now';
  if (Math.abs(minutes) < 60) return relativeFormat.format(minutes, 'minute');
  const hours = Math.round(difference / HOUR);
  if (Math.abs(hours) < 24) return relativeFormat.format(hours, 'hour');
  const days = Math.round(difference / DAY);
  if (Math.abs(days) < 30) return relativeFormat.format(days, 'day');
  return formatDate(time);
}

export function isSameDay(a, b) {
  const first = new Date(a);
  const second = new Date(b);
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

/** Midnight at the start of the given day, in local time. */
export function startOfDay(time = Date.now()) {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function addDays(time, days) {
  const date = new Date(time);
  date.setDate(date.getDate() + days);
  return date.getTime();
}

/** Formats a time as the "YYYY-MM-DD" value an <input type="date"> expects. */
export function toDateInput(time) {
  const date = new Date(time);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Formats a time as "HH:MM" (24-hour), the value used by our time pickers. */
export function toTimeInput(time) {
  const date = new Date(time);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** Combines "2026-10-21" and "15:30" into a timestamp, or null if either is missing. */
export function combineDateTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null;
  const [year, month, day] = dateValue.split('-').map(Number);
  const [hours, minutes] = timeValue.split(':').map(Number);
  const result = new Date(year, month - 1, day, hours, minutes).getTime();
  return Number.isNaN(result) ? null : result;
}

/** The opening and closing time for a given day. */
export function openingHours(dayTime) {
  const day = new Date(dayTime);
  return {
    open: new Date(day.getFullYear(), day.getMonth(), day.getDate(), OPENING_HOUR).getTime(),
    close: new Date(day.getFullYear(), day.getMonth(), day.getDate(), CLOSING_HOUR).getTime(),
  };
}

/** Every half-hour option between opening and closing time, e.g. "07:00" … "19:00". */
export function timeOptions() {
  const options = [];
  for (let minutes = OPENING_HOUR * 60; minutes <= CLOSING_HOUR * 60; minutes += SLOT_MINUTES) {
    const value = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    const label = formatTime(new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60));
    options.push({ value, label });
  }
  return options;
}

export function hoursBetween(start, end) {
  return (end - start) / HOUR;
}

/** "1 hour", "2.5 hours", "3 days". */
export function formatDuration(hours) {
  if (hours >= 24 && hours % 24 === 0) {
    const days = hours / 24;
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  }
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded} ${rounded === 1 ? 'hour' : 'hours'}`;
}
