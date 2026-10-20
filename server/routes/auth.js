/**
 * /api/auth: create an account, sign in, sign out, and "who am I?".
 */

import {
  RateLimiter,
  SESSION_COOKIE,
  SESSION_DAYS,
  createSession,
  deleteSession,
  hashPassword,
  publicUser,
  runDummyPasswordCheck,
  verifyPassword,
} from '../auth.js';
import { writeAudit } from '../db.js';
import { HttpError, clientIp, serializeCookie } from '../http-utils.js';
import { DEMO_USERS } from '../seed.js';
import { email, oneOf, passwordProblem, text, validate } from '../validation.js';

// At most 10 sign-in attempts per address every 15 minutes.
const loginLimiter = new RateLimiter({ limit: 10, windowMs: 15 * 60 * 1000 });

function startSession(ctx, userId) {
  const token = createSession(ctx.db, userId);
  ctx.setCookie(
    serializeCookie(SESSION_COOKIE, token, {
      maxAge: SESSION_DAYS * 24 * 60 * 60,
      secure: ctx.secureCookies,
    }),
  );
}

export function registerAuthRoutes(router) {
  router.get('/api/auth/me', (ctx) => ({ user: publicUser(ctx.user), demoMode: ctx.demoMode }));

  /** One-click sign-in for presentations. Turn off with DEMO_MODE=0. */
  router.post('/api/auth/demo', (ctx) => {
    if (!ctx.demoMode) throw new HttpError(404, 'Demo sign-in is turned off.');
    const { role } = validate(ctx.body, { role: oneOf({ label: 'Account', options: ['member', 'admin'] }) });
    const demo = DEMO_USERS.find((user) => user.role === role);
    const user = ctx.db.prepare(`SELECT id, name, email, role, title FROM users WHERE email = ?`).get(demo.email);
    if (!user) throw new HttpError(404, 'Demo accounts are missing. Run "npm run reset-db" to restore them.');

    startSession(ctx, user.id);
    return { user: publicUser(user) };
  });

  router.post('/api/auth/register', async (ctx) => {
    const values = validate(ctx.body, {
      name: text({ label: 'Name', min: 2, max: 80 }),
      email: email(),
      title: text({ label: 'Role or grade', required: false, max: 60 }),
    });

    const problem = passwordProblem(ctx.body.password, values);
    if (problem) {
      throw new HttpError(422, 'Please fix the highlighted fields.', { password: problem });
    }

    const existing = ctx.db.prepare(`SELECT id FROM users WHERE email = ?`).get(values.email);
    if (existing) {
      throw new HttpError(409, 'An account with that email already exists.', {
        email: 'An account with that email already exists. Try signing in instead.',
      });
    }

    const passwordHash = await hashPassword(ctx.body.password);
    const result = ctx.db
      .prepare(
        `INSERT INTO users (name, email, password_hash, role, title, created_at)
         VALUES (?, ?, ?, 'member', ?, ?)`,
      )
      .run(values.name, values.email, passwordHash, values.title || null, Date.now());

    const userId = Number(result.lastInsertRowid);
    writeAudit(ctx.db, { actorId: userId, action: 'created account', entity: 'user', entityId: userId });
    startSession(ctx, userId);

    ctx.status = 201;
    return { user: { id: userId, name: values.name, email: values.email, role: 'member', title: values.title || null } };
  });

  router.post('/api/auth/login', async (ctx) => {
    const waitSeconds = loginLimiter.check(clientIp(ctx.req));
    if (waitSeconds > 0) {
      throw new HttpError(429, `Too many sign-in attempts. Try again in ${Math.ceil(waitSeconds / 60)} minutes.`);
    }

    const values = validate(ctx.body, {
      email: email(),
      password: text({ label: 'Password', max: 256 }),
    });

    const user = ctx.db
      .prepare(`SELECT id, name, email, role, title, password_hash FROM users WHERE email = ?`)
      .get(values.email);

    // Use the raw password (not the trimmed one) for the check.
    const password = String(ctx.body.password);
    let valid = false;
    if (user) {
      valid = await verifyPassword(password, user.password_hash);
    } else {
      await runDummyPasswordCheck(password);
    }

    if (!valid) {
      throw new HttpError(401, 'That email and password combination is not correct.');
    }

    loginLimiter.reset(clientIp(ctx.req));
    startSession(ctx, user.id);
    return { user: publicUser(user) };
  });

  router.post('/api/auth/logout', (ctx) => {
    deleteSession(ctx.db, ctx.sessionToken);
    ctx.setCookie(serializeCookie(SESSION_COOKIE, '', { maxAge: 0, secure: ctx.secureCookies }));
    return { ok: true };
  });
}
