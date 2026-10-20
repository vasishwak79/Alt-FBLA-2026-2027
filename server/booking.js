/**
 * Booking rules shared by the resource and reservation routes.
 *
 * `checkReservation` is the single source of truth for "can this person
 * reserve this resource for this time?". The live availability check on the
 * reservation form and the final "Reserve" button both call it, so the
 * preview a user sees always matches what the server will accept.
 */

import { HOLDING_STATUSES, MAX_DAYS_AHEAD, kindOfCategory } from '../shared/constants.js';
import { availableUnits, toBooking } from './scheduling.js';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
// Allow a reservation to start a few minutes in the past ("right now").
const START_GRACE_MS = 15 * 60 * 1000;

const HOLDING_SQL = HOLDING_STATUSES.map((status) => `'${status}'`).join(', ');

/** All reservations for one resource that hold units during [from, to). */
export function loadBookings(db, resourceId, from, to, { excludeId = null, now = Date.now() } = {}) {
  const rows = db
    .prepare(
      `SELECT id, start_at, end_at, quantity, status
         FROM reservations
        WHERE resource_id = ?
          AND status IN (${HOLDING_SQL})
          AND start_at < ?
          AND (end_at > ? OR status = 'checked_out')`,
    )
    .all(resourceId, to, from);

  return rows.filter((row) => row.id !== excludeId).map((row) => toBooking(row, now));
}

/** Units of every resource that are free at this moment, keyed by resource id. */
export function availableNowById(db, resources, now = Date.now()) {
  const rows = db
    .prepare(
      `SELECT id, resource_id, start_at, end_at, quantity, status
         FROM reservations
        WHERE status IN (${HOLDING_SQL})
          AND start_at <= ?
          AND (end_at > ? OR status = 'checked_out')`,
    )
    .all(now, now);

  const bookingsByResource = new Map();
  for (const row of rows) {
    const list = bookingsByResource.get(row.resource_id) ?? [];
    list.push(toBooking(row, now));
    bookingsByResource.set(row.resource_id, list);
  }

  const result = new Map();
  for (const resource of resources) {
    const free =
      resource.status === 'active'
        ? availableUnits(resource.quantity, bookingsByResource.get(resource.id) ?? [], now, now + 1)
        : 0;
    result.set(resource.id, free);
  }
  return result;
}

/**
 * Checks a proposed reservation against every booking rule.
 * Returns `{ available, problem }` where `problem` is null when it is allowed.
 */
export function checkReservation(db, resource, { start, end, quantity }, { excludeId = null, now = Date.now() } = {}) {
  const fail = (problem, available = 0) => ({ available, problem });

  if (resource.status !== 'active') {
    return fail(`${resource.name} is not available to book right now.`);
  }
  if (end <= start) {
    return fail('The end time must be after the start time.');
  }
  if (start < now - START_GRACE_MS) {
    return fail('That time has already passed. Choose a time in the future.');
  }
  if (start > now + MAX_DAYS_AHEAD * DAY_MS) {
    return fail(`Reservations can be made up to ${MAX_DAYS_AHEAD} days ahead.`);
  }
  if (end - start > resource.max_hours * HOUR_MS) {
    return fail(`${resource.name} can be reserved for up to ${resource.max_hours} hours at a time.`);
  }
  if (quantity > resource.quantity) {
    return fail(`Only ${resource.quantity} ${resource.quantity === 1 ? 'unit exists' : 'units exist'}.`);
  }

  const bookings = loadBookings(db, resource.id, start, end, { excludeId, now });
  const available = availableUnits(resource.quantity, bookings, start, end);

  if (available < quantity) {
    const message =
      available === 0
        ? 'Already fully booked during that time. Try another time slot.'
        : `Only ${available} of ${resource.quantity} available during that time.`;
    return fail(message, available);
  }
  return { available, problem: null };
}

/** Converts a database row into the JSON shape the React app uses. */
export function formatResource(row, availableNow = null) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    kind: kindOfCategory(row.category),
    description: row.description,
    location: row.location,
    quantity: row.quantity,
    capacity: row.capacity,
    maxHours: row.max_hours,
    requiresApproval: Boolean(row.requires_approval),
    status: row.status,
    tags: row.tags
      ? row.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [],
    availableNow,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const RESERVATION_SELECT = `
  SELECT r.*, res.name AS resource_name, res.category AS resource_category,
         res.location AS resource_location, u.name AS user_name, u.email AS user_email
    FROM reservations r
    JOIN resources res ON res.id = r.resource_id
    JOIN users u ON u.id = r.user_id
`;

export function formatReservation(row, now = Date.now()) {
  return {
    id: row.id,
    resourceId: row.resource_id,
    resourceName: row.resource_name,
    resourceCategory: row.resource_category,
    resourceLocation: row.resource_location,
    kind: kindOfCategory(row.resource_category),
    userId: row.user_id,
    userName: row.user_name,
    userEmail: row.user_email,
    quantity: row.quantity,
    start: row.start_at,
    end: row.end_at,
    purpose: row.purpose,
    status: row.status,
    staffNote: row.staff_note,
    checkedOutAt: row.checked_out_at,
    returnedAt: row.returned_at,
    overdue: row.status === 'checked_out' && row.end_at <= now,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
