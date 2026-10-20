/**
 * Values shared by the server and the React app.
 * Keeping them in one file means a category or status can never be spelled
 * two different ways in two different places.
 */

export const ORGANIZATION_NAME = 'Lakeside High School';

export const RESOURCE_CATEGORIES = [
  {
    id: 'technology',
    label: 'Technology',
    description: 'Laptops, tablets, calculators, and Wi-Fi hotspots.',
  },
  {
    id: 'media',
    label: 'Media & Creative',
    description: 'Cameras, microphones, lighting, and studio gear.',
  },
  {
    id: 'spaces',
    label: 'Rooms & Spaces',
    description: 'Study rooms, labs, and event venues.',
  },
  {
    id: 'stem',
    label: 'STEM & Makerspace',
    description: '3D printers, robotics kits, and lab tools.',
  },
  {
    id: 'events',
    label: 'Events & Outreach',
    description: 'Tables, tents, sound systems, and displays.',
  },
];

export const REQUEST_CATEGORIES = [
  { id: 'it', label: 'Technology help' },
  { id: 'facilities', label: 'Facilities & repairs' },
  { id: 'av', label: 'Audio/visual setup' },
  { id: 'supplies', label: 'Supplies & restocking' },
  { id: 'other', label: 'Something else' },
];

export const PRIORITIES = [
  { id: 'low', label: 'Low' },
  { id: 'normal', label: 'Normal' },
  { id: 'high', label: 'High' },
  { id: 'urgent', label: 'Urgent' },
];

export const REQUEST_STATUSES = [
  { id: 'open', label: 'Open' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'resolved', label: 'Resolved' },
  { id: 'closed', label: 'Closed' },
];

export const RESERVATION_STATUSES = [
  { id: 'pending', label: 'Awaiting approval' },
  { id: 'approved', label: 'Confirmed' },
  { id: 'checked_out', label: 'Checked out' },
  { id: 'returned', label: 'Returned' },
  { id: 'denied', label: 'Denied' },
  { id: 'cancelled', label: 'Cancelled' },
];

export const RESOURCE_STATUSES = [
  { id: 'active', label: 'Available to book' },
  { id: 'maintenance', label: 'Under maintenance' },
  { id: 'retired', label: 'Retired' },
];

/** Reservations in these states are holding units of a resource. */
export const HOLDING_STATUSES = ['pending', 'approved', 'checked_out'];

/** Booking window shown on the availability timeline (24-hour clock). */
export const OPENING_HOUR = 7;
export const CLOSING_HOUR = 19;
export const SLOT_MINUTES = 30;

/** How far ahead members may reserve something. */
export const MAX_DAYS_AHEAD = 30;

/** NIST SP 800-63B-4: single-factor passwords must be at least 15 characters. */
export const PASSWORD_MIN_LENGTH = 15;
export const PASSWORD_MAX_LENGTH = 128;

/** Looks up a human-readable label from one of the lists above. */
export function labelFor(list, id) {
  const match = list.find((item) => item.id === id);
  return match ? match.label : id;
}

/** Rooms are booked; everything else is borrowed and must be checked out. */
export function kindOfCategory(category) {
  return category === 'spaces' ? 'space' : 'equipment';
}

/** Display codes make records easy to reference out loud ("RES-1042"). */
export function reservationCode(id) {
  return `RES-${1000 + id}`;
}

export function requestCode(id) {
  return `REQ-${1000 + id}`;
}
