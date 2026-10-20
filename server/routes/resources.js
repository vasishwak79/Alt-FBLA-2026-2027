/**
 * /api/resources: the catalog of shared equipment and spaces.
 * Anyone can browse; only administrators can add or edit resources.
 */

import { RESOURCE_CATEGORIES, RESOURCE_STATUSES, SLOT_MINUTES } from '../../shared/constants.js';
import { availableNowById, checkReservation, formatResource, loadBookings } from '../booking.js';
import { writeAudit } from '../db.js';
import { HttpError } from '../http-utils.js';
import { slotAvailability } from '../scheduling.js';
import { boolean, integer, oneOf, parseId, text, timestamp, validate } from '../validation.js';

const DAY_MS = 24 * 60 * 60 * 1000;

const RESOURCE_SCHEMA = {
  name: text({ label: 'Name', min: 2, max: 80 }),
  category: oneOf({ label: 'Category', options: RESOURCE_CATEGORIES }),
  description: text({ label: 'Description', required: false, max: 1000 }),
  location: text({ label: 'Location', min: 2, max: 80 }),
  quantity: integer({ label: 'Quantity', min: 1, max: 500 }),
  capacity: integer({ label: 'Capacity', min: 1, max: 2000, required: false }),
  maxHours: integer({ label: 'Maximum hours', min: 1, max: 336 }),
  requiresApproval: boolean(),
  status: oneOf({ label: 'Status', options: RESOURCE_STATUSES, required: false, fallback: 'active' }),
  tags: text({ label: 'Tags', required: false, max: 200 }),
};

/** Escapes % and _ so a search for "100%" is taken literally. */
function likePattern(search) {
  return `%${search.replace(/[\\%_]/g, (character) => `\\${character}`)}%`;
}

function getResourceRow(db, id) {
  const row = db.prepare(`SELECT * FROM resources WHERE id = ?`).get(id);
  if (!row) throw new HttpError(404, 'That resource could not be found.');
  return row;
}

function normalizeTags(tags) {
  return tags
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .join(', ');
}

