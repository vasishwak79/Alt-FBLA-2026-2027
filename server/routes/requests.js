/**
 * /api/requests: service requests ("tickets") such as repairs, tech help,
 * or supply restocks, plus the conversation thread on each one.
 */

import { PRIORITIES, REQUEST_CATEGORIES, REQUEST_STATUSES, labelFor, requestCode } from '../../shared/constants.js';
import { notify, notifyAdmins, writeAudit } from '../db.js';
import { HttpError } from '../http-utils.js';
import { integer, oneOf, parseId, text, validate } from '../validation.js';

const REQUEST_SELECT = `
  SELECT sr.*, u.name AS user_name, u.email AS user_email,
         a.name AS assignee_name, res.name AS resource_name,
         (SELECT COUNT(*) FROM request_comments c WHERE c.request_id = sr.id) AS comment_count
    FROM service_requests sr
    JOIN users u ON u.id = sr.user_id
    LEFT JOIN users a ON a.id = sr.assigned_to
    LEFT JOIN resources res ON res.id = sr.resource_id
`;

function formatRequest(row) {
  return {
    id: row.id,
    code: requestCode(row.id),
    userId: row.user_id,
    userName: row.user_name,
    category: row.category,
    title: row.title,
    description: row.description,
    location: row.location,
    priority: row.priority,
    status: row.status,
    assigneeName: row.assignee_name,
    resourceId: row.resource_id,
    resourceName: row.resource_name,
    commentCount: row.comment_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    resolvedAt: row.resolved_at,
  };
}

function getRequestRow(db, id) {
  const row = db.prepare(`${REQUEST_SELECT} WHERE sr.id = ?`).get(id);
  if (!row) throw new HttpError(404, 'That request could not be found.');
  return row;
}

/** Members may only see their own requests; staff may see all of them. */
function getVisibleRequest(ctx, id) {
  const user = ctx.requireUser();
  const row = getRequestRow(ctx.db, id);
  if (row.user_id !== user.id && user.role !== 'admin') {
    throw new HttpError(404, 'That request could not be found.');
  }
  return { user, row };
}

