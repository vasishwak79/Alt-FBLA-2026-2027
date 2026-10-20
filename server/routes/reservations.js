/**
 * /api/reservations: members reserve resources and manage their bookings.
 * /api/admin/reservations: staff approve, deny, check out, and check in.
 */

import { reservationCode } from '../../shared/constants.js';
import { RESERVATION_SELECT, checkReservation, formatReservation } from '../booking.js';
import { notify, notifyAdmins, transaction, writeAudit } from '../db.js';
import { HttpError, csvCell } from '../http-utils.js';
import { integer, parseId, text, timestamp, validate } from '../validation.js';

/*
 * The reservation lifecycle as a state machine. Each staff action lists the
 * statuses it can start from and the status it moves the reservation to.
 *
 *   pending ──approve──▶ approved ──checkout──▶ checked_out ──return──▶ returned
 *      │                    │
 *      └──────deny──────────┴──▶ denied          (members can also cancel)
 */
const STAFF_ACTIONS = {
  approve: {
    from: ['pending'],
    to: 'approved',
    verb: 'approved',
    message: (r) => `Your reservation for ${r.resource_name} (${reservationCode(r.id)}) was approved.`,
  },
  deny: {
    from: ['pending', 'approved'],
    to: 'denied',
    verb: 'denied',
    noteRequired: true,
    message: (r) => `Your reservation for ${r.resource_name} (${reservationCode(r.id)}) was denied.`,
  },
  checkout: {
    from: ['approved'],
    to: 'checked_out',
    verb: 'checked out',
    equipmentOnly: true,
    message: (r) => `You checked out ${r.resource_name}. Please return it by the due time.`,
  },
  return: {
    from: ['checked_out'],
    to: 'returned',
    verb: 'checked in',
    equipmentOnly: true,
    message: (r) => `${r.resource_name} was checked back in. Thank you for returning it!`,
  },
};

const ADMIN_FILTERS = {
  pending: `r.status = 'pending'`,
  upcoming: `r.status = 'approved' AND r.end_at > :now`,
  checked_out: `r.status = 'checked_out'`,
  overdue: `r.status = 'checked_out' AND r.end_at <= :now`,
  today: `r.start_at < :dayEnd AND r.end_at > :dayStart AND r.status IN ('pending', 'approved', 'checked_out', 'returned')`,
  all: '1 = 1',
};

function getReservationRow(db, id) {
  const row = db.prepare(`${RESERVATION_SELECT} WHERE r.id = ?`).get(id);
  if (!row) throw new HttpError(404, 'That reservation could not be found.');
  return row;
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
}

