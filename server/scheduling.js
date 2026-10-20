/**
 * Scheduling logic: decides how many units of a resource are free.
 *
 * These are pure functions (no database, no clock) so they are easy to
 * unit-test. See tests/scheduling.test.js.
 */

import { HOLDING_STATUSES } from '../shared/constants.js';

/**
 * Converts a reservation row into the time span it actually blocks.
 * An overdue item (still checked out after its end time) stays unavailable
 * until staff check it back in, so its end is treated as "never".
 */
export function toBooking(row, now = Date.now()) {
  const overdue = row.status === 'checked_out' && row.end_at <= now;
  return {
    id: row.id,
    start: row.start_at,
    end: overdue ? Number.POSITIVE_INFINITY : row.end_at,
    quantity: row.quantity,
  };
}

/** True when a reservation status means units are being held. */
export function isHolding(status) {
  return HOLDING_STATUSES.includes(status);
}

/**
 * Returns the highest number of units in use at any moment in [start, end).
 *
 * Sweep-line algorithm: each booking becomes a "+quantity" event when it
 * starts and a "-quantity" event when it ends. Sorting the events by time and
 * keeping a running total gives the peak in O(n log n).
 */
export function peakUsage(bookings, start, end) {
  const events = [];

  for (const booking of bookings) {
    const overlapStart = Math.max(booking.start, start);
    const overlapEnd = Math.min(booking.end, end);
    if (overlapStart < overlapEnd) {
      events.push([overlapStart, booking.quantity]);
      events.push([overlapEnd, -booking.quantity]);
    }
  }

  // When two events share a timestamp, process the release (-) first so
  // back-to-back bookings (10:00-11:00 then 11:00-12:00) do not collide.
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  let inUse = 0;
  let peak = 0;
  for (const [, change] of events) {
    inUse += change;
    peak = Math.max(peak, inUse);
  }
  return peak;
}

/** Units still free for the whole window [start, end). */
export function availableUnits(totalQuantity, bookings, start, end) {
  return Math.max(0, totalQuantity - peakUsage(bookings, start, end));
}

/**
 * Splits [from, to) into equal slots and reports free units in each one.
 * Powers the availability timeline on every resource page.
 */
export function slotAvailability(totalQuantity, bookings, from, to, slotMs) {
  const slots = [];
  for (let slotStart = from; slotStart < to; slotStart += slotMs) {
    const slotEnd = Math.min(slotStart + slotMs, to);
    slots.push({
      start: slotStart,
      end: slotEnd,
      available: availableUnits(totalQuantity, bookings, slotStart, slotEnd),
    });
  }
  return slots;
}
