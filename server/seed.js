/**
 * Demo data for Commons.
 *
 * Lakeside High School and all people below are fictional. Every date is
 * generated relative to "now", so the demo always shows realistic activity:
 * items due today, overdue returns, pending approvals, and upcoming bookings.
 *
 * Run `npm run reset-db` to wipe the database and start fresh.
 */

import { rmSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import { hashPassword } from './auth.js';
import { DEFAULT_DB_FILE, openDatabase, transaction } from './db.js';
import { availableUnits } from './scheduling.js';
import { reservationCode, requestCode } from '../shared/constants.js';

/** Shared password for every demo account (also listed in README.md). */
export const DEMO_PASSWORD = 'maple-river-lantern-26';

export const DEMO_USERS = [
  { key: 'jordan', name: 'Jordan Rivera', email: 'jordan.rivera@lakeside.example', role: 'admin', title: 'Resource Manager' },
  { key: 'dana', name: 'Dana Kim', email: 'dana.kim@lakeside.example', role: 'admin', title: 'IT & Facilities Coordinator' },
  { key: 'avery', name: 'Avery Chen', email: 'avery.chen@lakeside.example', role: 'member', title: 'Grade 11 student' },
  { key: 'patel', name: 'Priya Patel', email: 'priya.patel@lakeside.example', role: 'member', title: 'Science teacher' },
  { key: 'marcus', name: 'Marcus Johnson', email: 'marcus.johnson@lakeside.example', role: 'member', title: 'Grade 12 student' },
  { key: 'sofia', name: 'Sofia Alvarez', email: 'sofia.alvarez@lakeside.example', role: 'member', title: 'Grade 10 student' },
  { key: 'ethan', name: 'Ethan Brooks', email: 'ethan.brooks@lakeside.example', role: 'member', title: 'Media arts teacher' },
  { key: 'lena', name: 'Lena Okafor', email: 'lena.okafor@lakeside.example', role: 'member', title: 'FBLA chapter president' },
];

// [name, category, location, quantity, capacity, maxHours, requiresApproval, status, tags, description]
const RESOURCES = [
  ['Student Laptops', 'technology', 'Library Help Desk', 24, null, 72, false, 'active', 'laptop, computer, homework, overnight',
    'Lightweight laptops with the school’s standard apps installed. Each one comes in a padded sleeve with its charger. Overnight and weekend loans are welcome.'],
  ['Graphing Calculators', 'technology', 'Math Office, Room 210', 40, null, 168, false, 'active', 'calculator, math, testing',
    'Graphing calculators approved for math and science courses and for standardized tests. Borrow one for up to a week.'],
  ['Wi-Fi Hotspots', 'technology', 'Library Help Desk', 15, null, 168, true, 'active', 'internet, wifi, home access',
    'Portable hotspots for students who need internet access at home. Includes a charging cable. Requests are approved within one school day.'],
  ['Drawing Tablets', 'technology', 'Art Room 105', 8, null, 8, false, 'active', 'art, design, stylus',
    'Pen tablets for digital art and graphic design. They connect by USB to any laptop.'],
  ['Document Cameras', 'technology', 'Library Help Desk', 4, null, 8, false, 'active', 'presentation, projector, classroom',
    'Overhead cameras that show papers, books, and small objects on a projector or screen.'],
  ['Portable Projectors', 'technology', 'Library Help Desk', 3, null, 8, false, 'maintenance', 'presentation, hdmi, display',
    'Compact projectors with HDMI input and a built-in speaker. Currently being serviced after a bulb failure.'],
  ['DSLR Camera Kit', 'media', 'Media Lab, Room 120', 4, null, 48, true, 'active', 'photo, camera, yearbook',
    'Digital camera with an 18–55 mm lens, two batteries, a charger, and a 64 GB memory card. Approval confirms you have completed camera basics.'],
  ['4K Video Camera', 'media', 'Media Lab, Room 120', 2, null, 48, true, 'active', 'video, film, interviews',
    'Handheld 4K camcorder with an external microphone input. Great for interviews, short films, and event recordings.'],
  ['Wireless Microphone Kit', 'media', 'Media Lab, Room 120', 3, null, 24, false, 'active', 'audio, microphone, interviews',
    'Two clip-on wireless microphones and a receiver that plugs into a camera or phone.'],
  ['Tripods', 'media', 'Media Lab, Room 120', 8, null, 48, false, 'active', 'camera, phone, stability',
    'Adjustable tripods with both phone and camera mounts.'],
  ['LED Lighting Kit', 'media', 'Media Lab, Room 120', 2, null, 24, false, 'active', 'lighting, photo, video',
    'Two dimmable LED panels with stands and color filters for photo and video shoots.'],
  ['Podcast Microphone Set', 'media', 'Media Lab, Room 120', 2, null, 8, false, 'active', 'audio, podcast, recording',
    'Four USB microphones, four pairs of headphones, and a small mixer for recording group podcasts.'],
  ['Study Room A', 'spaces', 'Library, 2nd floor', 1, 6, 2, false, 'active', 'quiet, group work, whiteboard',
    'Quiet room with a whiteboard, a wall display, and seating for six.'],
  ['Study Room B', 'spaces', 'Library, 2nd floor', 1, 4, 2, false, 'active', 'quiet, group work, whiteboard',
    'Small quiet room with a whiteboard and seating for four.'],
  ['Podcast Booth', 'spaces', 'Media Lab, Room 120', 1, 3, 2, true, 'active', 'audio, recording, podcast',
    'Sound-treated booth with two microphones and a recording computer. First-time users complete a 10-minute orientation.'],
  ['Conference Room 214', 'spaces', 'Main Office Wing', 1, 14, 3, true, 'active', 'meetings, video calls, interviews',
    'Meeting room with a conference table, video-call camera, and large display. Popular for club officer meetings and interviews.'],
  ['Innovation Lab', 'spaces', 'Room 130', 1, 32, 4, true, 'active', 'classroom, collaboration, makerspace',
    'Flexible classroom with movable tables, three large displays, and makerspace storage.'],
  ['Auditorium', 'spaces', 'Performing Arts Center', 1, 450, 5, true, 'active', 'events, stage, assemblies',
    'Main stage with seating for 450, stage lighting, and a sound system. Requires an approved event plan.'],
  ['Outdoor Courtyard', 'spaces', 'East Entrance', 1, 80, 4, false, 'active', 'outdoor, events, club fair',
    'Covered courtyard with picnic tables. Suitable for club fairs, fundraisers, and outdoor classes.'],
  ['3D Printer Station', 'stem', 'Makerspace, Room 132', 2, null, 8, true, 'active', '3d printing, prototype, design',
    'Desktop 3D printer with PLA filament. Staff check your model file before long prints.'],
  ['Robotics Kits', 'stem', 'Makerspace, Room 132', 10, null, 72, false, 'active', 'robotics, coding, engineering',
    'Build-and-code robot kits with motors, sensors, and a programmable controller.'],
  ['Digital Microscopes', 'stem', 'Science Prep Room', 6, null, 8, false, 'active', 'biology, science, lab',
    'USB microscopes with up to 1000× zoom that display live images on a laptop.'],
  ['Microcontroller Starter Kits', 'stem', 'Makerspace, Room 132', 15, null, 168, false, 'active', 'electronics, coding, sensors',
    'Breadboards, sensors, LEDs, and a programmable microcontroller for electronics projects.'],
  ['Virtual Reality Headsets', 'stem', 'Library Help Desk', 6, null, 4, true, 'active', 'vr, simulation, field trip',
    'Standalone headsets loaded with virtual field trips and science simulations.'],
  ['Science Sensor Probes', 'stem', 'Science Prep Room', 12, null, 8, false, 'active', 'data logging, physics, chemistry',
    'Temperature, motion, and pH probes that log data to a laptop during experiments.'],
  ['Folding Tables', 'events', 'Facilities Storage', 20, null, 12, false, 'active', 'fundraiser, club fair, setup',
    'Six-foot folding tables for fundraisers, club fairs, and events.'],
  ['Event Chairs', 'events', 'Facilities Storage', 120, null, 12, false, 'active', 'seating, setup, assemblies',
    'Stackable chairs. Facilities staff can deliver orders of 30 or more.'],
  ['Portable PA System', 'events', 'Facilities Storage', 2, null, 8, true, 'active', 'sound, speaker, microphone',
    'Battery-powered speaker with two wireless microphones. Reaches a crowd of about 200 people.'],
  ['Pop-up Canopy Tents', 'events', 'Facilities Storage', 4, null, 12, false, 'active', 'outdoor, shade, fundraiser',
    'Ten-by-ten-foot canopy tents with weights for outdoor events.'],
  ['Banner Stands', 'events', 'Facilities Storage', 6, null, 48, false, 'active', 'display, signage, booth',
    'Retractable stands for displaying club and event banners.'],
];

const PURPOSES = {
  technology: ['Research project for AP U.S. History', 'Group presentation practice', 'Homework over the weekend', 'Online coursework at home', 'Statistics unit test'],
  media: ['Yearbook photos at the pep rally', 'Short film for media arts class', 'Interview for the school news show', 'Club promo video', 'Senior portraits practice'],
  spaces: ['AP Biology study group', 'Club officer meeting', 'Peer tutoring session', 'Mock interview practice', 'Group project work session'],
  stem: ['Robotics team practice', 'Science fair prototype', 'Engineering class build day', 'Biology lab observation', 'Physics motion lab'],
  events: ['FBLA fundraiser setup', 'Club fair booth', 'Back-to-school night', 'Spirit week activity', 'Student council event'],
};

const DENIAL_NOTES = [
  'Already committed to a school event at that time.',
  'Please complete the equipment orientation first.',
  'Item is reserved for a class during that period.',
];

/** Small, repeatable random number generator so the demo looks the same every reset. */
function createRandom(seed) {
  let state = seed;
  const next = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (list) => list[Math.floor(next() * list.length)],
    chance: (probability) => next() < probability,
  };
}

