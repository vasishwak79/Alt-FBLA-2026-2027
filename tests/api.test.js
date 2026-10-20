/**
 * End-to-end tests for the API. Each run starts a real server on a random
 * port with a fresh in-memory database, then makes HTTP requests to it.
 */

import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import { createApp } from '../server/app.js';
import { openDatabase } from '../server/db.js';
import { DEMO_PASSWORD, DEMO_USERS, seedDatabase } from '../server/seed.js';

const HOUR = 60 * 60 * 1000;
let server;
let baseUrl;

before(async () => {
  const db = openDatabase(':memory:');
  await seedDatabase(db);
  server = createApp({ db, logRequests: false });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
});

/** Makes a request and returns { status, body, cookie }. */
async function call(path, { method = 'GET', body, cookie, headers = {} } = {}) {
  const response = await fetch(baseUrl + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = response.headers.get('set-cookie');
  const type = response.headers.get('content-type') ?? '';
  return {
    status: response.status,
    body: type.includes('json') ? await response.json() : await response.text(),
    cookie: setCookie ? setCookie.split(';')[0] : null,
  };
}

async function signIn(key) {
  const user = DEMO_USERS.find((demo) => demo.key === key);
  const result = await call('/api/auth/login', { method: 'POST', body: { email: user.email, password: DEMO_PASSWORD } });
  assert.equal(result.status, 200);
  return result.cookie;
}

/** A start time tomorrow at the given hour (local time). */
function tomorrowAt(hour) {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hour, 0, 0, 0);
  return date.getTime();
}

describe('catalog', () => {
  it('lists resources with live availability', async () => {
    const { status, body } = await call('/api/resources');
    assert.equal(status, 200);
    assert.ok(body.resources.length >= 25);
    assert.ok(body.resources.every((resource) => typeof resource.availableNow === 'number'));
  });

  it('filters by search text', async () => {
    const { body } = await call('/api/resources?q=camera');
    assert.ok(body.resources.length > 0);
    assert.ok(body.resources.every((resource) => /camera/i.test(resource.name + resource.description + resource.tags)));
  });
});

describe('authentication', () => {
  it('rejects a wrong password', async () => {
    const { status } = await call('/api/auth/login', {
      method: 'POST',
      body: { email: DEMO_USERS[2].email, password: 'not-the-right-password' },
    });
    assert.equal(status, 401);
  });

  it('requires a long password when registering', async () => {
    const { status, body } = await call('/api/auth/register', {
      method: 'POST',
      body: { name: 'Test Person', email: 'test.person@lakeside.example', password: 'short' },
    });
    assert.equal(status, 422);
    assert.ok(body.fields.password);
  });

  it('creates an account and signs in', async () => {
    const { status, body, cookie } = await call('/api/auth/register', {
      method: 'POST',
      body: { name: 'New Student', email: 'new.student@lakeside.example', password: 'purple otter reads at noon' },
    });
    assert.equal(status, 201);
    assert.equal(body.user.role, 'member');

    const me = await call('/api/auth/me', { cookie });
    assert.equal(me.body.user.email, 'new.student@lakeside.example');
  });
});

describe('permissions', () => {
  it('blocks members from staff-only routes', async () => {
    const cookie = await signIn('avery');
    const { status } = await call('/api/admin/overview', { cookie });
    assert.equal(status, 403);
  });

  it('blocks changes sent from another website', async () => {
    const cookie = await signIn('avery');
    const { status } = await call('/api/notifications/read-all', {
      method: 'POST',
      cookie,
      headers: { Origin: 'https://evil.example' },
    });
    assert.equal(status, 403);
  });
});

describe('reservations', () => {
  let resourceId;
  let adminCookie;
  let memberCookie;

  before(async () => {
    adminCookie = await signIn('jordan');
    memberCookie = await signIn('avery');
    const { status, body } = await call('/api/resources', {
      method: 'POST',
      cookie: adminCookie,
      body: {
        name: 'Test Camera Set',
        category: 'media',
        location: 'Test Lab',
        quantity: 2,
        maxHours: 4,
        requiresApproval: false,
      },
    });
    assert.equal(status, 201);
    resourceId = body.resource.id;
  });

  const reserve = (startHour, endHour, quantity = 1) =>
    call('/api/reservations', {
      method: 'POST',
      cookie: memberCookie,
      body: { resourceId, start: tomorrowAt(startHour), end: tomorrowAt(endHour), quantity, purpose: 'Testing bookings' },
    });

  it('confirms a booking when units are free', async () => {
    const { status, body } = await reserve(9, 11, 2);
    assert.equal(status, 201);
    assert.equal(body.reservation.status, 'approved');
  });

  it('prevents double-booking the same units', async () => {
    const { status, body } = await reserve(10, 12, 1);
    assert.equal(status, 409);
    assert.match(body.error, /fully booked/i);
  });

  it('allows a booking that starts exactly when another ends', async () => {
    const { status } = await reserve(11, 12, 2);
    assert.equal(status, 201);
  });

  it('enforces the maximum loan length', async () => {
    const { status, body } = await reserve(13, 18, 1);
    assert.equal(status, 409);
    assert.match(body.error, /up to 4 hours/);
  });

  it('lets staff move a booking through check-out and return', async () => {
    const { body } = await reserve(14, 15, 1);
    const id = body.reservation.id;

    const checkout = await call(`/api/admin/reservations/${id}/checkout`, { method: 'POST', cookie: adminCookie, body: {} });
    assert.equal(checkout.body.reservation.status, 'checked_out');

    const returned = await call(`/api/admin/reservations/${id}/return`, { method: 'POST', cookie: adminCookie, body: {} });
    assert.equal(returned.body.reservation.status, 'returned');

    const again = await call(`/api/admin/reservations/${id}/approve`, { method: 'POST', cookie: adminCookie, body: {} });
    assert.equal(again.status, 409);
  });
});

describe('service requests', () => {
  it('lets a member submit a request and staff resolve it', async () => {
    const memberCookie = await signIn('sofia');
    const created = await call('/api/requests', {
      method: 'POST',
      cookie: memberCookie,
      body: { category: 'facilities', title: 'Leaky faucet in Room 101', description: 'The sink faucet drips constantly.', location: 'Room 101' },
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.request.status, 'open');

    const adminCookie = await signIn('dana');
    const updated = await call(`/api/requests/${created.body.request.id}`, {
      method: 'PATCH',
      cookie: adminCookie,
      body: { status: 'resolved' },
    });
    assert.equal(updated.body.request.status, 'resolved');
    assert.ok(updated.body.request.resolvedAt);
  });

  it('hides other members’ requests', async () => {
    const cookie = await signIn('marcus');
    const { status } = await call('/api/requests/1', { cookie });
    assert.equal(status, 404);
  });
});
