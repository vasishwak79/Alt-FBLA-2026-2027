/**
 * Authentication: password hashing, sessions, and login rate limiting.
 *
 * - Passwords are hashed with scrypt using the OWASP-recommended settings
 *   (N = 2^17, r = 8, p = 1) and a random 16-byte salt per user.
 * - Sessions use a random 256-bit token stored in an HttpOnly cookie.
 *   Only a SHA-256 hash of the token is saved in the database, so a stolen
 *   database file cannot be used to log in.
 */

import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);

const SCRYPT_PARAMS = { N: 2 ** 17, r: 8, p: 1 };
// scrypt needs about 128 * N * r bytes of memory (128 MiB here).
const SCRYPT_MAX_MEMORY = 256 * 1024 * 1024;
const KEY_LENGTH = 32;

export const SESSION_COOKIE = 'commons_session';
export const SESSION_DAYS = 7;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password.normalize('NFKC'), salt, KEY_LENGTH, {
    ...SCRYPT_PARAMS,
    maxmem: SCRYPT_MAX_MEMORY,
  });
  return [
    'scrypt',
    SCRYPT_PARAMS.N,
    SCRYPT_PARAMS.r,
    SCRYPT_PARAMS.p,
    salt.toString('base64'),
    key.toString('base64'),
  ].join('$');
}

export async function verifyPassword(password, storedHash) {
  const [algorithm, N, r, p, saltText, keyText] = String(storedHash).split('$');
  if (algorithm !== 'scrypt' || !saltText || !keyText) return false;

  const expected = Buffer.from(keyText, 'base64');
  const actual = await scryptAsync(password.normalize('NFKC'), Buffer.from(saltText, 'base64'), expected.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p),
    maxmem: SCRYPT_MAX_MEMORY,
  });
  // Constant-time comparison so response timing reveals nothing.
  return timingSafeEqual(actual, expected);
}

/*
 * When someone logs in with an email that does not exist we still run one
 * scrypt check, so attackers cannot discover valid emails by timing.
 */
let dummyHash = null;
export async function runDummyPasswordCheck(password) {
  dummyHash ??= await hashPassword('timing-equalizer-placeholder');
  await verifyPassword(password, dummyHash);
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function createSession(db, userId) {
  const token = randomBytes(32).toString('base64url');
  const now = Date.now();
  db.prepare(
    `INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`,
  ).run(hashToken(token), userId, now, now + SESSION_MS);
  return token;
}

export function findSessionUser(db, token) {
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.role, u.title
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .get(hashToken(token), Date.now());
  return row ? { ...row } : null;
}

export function deleteSession(db, token) {
  if (token) {
    db.prepare(`DELETE FROM sessions WHERE token_hash = ?`).run(hashToken(token));
  }
}

export function deleteExpiredSessions(db) {
  db.prepare(`DELETE FROM sessions WHERE expires_at <= ?`).run(Date.now());
}

/** The safe, public shape of a user (never includes the password hash). */
export function publicUser(user) {
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role, title: user.title };
}

/**
 * Simple fixed-window rate limiter kept in memory.
 * Used to slow down password-guessing on the login form.
 */
export class RateLimiter {
  constructor({ limit, windowMs }) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.hits = new Map();
  }

  /** Returns how many seconds to wait, or 0 if the request may proceed. */
  check(key) {
    const now = Date.now();
    const entry = this.hits.get(key);

    if (!entry || entry.resetAt <= now) {
      this.hits.set(key, { count: 1, resetAt: now + this.windowMs });
      return 0;
    }
    entry.count += 1;
    return entry.count > this.limit ? Math.ceil((entry.resetAt - now) / 1000) : 0;
  }

  reset(key) {
    this.hits.delete(key);
  }
}