const HOUR = 60 * 60 * 1000;

export function isEmpty(db) {
  return db.prepare('SELECT COUNT(*) AS count FROM users').get().count === 0;
}

export async function seedDatabase(db, { now = Date.now() } = {}) {
  // Hash passwords first (this is the slow, asynchronous part).
  const hashes = [];
  for (let i = 0; i < DEMO_USERS.length; i += 1) {
    hashes.push(await hashPassword(DEMO_PASSWORD));
  }

  const random = createRandom(2026);
  const today = new Date(now);

  /** A local time `dayOffset` days from today at hour:minute. */
  const at = (dayOffset, hour, minute = 0) =>
    new Date(today.getFullYear(), today.getMonth(), today.getDate() + dayOffset, hour, minute).getTime();
  /** Rounds a time down to the nearest half hour. */
  const toSlot = (time) => time - (time % (30 * 60 * 1000));

  transaction(db, () => {
    // ---- Users ----
    const users = {};
    const insertUser = db.prepare(
      `INSERT INTO users (name, email, password_hash, role, title, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    );
    DEMO_USERS.forEach((user, index) => {
      const result = insertUser.run(user.name, user.email, hashes[index], user.role, user.title, now - 120 * 24 * HOUR);
      users[user.key] = Number(result.lastInsertRowid);
    });
    const memberKeys = DEMO_USERS.filter((user) => user.role === 'member').map((user) => user.key);

    // ---- Resources ----
    const resources = {};
    const insertResource = db.prepare(
      `INSERT INTO resources
         (name, category, description, location, quantity, capacity, max_hours, requires_approval, status, tags, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const [name, category, location, quantity, capacity, maxHours, approval, status, tags, description] of RESOURCES) {
      const result = insertResource.run(
        name, category, description, location, quantity, capacity, maxHours, approval ? 1 : 0, status, tags,
        now - 90 * 24 * HOUR, now - 10 * 24 * HOUR,
      );
      resources[name] = { id: Number(result.lastInsertRowid), name, category, quantity, maxHours, approval, status };
    }

    // ---- Reservations ----
    const holdings = new Map(); // resource id -> bookings that hold units
    const insertReservation = db.prepare(
      `INSERT INTO reservations
         (resource_id, user_id, quantity, start_at, end_at, purpose, status, staff_note,
          checked_out_at, returned_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const created = [];

    function fits(resource, start, end, quantity) {
      return availableUnits(resource.quantity, holdings.get(resource.id) ?? [], start, end) >= quantity;
    }

    function addReservation({ resource, userKey, quantity = 1, start, end, purpose, status, note = null, createdAt }) {
      if (['pending', 'approved', 'checked_out', 'returned'].includes(status)) {
        if (!fits(resource, start, end, quantity)) return null;
        const overdue = status === 'checked_out' && end <= now;
        const list = holdings.get(resource.id) ?? [];
        list.push({ start, end: overdue ? Number.POSITIVE_INFINITY : end, quantity });
        holdings.set(resource.id, list);
      }

      const isEquipment = resource.category !== 'spaces';
      const checkedOutAt = isEquipment && ['checked_out', 'returned'].includes(status) ? start + 5 * 60 * 1000 : null;
      const returnedAt = status === 'returned' ? end - random.int(0, 3) * 10 * 60 * 1000 : null;
      const madeAt = Math.min(createdAt ?? start - random.int(1, 4) * 24 * HOUR, now - HOUR);

      const result = insertReservation.run(
        resource.id, users[userKey], quantity, start, end, purpose, status, note,
        checkedOutAt, returnedAt, madeAt, Math.min(Math.max(madeAt, returnedAt ?? checkedOutAt ?? madeAt), now),
      );
      const record = { id: Number(result.lastInsertRowid), resource, userKey, status, start, end, createdAt: madeAt, returnedAt, checkedOutAt };
      created.push(record);
      return record;
    }

    const R = (name) => resources[name];

    // Scripted bookings that tell a clear story during the demo.
    const nowSlot = toSlot(now);
    addReservation({ resource: R('Robotics Kits'), userKey: 'marcus', quantity: 4, start: at(-4, 14), end: at(-2, 14), purpose: 'Robotics team practice', status: 'checked_out' });
    addReservation({ resource: R('Wireless Microphone Kit'), userKey: 'sofia', start: at(-3, 9), end: at(-2, 9), purpose: 'Interview for the school news show', status: 'checked_out' });
    addReservation({ resource: R('Graphing Calculators'), userKey: 'avery', start: at(-2, 8), end: at(4, 15), purpose: 'Statistics unit test', status: 'checked_out' });
    addReservation({ resource: R('Tripods'), userKey: 'ethan', quantity: 2, start: nowSlot - 2 * HOUR, end: nowSlot + 3 * HOUR, purpose: 'Short film for media arts class', status: 'checked_out' });
    addReservation({ resource: R('Study Room A'), userKey: 'avery', start: at(1, 15), end: at(1, 16), purpose: 'AP Biology study group', status: 'approved', createdAt: now - 20 * HOUR });
    addReservation({ resource: R('DSLR Camera Kit'), userKey: 'avery', start: at(2, 10), end: at(3, 10), purpose: 'Yearbook photos at the pep rally', status: 'pending', createdAt: now - 3 * HOUR });
    addReservation({ resource: R('Student Laptops'), userKey: 'avery', start: at(-6, 8), end: at(-5, 15), purpose: 'Research project for AP U.S. History', status: 'returned' });
    addReservation({ resource: R('Podcast Booth'), userKey: 'avery', start: at(-9, 14), end: at(-9, 15), purpose: 'Club promo podcast', status: 'cancelled' });
    addReservation({ resource: R('Innovation Lab'), userKey: 'patel', start: at(3, 9), end: at(3, 12), purpose: 'Chemistry demonstrations for parent night', status: 'approved', createdAt: now - 48 * HOUR });
    addReservation({ resource: R('Digital Microscopes'), userKey: 'patel', quantity: 6, start: at(1, 10), end: at(1, 12), purpose: 'Biology lab: observing onion cells', status: 'pending', createdAt: now - 5 * HOUR });
    addReservation({ resource: R('4K Video Camera'), userKey: 'ethan', start: at(1, 8), end: at(2, 8), purpose: 'Recording the fall choir concert', status: 'pending', createdAt: now - 7 * HOUR });
    addReservation({ resource: R('Folding Tables'), userKey: 'lena', quantity: 8, start: at(5, 9), end: at(5, 17), purpose: 'FBLA bake sale fundraiser', status: 'approved', createdAt: now - 30 * HOUR });
    addReservation({ resource: R('Pop-up Canopy Tents'), userKey: 'lena', quantity: 2, start: at(5, 9), end: at(5, 17), purpose: 'FBLA bake sale fundraiser', status: 'approved', createdAt: now - 30 * HOUR });
    addReservation({ resource: R('Conference Room 214'), userKey: 'lena', start: at(2, 15), end: at(2, 16, 30), purpose: 'FBLA officer meeting', status: 'pending', createdAt: now - 2 * HOUR });
    addReservation({ resource: R('Wi-Fi Hotspots'), userKey: 'marcus', start: at(1, 8), end: at(7, 8), purpose: 'Online coursework at home', status: 'pending', createdAt: now - 26 * HOUR });

    // Random everyday activity across the last 30 days and the next 12.
    const resourceList = Object.values(resources).filter((resource) => resource.status === 'active');
    for (let dayOffset = -30; dayOffset <= 12; dayOffset += 1) {
      const weekday = new Date(at(dayOffset, 12)).getDay();
      const isWeekend = weekday === 0 || weekday === 6;
      const count = isWeekend ? random.int(0, 1) : random.int(dayOffset > 2 ? 2 : 4, dayOffset > 2 ? 4 : 7);

      for (let i = 0; i < count; i += 1) {
        const resource = random.pick(resourceList);
        const start = at(dayOffset, random.int(7, 15), random.chance(0.5) ? 30 : 0);
        const hourOptions = resource.category === 'spaces' ? [1, 1, 1.5, 2, 2, 3] : [2, 3, 4, 8, 24, 48];
        const hours = Math.min(resource.maxHours, random.pick(hourOptions));
        const end = start + hours * HOUR;
        const maxQuantity = resource.quantity >= 20 ? 10 : Math.min(resource.quantity, 3);
        const quantity = resource.quantity === 1 ? 1 : random.int(1, maxQuantity);
        const userKey = random.pick(memberKeys);
        const purpose = random.pick(PURPOSES[resource.category]);
        const isEquipment = resource.category !== 'spaces';

        let status;
        let note = null;
        if (end <= now) {
          if (random.chance(0.08)) status = 'cancelled';
          else if (resource.approval && random.chance(0.15)) {
            status = 'denied';
            note = random.pick(DENIAL_NOTES);
          } else status = isEquipment ? 'returned' : 'approved';
        } else if (start <= now) {
          status = isEquipment ? 'checked_out' : 'approved';
        } else {
          status = resource.approval && random.chance(0.4) ? 'pending' : 'approved';
        }

        addReservation({ resource, userKey, quantity, start, end, purpose, status, note });
      }
    }

    // ---- Service requests ----
    const insertRequest = db.prepare(
      `INSERT INTO service_requests
         (user_id, category, title, description, location, priority, status, assigned_to, resource_id,
          created_at, updated_at, resolved_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    const insertComment = db.prepare(
      `INSERT INTO request_comments (request_id, user_id, body, created_at) VALUES (?, ?, ?, ?)`,
    );

    // [userKey, category, title, description, location, priority, status, assignee, resource, hoursAgo, resolvedAfterHours, comments]
    const REQUESTS = [
      ['patel', 'it', 'Projector in Room 118 shows “No Signal”', 'The ceiling projector in Room 118 turns on but shows “No Signal” with every laptop and cable we have tried. I have a lab presentation 5th period.', 'Room 118', 'urgent', 'open', null, null, 2, null, []],
      ['patel', 'facilities', 'Eyewash station light flickering in Lab 118', 'The indicator light on the eyewash station keeps flickering. The water still runs, but it should be checked before the next lab day.', 'Science Lab 118', 'high', 'open', null, null, 6, null, []],
      ['avery', 'it', 'Borrowed laptop will not connect to school Wi-Fi', 'The laptop in sleeve #12 says “Can’t connect to this network” in the library. My phone connects without any problem.', 'Library, 2nd floor', 'normal', 'in_progress', 'dana', 'Student Laptops', 26, null, [
        ['dana', 'Thanks, Avery! A few laptops have an expired network certificate. Bring it to the help desk at lunch and we will fix it in about five minutes.', 20],
        ['avery', 'Will do. I can come by at 12:15 today.', 18],
      ]],
      ['ethan', 'av', 'Sound setup for Friday film screening', 'We need the auditorium speakers connected to a laptop and one wireless microphone for the introduction. The screening starts at 6:30 PM.', 'Auditorium', 'normal', 'open', null, null, 30, null, []],
      ['marcus', 'it', 'Robotics kit controller will not power on', 'Kit #7’s controller does not turn on, even with fresh batteries. The other three kits we borrowed work fine.', 'Makerspace, Room 132', 'normal', 'open', null, 'Robotics Kits', 50, null, []],
      ['lena', 'supplies', 'Extension cords for the bake sale', 'Our fundraiser needs three outdoor extension cords to power two coffee urns near the courtyard tents.', 'Outdoor Courtyard', 'normal', 'in_progress', 'jordan', null, 40, null, [
        ['jordan', 'We have two 50-foot outdoor cords in storage. I am ordering a third and will have all of them ready the day before.', 34],
      ]],
      ['lena', 'facilities', 'Courtyard lights out near east entrance', 'Two lamps by the east entrance are out, which makes the walkway dark after evening events.', 'East Entrance', 'high', 'in_progress', 'dana', null, 72, null, [
        ['dana', 'Replacement bulbs are on order and should arrive Thursday.', 60],
      ]],
      ['avery', 'supplies', 'Out of graph paper in Room 210', 'The graph paper bin in the math office is empty. Several of us need it for the statistics project.', 'Math Office, Room 210', 'low', 'resolved', 'jordan', null, 120, 20, [
        ['jordan', 'Restocked with two new packs. Thanks for letting us know!', 100],
      ]],
      ['sofia', 'facilities', 'Broken chair in Study Room B', 'One of the chairs in Study Room B has a cracked leg and wobbles badly.', 'Library, 2nd floor', 'normal', 'resolved', 'dana', 'Study Room B', 200, 30, [
        ['dana', 'The chair was removed and replaced this morning.', 170],
      ]],
      ['ethan', 'av', 'Microphone receiver missing from kit #2', 'Wireless Microphone Kit #2 was returned without its receiver.', 'Media Lab, Room 120', 'high', 'resolved', 'jordan', 'Wireless Microphone Kit', 260, 8, [
        ['jordan', 'Found it in the camera bag from the same shoot. Kit #2 is complete again.', 252],
      ]],
      ['sofia', 'it', 'Cannot sign in to the library catalog', 'My student account says my password expired when I try to use the library catalog.', 'Library', 'normal', 'resolved', 'dana', null, 300, 4, []],
      ['marcus', 'other', 'Suggestion: add a second podcast booth', 'The podcast booth is booked almost every afternoon. Could the empty storage room next to the Media Lab become a second booth?', 'Media Lab, Room 120', 'low', 'closed', 'jordan', 'Podcast Booth', 400, 48, [
        ['jordan', 'Great idea! We shared it with the principal. It is now on the list for next year’s budget, so we are closing this request for now.', 352],
      ]],
      ['patel', 'facilities', 'Heater not working in Conference Room 214', 'The room was very cold during this morning’s meeting. The thermostat does not seem to respond.', 'Main Office Wing', 'normal', 'resolved', 'dana', 'Conference Room 214', 340, 26, []],
      ['lena', 'supplies', 'Replace dry-erase markers in Study Room A', 'All of the markers in Study Room A have dried out.', 'Library, 2nd floor', 'low', 'resolved', 'jordan', 'Study Room A', 150, 6, []],
      ['avery', 'it', 'Library printer paper jam', 'The printer by the library computers shows a paper jam, but no paper is visible inside.', 'Library', 'normal', 'resolved', 'dana', null, 90, 3, []],
    ];

    const requestIds = {};
    for (const [userKey, category, title, description, location, priority, status, assignee, resourceName, hoursAgo, resolvedAfter, comments] of REQUESTS) {
      const createdAt = now - hoursAgo * HOUR;
      const resolvedAt = resolvedAfter ? createdAt + resolvedAfter * HOUR : null;
      const lastComment = comments.length > 0 ? now - Math.min(...comments.map((comment) => comment[2])) * HOUR : createdAt;
      const updatedAt = Math.max(createdAt, resolvedAt ?? 0, lastComment);
      const result = insertRequest.run(
        users[userKey], category, title, description, location, priority, status,
        assignee ? users[assignee] : null, resourceName ? resources[resourceName].id : null,
        createdAt, updatedAt, resolvedAt,
      );
      const id = Number(result.lastInsertRowid);
      requestIds[title] = id;
      for (const [authorKey, body, commentHoursAgo] of comments) {
        insertComment.run(id, users[authorKey], body, now - commentHoursAgo * HOUR);
      }
    }

    // ---- Announcements ----
    const insertAnnouncement = db.prepare(
      `INSERT INTO announcements (title, body, author_id, pinned, created_at) VALUES (?, ?, ?, ?, ?)`,
    );
    insertAnnouncement.run(
      'Hotspot loans now last up to 7 days',
      'Students who need internet access at home can now keep a Wi-Fi hotspot for a full week. Request one from the catalog, and staff will approve it within one school day.',
      users.jordan, 1, now - 3 * 24 * HOUR,
    );
    insertAnnouncement.run(
      'The Podcast Booth is open for bookings',
      'The sound-treated booth in the Media Lab is ready. Complete the 10-minute orientation with Mr. Brooks, then book up to two hours at a time.',
      users.jordan, 0, now - 6 * 24 * HOUR,
    );
    insertAnnouncement.run(
      'Portable projectors are out for repair',
      'All three portable projectors are being serviced. Document cameras and the displays in Study Rooms A and B are good alternatives until they return.',
      users.dana, 0, now - 9 * 24 * HOUR,
    );

    // ---- Notifications ----
    const insertNotification = db.prepare(
      `INSERT INTO notifications (user_id, message, link, is_read, created_at) VALUES (?, ?, ?, ?, ?)`,
    );
    const find = (userKey, resourceName, status) =>
      created.find((record) => record.userKey === userKey && record.resource.name === resourceName && record.status === status);

    const averyCamera = find('avery', 'DSLR Camera Kit', 'pending');
    const averyRoom = find('avery', 'Study Room A', 'approved');
    const wifiRequest = requestIds['Borrowed laptop will not connect to school Wi-Fi'];

    insertNotification.run(users.avery, `Dana Kim replied to your request ${requestCode(wifiRequest)}.`, `/requests/${wifiRequest}`, 0, now - 20 * HOUR);
    if (averyCamera) {
      insertNotification.run(users.avery, `Your request for DSLR Camera Kit (${reservationCode(averyCamera.id)}) was sent for approval.`, '/dashboard', 0, now - 3 * HOUR);
    }
    if (averyRoom) {
      insertNotification.run(users.avery, `Study Room A is booked for you (${reservationCode(averyRoom.id)}).`, '/dashboard', 1, now - 20 * HOUR);
    }

    for (const record of created.filter((item) => item.status === 'pending')) {
      const member = DEMO_USERS.find((user) => user.key === record.userKey);
      for (const adminKey of ['jordan', 'dana']) {
        insertNotification.run(
          users[adminKey],
          `${member.name} requested ${record.resource.name} (${reservationCode(record.id)}). It needs your approval.`,
          '/admin?tab=reservations', 0, record.createdAt,
        );
      }
    }
    const urgent = requestIds['Projector in Room 118 shows “No Signal”'];
    for (const adminKey of ['jordan', 'dana']) {
      insertNotification.run(users[adminKey], `New URGENT request ${requestCode(urgent)} from Priya Patel: Projector in Room 118 shows “No Signal”`, `/requests/${urgent}`, 0, now - 2 * HOUR);
    }

    // ---- Activity log (last 7 days) ----
    const insertAudit = db.prepare(
      `INSERT INTO audit_log (actor_id, action, entity, entity_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    );
    const weekAgo = now - 7 * 24 * HOUR;
    for (const record of created) {
      const label = `${reservationCode(record.id)} · ${record.resource.name}`;
      if (record.createdAt >= weekAgo) {
        insertAudit.run(users[record.userKey], 'reserved', 'reservation', record.id, label, record.createdAt);
        if (record.resource.approval && ['approved', 'checked_out', 'returned'].includes(record.status)) {
          insertAudit.run(users.jordan, 'approved', 'reservation', record.id, label, Math.min(record.createdAt + 2 * HOUR, now));
        }
      }
      if (record.checkedOutAt && record.checkedOutAt >= weekAgo && record.checkedOutAt <= now) {
        insertAudit.run(users.jordan, 'checked out', 'reservation', record.id, label, record.checkedOutAt);
      }
      if (record.returnedAt && record.returnedAt >= weekAgo && record.returnedAt <= now) {
        insertAudit.run(users.dana, 'checked in', 'reservation', record.id, label, record.returnedAt);
      }
    }
  });

  return {
    users: DEMO_USERS.length,
    resources: RESOURCES.length,
    reservations: db.prepare('SELECT COUNT(*) AS count FROM reservations').get().count,
    requests: db.prepare('SELECT COUNT(*) AS count FROM service_requests').get().count,
  };
}

// `node server/seed.js --reset` wipes the database file and seeds it again.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.includes('--reset')) {
    for (const suffix of ['', '-wal', '-shm']) {
      rmSync(DEFAULT_DB_FILE + suffix, { force: true });
    }
  }
  const db = openDatabase(DEFAULT_DB_FILE);
  if (isEmpty(db)) {
    console.log('Seeding demo data (hashing passwords takes a few seconds)…');
    const summary = await seedDatabase(db);
    console.log(`Done: ${summary.users} users, ${summary.resources} resources, ${summary.reservations} reservations, ${summary.requests} requests.`);
  } else {
    console.log('The database already has data. Use "npm run reset-db" to start over.');
  }
  db.close();
}