export function registerRequestRoutes(router) {
  router.get('/api/requests/mine', (ctx) => {
    const user = ctx.requireUser();
    const rows = ctx.db.prepare(`${REQUEST_SELECT} WHERE sr.user_id = ? ORDER BY sr.updated_at DESC`).all(user.id);
    return { requests: rows.map(formatRequest) };
  });

  router.post('/api/requests', (ctx) => {
    const user = ctx.requireUser();
    const values = validate(ctx.body, {
      category: oneOf({ label: 'Request type', options: REQUEST_CATEGORIES }),
      title: text({ label: 'Summary', min: 5, max: 100 }),
      description: text({ label: 'Details', min: 10, max: 2000 }),
      location: text({ label: 'Location', min: 2, max: 80 }),
      priority: oneOf({ label: 'Priority', options: PRIORITIES, required: false, fallback: 'normal' }),
      resourceId: integer({ label: 'Related resource', min: 1, required: false }),
    });

    if (values.resourceId !== null) {
      const exists = ctx.db.prepare(`SELECT id FROM resources WHERE id = ?`).get(values.resourceId);
      if (!exists) values.resourceId = null;
    }

    const now = Date.now();
    const result = ctx.db
      .prepare(
        `INSERT INTO service_requests
           (user_id, category, title, description, location, priority, status, resource_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?, ?)`,
      )
      .run(user.id, values.category, values.title, values.description, values.location, values.priority, values.resourceId, now, now);

    const id = Number(result.lastInsertRowid);
    const code = requestCode(id);
    writeAudit(ctx.db, { actorId: user.id, action: 'submitted request', entity: 'request', entityId: id, details: `${code} · ${values.title}` });
    notifyAdmins(ctx.db, `New ${values.priority === 'urgent' ? 'URGENT ' : ''}request ${code} from ${user.name}: ${values.title}`, `/requests/${id}`, user.id);

    ctx.status = 201;
    return { request: formatRequest(getRequestRow(ctx.db, id)) };
  });

  router.get('/api/requests/:id', (ctx) => {
    const { row } = getVisibleRequest(ctx, parseId(ctx.params.id));
    const comments = ctx.db
      .prepare(
        `SELECT c.id, c.body, c.created_at, u.id AS user_id, u.name AS user_name, u.role AS user_role
           FROM request_comments c
           JOIN users u ON u.id = c.user_id
          WHERE c.request_id = ?
          ORDER BY c.created_at ASC`,
      )
      .all(row.id)
      .map((comment) => ({
        id: comment.id,
        body: comment.body,
        createdAt: comment.created_at,
        userId: comment.user_id,
        userName: comment.user_name,
        isStaff: comment.user_role === 'admin',
      }));

    return { request: formatRequest(row), comments };
  });

  router.post('/api/requests/:id/comments', (ctx) => {
    const { user, row } = getVisibleRequest(ctx, parseId(ctx.params.id));
    if (row.status === 'closed') {
      throw new HttpError(409, 'This request is closed. Submit a new request if you still need help.');
    }
    const { body } = validate(ctx.body, { body: text({ label: 'Message', min: 1, max: 1000 }) });

    const now = Date.now();
    ctx.db
      .prepare(`INSERT INTO request_comments (request_id, user_id, body, created_at) VALUES (?, ?, ?, ?)`)
      .run(row.id, user.id, body, now);
    ctx.db.prepare(`UPDATE service_requests SET updated_at = ? WHERE id = ?`).run(now, row.id);

    const code = requestCode(row.id);
    if (user.id === row.user_id) {
      notifyAdmins(ctx.db, `${user.name} replied on ${code}: ${row.title}`, `/requests/${row.id}`, user.id);
    } else {
      notify(ctx.db, row.user_id, `${user.name} replied to your request ${code}.`, `/requests/${row.id}`);
    }

    ctx.status = 201;
    return { ok: true };
  });

  /** Staff update the status or priority of a request. */
  router.patch('/api/requests/:id', (ctx) => {
    const admin = ctx.requireAdmin();
    const row = getRequestRow(ctx.db, parseId(ctx.params.id));
    const values = validate(ctx.body, {
      status: oneOf({ label: 'Status', options: REQUEST_STATUSES, required: false, fallback: row.status }),
      priority: oneOf({ label: 'Priority', options: PRIORITIES, required: false, fallback: row.priority }),
    });

    const now = Date.now();
    const isFinished = ['resolved', 'closed'].includes(values.status);
    const resolvedAt = isFinished ? (row.resolved_at ?? now) : null;
    // Whoever starts working on a request becomes its owner.
    const assignee = values.status === 'in_progress' && !row.assigned_to ? admin.id : row.assigned_to;

    ctx.db
      .prepare(
        `UPDATE service_requests
            SET status = ?, priority = ?, assigned_to = ?, resolved_at = ?, updated_at = ?
          WHERE id = ?`,
      )
      .run(values.status, values.priority, assignee, resolvedAt, now, row.id);

    const code = requestCode(row.id);
    const changes = [];
    if (values.status !== row.status) changes.push(`status → ${labelFor(REQUEST_STATUSES, values.status)}`);
    if (values.priority !== row.priority) changes.push(`priority → ${labelFor(PRIORITIES, values.priority)}`);

    if (changes.length > 0) {
      writeAudit(ctx.db, { actorId: admin.id, action: 'updated request', entity: 'request', entityId: row.id, details: `${code} · ${changes.join(', ')}` });
    }
    if (values.status !== row.status) {
      notify(ctx.db, row.user_id, `Your request ${code} is now “${labelFor(REQUEST_STATUSES, values.status)}”.`, `/requests/${row.id}`);
    }

    return { request: formatRequest(getRequestRow(ctx.db, row.id)) };
  });

  router.get('/api/admin/requests', (ctx) => {
    ctx.requireAdmin();
    const rows = ctx.db
      .prepare(
        `${REQUEST_SELECT}
          ORDER BY CASE sr.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
                   sr.created_at ASC`,
      )
      .all();
    return { requests: rows.map(formatRequest) };
  });
}
