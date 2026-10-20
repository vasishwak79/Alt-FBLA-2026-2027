/**
 * Database connection and schema.
 *
 * Commons uses SQLite through Node's built-in `node:sqlite` module, so the
 * database is a single file on disk and no separate database server or
 * native add-on is required. Every query in the app uses prepared statements
 * with `?` placeholders, which prevents SQL injection.
 */

import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT    NOT NULL,
    email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT    NOT NULL,
    role          TEXT    NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
    title         TEXT,
    created_at    INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT    PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS resources (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    name              TEXT    NOT NULL,
    category          TEXT    NOT NULL,
    description       TEXT    NOT NULL DEFAULT '',
    location          TEXT    NOT NULL DEFAULT '',
    quantity          INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    capacity          INTEGER,
    max_hours         INTEGER NOT NULL DEFAULT 4 CHECK (max_hours >= 1),
    requires_approval INTEGER NOT NULL DEFAULT 0,
    status            TEXT    NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'maintenance', 'retired')),
    tags              TEXT    NOT NULL DEFAULT '',
    created_at        INTEGER NOT NULL,
    updated_at        INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    resource_id    INTEGER NOT NULL REFERENCES resources(id),
    user_id        INTEGER NOT NULL REFERENCES users(id),
    quantity       INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
    start_at       INTEGER NOT NULL,
    end_at         INTEGER NOT NULL,
    purpose        TEXT    NOT NULL DEFAULT '',
    status         TEXT    NOT NULL CHECK (status IN
                   ('pending', 'approved', 'denied', 'cancelled', 'checked_out', 'returned')),
    staff_note     TEXT,
    checked_out_at INTEGER,
    returned_at    INTEGER,
    created_at     INTEGER NOT NULL,
    updated_at     INTEGER NOT NULL,
    CHECK (end_at > start_at)
  );

  CREATE INDEX IF NOT EXISTS idx_reservations_resource_time
    ON reservations (resource_id, start_at, end_at);
  CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations (user_id);

  CREATE TABLE IF NOT EXISTS service_requests (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    category    TEXT    NOT NULL,
    title       TEXT    NOT NULL,
    description TEXT    NOT NULL,
    location    TEXT    NOT NULL DEFAULT '',
    priority    TEXT    NOT NULL DEFAULT 'normal'
                CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status      TEXT    NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to INTEGER REFERENCES users(id),
    resource_id INTEGER REFERENCES resources(id),
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL,
    resolved_at INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_requests_user ON service_requests (user_id);

  CREATE TABLE IF NOT EXISTS request_comments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    body       TEXT    NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message    TEXT    NOT NULL,
    link       TEXT,
    is_read    INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, is_read);

  CREATE TABLE IF NOT EXISTS announcements (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT    NOT NULL,
    body       TEXT    NOT NULL,
    author_id  INTEGER REFERENCES users(id),
    pinned     INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_id   INTEGER REFERENCES users(id),
    action     TEXT    NOT NULL,
    entity     TEXT    NOT NULL,
    entity_id  INTEGER,
    details    TEXT,
    created_at INTEGER NOT NULL
  );
`;

/** Default location of the database file (ignored by git). */
export const DEFAULT_DB_FILE = path.resolve(import.meta.dirname, '..', 'data', 'commons.db');

/**
 * Opens (or creates) the database and makes sure every table exists.
 * Pass ':memory:' for a throwaway database, which the automated tests use.
 */
export function openDatabase(file = DEFAULT_DB_FILE) {
  if (file !== ':memory:') {
    mkdirSync(path.dirname(file), { recursive: true });
  }

  const db = new DatabaseSync(file);
  db.exec('PRAGMA foreign_keys = ON;');
  if (file !== ':memory:') {
    db.exec('PRAGMA journal_mode = WAL;');
  }
  db.exec(SCHEMA);
  return db;
}

/**
 * Runs `work` inside a transaction: every change is saved together,
 * or none of them are if an error is thrown.
 */
export function transaction(db, work) {
  db.exec('BEGIN');
  try {
    const result = work();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

/** Records who did what, so managers can review changes later. */
export function writeAudit(db, { actorId, action, entity, entityId = null, details = '' }) {
  db.prepare(
    `INSERT INTO audit_log (actor_id, action, entity, entity_id, details, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(actorId ?? null, action, entity, entityId, details, Date.now());
}

/** Sends an in-app notification to one user. */
export function notify(db, userId, message, link = null) {
  db.prepare(
    `INSERT INTO notifications (user_id, message, link, is_read, created_at)
     VALUES (?, ?, ?, 0, ?)`,
  ).run(userId, message, link, Date.now());
}

/** Sends the same notification to every administrator. */
export function notifyAdmins(db, message, link = null, exceptUserId = null) {
  const admins = db.prepare(`SELECT id FROM users WHERE role = 'admin'`).all();
  for (const admin of admins) {
    if (admin.id !== exceptUserId) {
      notify(db, admin.id, message, link);
    }
  }
}
