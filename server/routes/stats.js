/**
 * /api/stats: live numbers for the home page.
 * /api/admin/overview: the analytics dashboard for staff.
 * /api/admin/audit: the activity log.
 */

import { RESOURCE_CATEGORIES } from '../../shared/constants.js';
import { availableNowById } from '../booking.js';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function startOfDay(time) {
  const date = new Date(time);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

/** Hours from request to resolution for recently resolved requests. */
function resolutionHours(db, since) {
  return db
    .prepare(`SELECT created_at, resolved_at FROM service_requests WHERE resolved_at IS NOT NULL AND resolved_at >= ?`)
    .all(since)
    .map((row) => (row.resolved_at - row.created_at) / HOUR_MS);
}

/**
 * How many active resources were reserved at least once in the last
 * `days` days. Idle items are candidates for relocating or retiring.
 */
function resourcesUsed(db, now, days) {
  const since = startOfDay(now) - (days - 1) * DAY_MS;
  const { used } = db
    .prepare(
      `SELECT COUNT(DISTINCT r.resource_id) AS used
         FROM reservations r JOIN resources res ON res.id = r.resource_id
        WHERE res.status = 'active' AND r.status NOT IN ('cancelled', 'denied')
          AND r.start_at < ? AND r.end_at > ?`,
    )
    .get(now, since);
  const { total } = db.prepare(`SELECT COUNT(*) AS total FROM resources WHERE status = 'active'`).get();
  return { used, total };
}

export function registerStatsRoutes(router) {
  router.get('/api/stats/summary', (ctx) => {
    const now = Date.now();
    const resources = ctx.db.prepare(`SELECT id, quantity, status, category FROM resources WHERE status != 'retired'`).all();
    const freeNow = availableNowById(ctx.db, resources, now);

    const { reservations } = ctx.db
      .prepare(
        `SELECT COUNT(*) AS reservations FROM reservations
          WHERE start_at >= ? AND start_at < ? AND status NOT IN ('cancelled', 'denied')`,
      )
      .get(now - 30 * DAY_MS, now);

    const categories = RESOURCE_CATEGORIES.map((category) => ({
      id: category.id,
      count: resources.filter((resource) => resource.category === category.id).length,
    }));

    const hours = resolutionHours(ctx.db, now - 90 * DAY_MS);

    return {
      resources: resources.length,
      units: resources.reduce((sum, resource) => sum + resource.quantity, 0),
      availableNow: [...freeNow.values()].filter((free) => free > 0).length,
      reservationsLast30Days: reservations,
      medianResolutionHours: median(hours),
      categories,
    };
  });

  router.get('/api/admin/overview', (ctx) => {
    ctx.requireAdmin();
    const now = Date.now();
    const db = ctx.db;

    const count = (sql, ...params) => db.prepare(sql).get(...params).count;
    const kpis = {
      pendingApprovals: count(`SELECT COUNT(*) AS count FROM reservations WHERE status = 'pending'`),
      checkedOut: count(`SELECT COUNT(*) AS count FROM reservations WHERE status = 'checked_out'`),
      overdue: count(`SELECT COUNT(*) AS count FROM reservations WHERE status = 'checked_out' AND end_at <= ?`, now),
      openRequests: count(`SELECT COUNT(*) AS count FROM service_requests WHERE status IN ('open', 'in_progress')`),
      urgentRequests: count(
        `SELECT COUNT(*) AS count FROM service_requests WHERE status IN ('open', 'in_progress') AND priority = 'urgent'`,
      ),
      resourcesUsed: resourcesUsed(db, now, 7),
      medianResolutionHours: median(resolutionHours(db, now - 90 * DAY_MS)),
    };

    // Reservations starting on each of the last 14 days.
    const today = new Date(now);
    const firstDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 13).getTime();
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).getTime();
    const recent = db
      .prepare(
        `SELECT start_at FROM reservations
          WHERE start_at >= ? AND start_at < ? AND status NOT IN ('cancelled', 'denied')`,
      )
      .all(firstDay, tomorrow);
    // Build each day with calendar math so daylight-saving changes never shift a bar.
    const first = new Date(firstDay);
    const daily = Array.from({ length: 14 }, (_, index) => ({
      date: new Date(first.getFullYear(), first.getMonth(), first.getDate() + index).getTime(),
      count: 0,
    }));
    for (const row of recent) {
      const index = Math.round((startOfDay(row.start_at) - firstDay) / DAY_MS);
      if (daily[index]) daily[index].count += 1;
    }

    const since30 = now - 30 * DAY_MS;
    const categoryCounts = db
      .prepare(
        `SELECT res.category AS category, COUNT(*) AS count
           FROM reservations r JOIN resources res ON res.id = r.resource_id
          WHERE r.start_at >= ? AND r.status NOT IN ('cancelled', 'denied')
          GROUP BY res.category`,
      )
      .all(since30);
    const byCategory = RESOURCE_CATEGORIES.map((category) => ({
      id: category.id,
      label: category.label,
      count: categoryCounts.find((row) => row.category === category.id)?.count ?? 0,
    }));

    const statusCounts = db.prepare(`SELECT status, COUNT(*) AS count FROM service_requests GROUP BY status`).all();
    const requestsByStatus = ['open', 'in_progress', 'resolved', 'closed'].map((status) => ({
      status,
      count: statusCounts.find((row) => row.status === status)?.count ?? 0,
    }));

    const topResources = db
      .prepare(
        `SELECT res.id, res.name, res.category, COUNT(*) AS count
           FROM reservations r JOIN resources res ON res.id = r.resource_id
          WHERE r.start_at >= ? AND r.status NOT IN ('cancelled', 'denied')
          GROUP BY res.id ORDER BY count DESC, res.name LIMIT 5`,
      )
      .all(since30)
      .map((row) => ({ ...row }));

    return { kpis, daily, byCategory, requestsByStatus, topResources };
  });

  router.get('/api/admin/audit', (ctx) => {
    ctx.requireAdmin();
    const entries = ctx.db
      .prepare(
        `SELECT l.id, l.action, l.entity, l.entity_id, l.details, l.created_at, u.name AS actor_name
           FROM audit_log l LEFT JOIN users u ON u.id = l.actor_id
          ORDER BY l.created_at DESC, l.id DESC LIMIT 100`,
      )
      .all()
      .map((row) => ({
        id: row.id,
        action: row.action,
        entity: row.entity,
        entityId: row.entity_id,
        details: row.details,
        actorName: row.actor_name ?? 'System',
        createdAt: row.created_at,
      }));
    return { entries };
  });
}
