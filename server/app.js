/**
 * Builds the HTTP server: the JSON API under /api and the compiled React
 * app (from the dist folder) for every other URL.
 */

import http from 'node:http';
import { existsSync, readFileSync, statSync, createReadStream } from 'node:fs';
import path from 'node:path';

import { SESSION_COOKIE, deleteExpiredSessions, findSessionUser } from './auth.js';
import { HttpError, parseCookies, readJsonBody, sendJson } from './http-utils.js';
import { Router } from './router.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerCommunityRoutes } from './routes/community.js';
import { registerRequestRoutes } from './routes/requests.js';
import { registerReservationRoutes } from './routes/reservations.js';
import { registerResourceRoutes } from './routes/resources.js';
import { registerStatsRoutes } from './routes/stats.js';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

/*
 * Security headers sent with every response. The Content Security Policy
 * only allows scripts from this site, which blocks most cross-site
 * scripting attacks even if a bug slipped through.
 */
const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function buildRouter() {
  const router = new Router();
  registerAuthRoutes(router);
  registerResourceRoutes(router);
  registerReservationRoutes(router);
  registerRequestRoutes(router);
  registerCommunityRoutes(router);
  registerStatsRoutes(router);
  return router;
}

/**
 * Blocks cross-site form posts (CSRF): a request that changes data must come
 * from a page on this same site.
 */
function assertSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return;
  try {
    if (new URL(origin).host === req.headers.host) return;
  } catch {
    // Fall through to the error below.
  }
  throw new HttpError(403, 'Requests from other websites are not allowed.');
}

export function createApp({ db, staticDir = null, secureCookies = false, logRequests = true, demoMode = true }) {
  const router = buildRouter();
  const indexFile = staticDir ? path.join(staticDir, 'index.html') : null;

  // Remove expired sessions once an hour.
  const cleanup = setInterval(() => deleteExpiredSessions(db), 60 * 60 * 1000);
  cleanup.unref();

  async function handleApi(req, res, url) {
    const match = router.match(req.method, url.pathname);
    if (!match) throw new HttpError(404, 'That API route does not exist.');
    if (match.allowed) {
      res.setHeader('Allow', match.allowed.join(', '));
      throw new HttpError(405, 'That method is not allowed here.');
    }

    if (BODY_METHODS.has(req.method)) assertSameOrigin(req);

    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE] ?? null;
    const user = findSessionUser(db, token);
    const body = BODY_METHODS.has(req.method) ? await readJsonBody(req) : {};
    const cookiesToSet = [];

    const ctx = {
      req,
      res,
      db,
      params: match.params,
      query: url.searchParams,
      body,
      user,
      sessionToken: token,
      secureCookies,
      demoMode,
      status: 200,
      setCookie: (cookie) => cookiesToSet.push(cookie),
      requireUser() {
        if (!user) throw new HttpError(401, 'Please sign in to continue.');
        return user;
      },
      requireAdmin() {
        if (!user) throw new HttpError(401, 'Please sign in to continue.');
        if (user.role !== 'admin') throw new HttpError(403, 'Only staff members can do that.');
        return user;
      },
    };

    const result = await match.handler(ctx);
    if (res.writableEnded) return; // The handler already sent its own response (e.g. CSV).

    const headers = cookiesToSet.length > 0 ? { 'Set-Cookie': cookiesToSet } : {};
    sendJson(res, ctx.status, result ?? { ok: true }, headers);
  }

  function serveStatic(req, res, url) {
    if (!indexFile || !existsSync(indexFile)) {
      res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('The front end has not been built yet. Run "npm run demo" (or "npm run dev" while developing).');
      return;
    }

    let filePath;
    try {
      filePath = path.normalize(path.join(staticDir, decodeURIComponent(url.pathname)));
    } catch {
      filePath = indexFile;
    }

    // Never serve files outside the build folder (blocks "../" tricks).
    const insideBuild = filePath.startsWith(staticDir + path.sep);
    const isFile = insideBuild && existsSync(filePath) && statSync(filePath).isFile();

    if (!isFile) {
      if (path.extname(url.pathname)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }
      // Any other page URL is handled by React Router in the browser.
      res.writeHead(200, { 'Content-Type': MIME_TYPES['.html'], 'Cache-Control': 'no-cache' });
      res.end(readFileSync(indexFile));
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const isHashedAsset = url.pathname.startsWith('/assets/');
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[extension] ?? 'application/octet-stream',
      'Cache-Control': isHashedAsset ? 'public, max-age=31536000, immutable' : 'no-cache',
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    createReadStream(filePath).pipe(res);
  }

  return http.createServer(async (req, res) => {
    const startedAt = Date.now();
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      res.setHeader(name, value);
    }

    const url = new URL(req.url, 'http://localhost');
    const isApi = url.pathname.startsWith('/api/');

    try {
      if (isApi) {
        await handleApi(req, res, url);
      } else if (req.method === 'GET' || req.method === 'HEAD') {
        serveStatic(req, res, url);
      } else {
        throw new HttpError(405, 'That method is not allowed here.');
      }
    } catch (error) {
      if (error instanceof HttpError) {
        if (!res.headersSent) {
          sendJson(res, error.status, { error: error.message, fields: error.fields ?? undefined });
        }
      } else {
        console.error(error);
        if (!res.headersSent) {
          sendJson(res, 500, { error: 'Something went wrong on our side. Please try again.' });
        }
      }
    }

    if (logRequests && isApi) {
      console.log(`${req.method} ${url.pathname} ${res.statusCode} ${Date.now() - startedAt}ms`);
    }
  });
}