export function registerReservationRoutes(router) {
  router.get('/api/reservations/mine', (ctx) => {
    const user = ctx.requireUser();
    const rows = ctx.db.prepare(`${RESERVATION_SELECT} WHERE r.user_id = ? ORDER BY r.start_at DESC`).all(user.id);
    return { reservations: rows.map((row) => formatReservation(row)) };
  });

  router.post('/api/reservations', (ctx) => {
    const user = ctx.requireUser();
    const values = validate(ctx.body, {
      resourceId: integer({ label: 'Resource', min: 1 }),
      start: timestamp({ label: 'Start time' }),
      end: timestamp({ label: 'End time' }),
      quantity: integer({ label: 'Quantity', min: 1, max: 500, required: false, fallback: 1 }),
      purpose: text({ label: 'Purpose', min: 3, max: 300 }),
    });

    // The availability check and the insert happen inside one transaction,
    // so two people can never book the last unit at the same moment.
    const reservation = transaction(ctx.db, () => {
      const resource = ctx.db.prepare(`SELECT * FROM resources WHERE id = ?`).get(values.resourceId);
      if (!resource || resource.status === 'retired') {
        throw new HttpError(404, 'That resource could not be found.');
      }

      const { problem } = checkReservation(ctx.db, resource, values);
      if (problem) {
        throw new HttpError(409, problem);
      }

      const now = Date.now();
      const status = resource.requires_approval ? 'pending' : 'approved';
      const result = ctx.db
        .prepare(
          `INSERT INTO reservations
             (resource_id, user_id, quantity, start_at, end_at, purpose, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(resource.id, user.id, values.quantity, values.start, values.end, values.purpose, status, now, now);

      const id = Number(result.lastInsertRowid);
      const code = reservationCode(id);
      writeAudit(ctx.db, {
        actorId: user.id,
        action: 'reserved',
        entity: 'reservation',
        entityId: id,
        details: `${code} · ${resource.name} ×${values.quantity}`,
      });

      if (status === 'pending') {
        notifyAdmins(ctx.db, `${user.name} requested ${resource.name} (${code}). It needs your approval.`, '/admin?tab=reservations');
        notify(ctx.db, user.id, `Your request for ${resource.name} (${code}) was sent for approval.`, '/dashboard');
      }

      return getReservationRow(ctx.db, id);
    });

    ctx.status = 201;
    return { reservation: formatReservation(reservation) };
  });

  router.post('/api/reservations/:id/cancel', (ctx) => {
    const user = ctx.requireUser();
    const row = getReservationRow(ctx.db, parseId(ctx.params.id));
    const isOwner = row.user_id === user.id;
    const isAdmin = user.role === 'admin';

    if (!isOwner && !isAdmin) {
      throw new HttpError(403, 'You can only cancel your own reservations.');
    }
    if (!['pending', 'approved'].includes(row.status)) {
      throw new HttpError(409, 'Only upcoming reservations can be cancelled.');
    }
    if (!isAdmin && row.end_at <= Date.now()) {
      throw new HttpError(409, 'This reservation has already ended.');
    }

    ctx.db
      .prepare(`UPDATE reservations SET status = 'cancelled', updated_at = ? WHERE id = ?`)
      .run(Date.now(), row.id);
    writeAudit(ctx.db, {
      actorId: user.id,
      action: 'cancelled',
      entity: 'reservation',
      entityId: row.id,
      details: `${reservationCode(row.id)} · ${row.resource_name}`,
    });
    if (!isOwner) {
      notify(ctx.db, row.user_id, `Your reservation for ${row.resource_name} (${reservationCode(row.id)}) was cancelled by staff.`, '/dashboard');
    }

    return { reservation: formatReservation(getReservationRow(ctx.db, row.id)) };
  });

  router.get('/api/admin/reservations', (ctx) => {
    ctx.requireAdmin();
    const filter = ctx.query.get('status') ?? 'pending';
    const condition = ADMIN_FILTERS[filter];
    if (!condition) throw new HttpError(400, 'Unknown filter.');

    const dayStart = startOfToday();
    const params = { now: Date.now(), dayStart, dayEnd: dayStart + 24 * 60 * 60 * 1000 };
    const usedParams = Object.fromEntries(Object.entries(params).filter(([key]) => condition.includes(`:${key}`)));
    const order = filter === 'all' ? 'r.created_at DESC' : 'r.start_at ASC';

    const rows = ctx.db.prepare(`${RESERVATION_SELECT} WHERE ${condition} ORDER BY ${order} LIMIT 300`).all(usedParams);
    return { reservations: rows.map((row) => formatReservation(row)) };
  });

  router.post('/api/admin/reservations/:id/:action', (ctx) => {
    const admin = ctx.requireAdmin();
    const action = STAFF_ACTIONS[ctx.params.action];
    if (!action) throw new HttpError(404, 'Unknown action.');

    const row = getReservationRow(ctx.db, parseId(ctx.params.id));
    const { note } = validate(ctx.body, {
      note: text({ label: 'Note', required: Boolean(action.noteRequired), max: 300 }),
    });

    if (!action.from.includes(row.status)) {
      throw new HttpError(409, `A reservation that is "${row.status.replace('_', ' ')}" cannot be ${action.verb}.`);
    }
    if (action.equipmentOnly && row.resource_category === 'spaces') {
      throw new HttpError(409, 'Rooms and spaces are not checked out or returned.');
    }

    const now = Date.now();
    ctx.db
      .prepare(
        `UPDATE reservations
            SET status = ?,
                staff_note = COALESCE(NULLIF(?, ''), staff_note),
                checked_out_at = CASE WHEN ? = 'checked_out' THEN ? ELSE checked_out_at END,
                returned_at = CASE WHEN ? = 'returned' THEN ? ELSE returned_at END,
                updated_at = ?
          WHERE id = ?`,
      )
      .run(action.to, note, action.to, now, action.to, now, now, row.id);

    const code = reservationCode(row.id);
    writeAudit(ctx.db, {
      actorId: admin.id,
      action: action.verb,
      entity: 'reservation',
      entityId: row.id,
      details: `${code} · ${row.resource_name} for ${row.user_name}${note ? ` (“${note}”)` : ''}`,
    });
    notify(ctx.db, row.user_id, action.message(row) + (note ? ` Note from staff: ${note}` : ''), '/dashboard');

    return { reservation: formatReservation(getReservationRow(ctx.db, row.id)) };
  });

  /** Downloads every reservation as a spreadsheet-friendly CSV file. */
  router.get('/api/admin/export/reservations.csv', (ctx) => {
    ctx.requireAdmin();
    const rows = ctx.db.prepare(`${RESERVATION_SELECT} ORDER BY r.start_at DESC`).all();

    const header = ['Code', 'Resource', 'Category', 'Member', 'Email', 'Quantity', 'Start', 'End', 'Status', 'Purpose', 'Staff note'];
    const lines = [header.join(',')];
    for (const row of rows) {
      lines.push(
        [
          reservationCode(row.id),
          row.resource_name,
          row.resource_category,
          row.user_name,
          row.user_email,
          row.quantity,
          new Date(row.start_at).toISOString(),
          new Date(row.end_at).toISOString(),
          row.status,
          row.purpose,
          row.staff_note,
        ]
          .map(csvCell)
          .join(','),
      );
    }

    const body = `﻿${lines.join('\r\n')}`;
    const date = new Date().toISOString().slice(0, 10);
    ctx.res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="commons-reservations-${date}.csv"`,
      'Cache-Control': 'no-store',
    });
    ctx.res.end(body);
  });
}
