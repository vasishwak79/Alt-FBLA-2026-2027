/**
 * /api/notifications: in-app alerts for the signed-in user.
 * /api/announcements: news posted by staff for everyone.
 */

import { writeAudit } from '../db.js';
import { HttpError } from '../http-utils.js';
import { boolean, parseId, text, validate } from '../validation.js';

function formatAnnouncement(row) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    pinned: Boolean(row.pinned),
    authorName: row.author_name,
    createdAt: row.created_at,
  };
}

export function registerCommunityRoutes(router) {
  router.get('/api/notifications', (ctx) => {
    const user = ctx.requireUser();
    const notifications = ctx.db
      .prepare(
        `SELECT id, message, link, is_read, created_at FROM notifications
          WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 30`,
      )
      .all(user.id)
      .map((row) => ({
        id: row.id,
        message: row.message,
        link: row.link,
        read: Boolean(row.is_read),
        createdAt: row.created_at,
      }));
    const { unread } = ctx.db
      .prepare(`SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = 0`)
      .get(user.id);

    return { notifications, unread };
  });

  router.post('/api/notifications/read-all', (ctx) => {
    const user = ctx.requireUser();
    ctx.db.prepare(`UPDATE notifications SET is_read = 1 WHERE user_id = ?`).run(user.id);
    return { ok: true };
  });

  router.post('/api/notifications/:id/read', (ctx) => {
    const user = ctx.requireUser();
    ctx.db
      .prepare(`UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`)
      .run(parseId(ctx.params.id), user.id);
    return { ok: true };
  });

  router.get('/api/announcements', (ctx) => {
    const announcements = ctx.db
      .prepare(
        `SELECT a.*, u.name AS author_name FROM announcements a
           LEFT JOIN users u ON u.id = a.author_id
          ORDER BY a.pinned DESC, a.created_at DESC LIMIT 20`,
      )
      .all()
      .map(formatAnnouncement);
    return { announcements };
  });

  router.post('/api/announcements', (ctx) => {
    const admin = ctx.requireAdmin();
    const values = validate(ctx.body, {
      title: text({ label: 'Title', min: 3, max: 100 }),
      body: text({ label: 'Message', min: 5, max: 1000 }),
      pinned: boolean(),
    });

    const result = ctx.db
      .prepare(`INSERT INTO announcements (title, body, author_id, pinned, created_at) VALUES (?, ?, ?, ?, ?)`)
      .run(values.title, values.body, admin.id, values.pinned ? 1 : 0, Date.now());
    const id = Number(result.lastInsertRowid);
    writeAudit(ctx.db, { actorId: admin.id, action: 'posted announcement', entity: 'announcement', entityId: id, details: values.title });

    const row = ctx.db
      .prepare(`SELECT a.*, u.name AS author_name FROM announcements a LEFT JOIN users u ON u.id = a.author_id WHERE a.id = ?`)
      .get(id);
    ctx.status = 201;
    return { announcement: formatAnnouncement(row) };
  });

  router.delete('/api/announcements/:id', (ctx) => {
    const admin = ctx.requireAdmin();
    const id = parseId(ctx.params.id);
    const row = ctx.db.prepare(`SELECT title FROM announcements WHERE id = ?`).get(id);
    if (!row) throw new HttpError(404, 'That announcement could not be found.');

    ctx.db.prepare(`DELETE FROM announcements WHERE id = ?`).run(id);
    writeAudit(ctx.db, { actorId: admin.id, action: 'removed announcement', entity: 'announcement', entityId: id, details: row.title });
    return { ok: true };
  });
}