export function registerResourceRoutes(router) {
  router.get('/api/resources', (ctx) => {
    const search = (ctx.query.get('q') ?? '').trim().slice(0, 100);
    const category = ctx.query.get('category') ?? '';
    const onlyAvailable = ctx.query.get('available') === '1';
    const sort = ctx.query.get('sort') ?? 'name';
    const includeRetired = ctx.query.get('all') === '1' && ctx.user?.role === 'admin';

    const conditions = [];
    const params = [];

    if (!includeRetired) {
      conditions.push(`status != 'retired'`);
    }
    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }
    if (search) {
      conditions.push(
        `(name LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\'
          OR tags LIKE ? ESCAPE '\\' OR location LIKE ? ESCAPE '\\')`,
      );
      const pattern = likePattern(search);
      params.push(pattern, pattern, pattern, pattern);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = ctx.db.prepare(`SELECT * FROM resources ${where} ORDER BY name COLLATE NOCASE`).all(...params);

    const freeNow = availableNowById(ctx.db, rows);
    let resources = rows.map((row) => formatResource(row, freeNow.get(row.id)));

    if (onlyAvailable) {
      resources = resources.filter((resource) => resource.availableNow > 0);
    }
    if (sort === 'available') {
      resources.sort((a, b) => b.availableNow - a.availableNow || a.name.localeCompare(b.name));
    } else if (sort === 'category') {
      resources.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    }

    return { resources };
  });

  router.get('/api/resources/:id', (ctx) => {
    const row = getResourceRow(ctx.db, parseId(ctx.params.id));
    if (row.status === 'retired' && ctx.user?.role !== 'admin') {
      throw new HttpError(404, 'That resource could not be found.');
    }

    const freeNow = availableNowById(ctx.db, [row]);
    const stats = ctx.db
      .prepare(
        `SELECT COUNT(*) AS total,
                SUM(CASE WHEN start_at > ? AND status IN ('pending', 'approved') THEN 1 ELSE 0 END) AS upcoming
           FROM reservations WHERE resource_id = ?`,
      )
      .get(Date.now(), row.id);
    const openIssues = ctx.db
      .prepare(
        `SELECT COUNT(*) AS count FROM service_requests
          WHERE resource_id = ? AND status IN ('open', 'in_progress')`,
      )
      .get(row.id).count;

    return {
      resource: {
        ...formatResource(row, freeNow.get(row.id)),
        totalReservations: stats.total,
        upcomingReservations: stats.upcoming ?? 0,
        openIssues,
      },
    };
  });

  /** Free units in each 30-minute slot of a time range (max 8 days). */
  router.get('/api/resources/:id/availability', (ctx) => {
    const row = getResourceRow(ctx.db, parseId(ctx.params.id));
    const { from, to } = validate(Object.fromEntries(ctx.query), {
      from: timestamp({ label: 'From' }),
      to: timestamp({ label: 'To' }),
    });
    if (to <= from || to - from > 8 * DAY_MS) {
      throw new HttpError(400, 'Choose a range of up to 8 days.');
    }

    const slotMs = SLOT_MINUTES * 60 * 1000;
    const bookings = loadBookings(ctx.db, row.id, from, to);
    const quantity = row.status === 'active' ? row.quantity : 0;

    return {
      quantity: row.quantity,
      status: row.status,
      slots: slotAvailability(quantity, bookings, from, to, slotMs),
    };
  });

  /** Live preview used by the reservation form before submitting. */
  router.get('/api/resources/:id/check', (ctx) => {
    const row = getResourceRow(ctx.db, parseId(ctx.params.id));
    const values = validate(Object.fromEntries(ctx.query), {
      start: timestamp({ label: 'Start' }),
      end: timestamp({ label: 'End' }),
      quantity: integer({ label: 'Quantity', min: 1, max: 500, required: false, fallback: 1 }),
    });
    const { available, problem } = checkReservation(ctx.db, row, values);
    return { available, total: row.quantity, ok: problem === null, problem };
  });

  router.post('/api/resources', (ctx) => {
    const admin = ctx.requireAdmin();
    const values = validate(ctx.body, RESOURCE_SCHEMA);
    const now = Date.now();

    const result = ctx.db
      .prepare(
        `INSERT INTO resources
           (name, category, description, location, quantity, capacity, max_hours,
            requires_approval, status, tags, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        values.name,
        values.category,
        values.description,
        values.location,
        values.quantity,
        values.category === 'spaces' ? values.capacity : null,
        values.maxHours,
        values.requiresApproval ? 1 : 0,
        values.status,
        normalizeTags(values.tags),
        now,
        now,
      );

    const id = Number(result.lastInsertRowid);
    writeAudit(ctx.db, { actorId: admin.id, action: 'added resource', entity: 'resource', entityId: id, details: values.name });

    ctx.status = 201;
    return { resource: formatResource(getResourceRow(ctx.db, id), values.status === 'active' ? values.quantity : 0) };
  });

  router.put('/api/resources/:id', (ctx) => {
    const admin = ctx.requireAdmin();
    const id = parseId(ctx.params.id);
    const before = getResourceRow(ctx.db, id);
    const values = validate(ctx.body, RESOURCE_SCHEMA);

    ctx.db
      .prepare(
        `UPDATE resources
            SET name = ?, category = ?, description = ?, location = ?, quantity = ?, capacity = ?,
                max_hours = ?, requires_approval = ?, status = ?, tags = ?, updated_at = ?
          WHERE id = ?`,
      )
      .run(
        values.name,
        values.category,
        values.description,
        values.location,
        values.quantity,
        values.category === 'spaces' ? values.capacity : null,
        values.maxHours,
        values.requiresApproval ? 1 : 0,
        values.status,
        normalizeTags(values.tags),
        Date.now(),
        id,
      );

    const details = before.status !== values.status ? `${values.name}: status ${before.status} → ${values.status}` : values.name;
    writeAudit(ctx.db, { actorId: admin.id, action: 'updated resource', entity: 'resource', entityId: id, details });

    const row = getResourceRow(ctx.db, id);
    return { resource: formatResource(row, availableNowById(ctx.db, [row]).get(id)) };
  });
}
