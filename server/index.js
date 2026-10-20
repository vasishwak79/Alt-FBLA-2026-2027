/**
 * Starts the Commons server.
 *
 *   npm run demo   builds the React app, then serves it with the API
 *   npm run dev    runs this server alongside the Vite dev server
 *
 * The server listens on every network interface, so phones and tablets on
 * the same Wi-Fi (or a laptop hotspot) can open the printed address.
 */

import { networkInterfaces } from 'node:os';
import path from 'node:path';

import { createApp } from './app.js';
import { DEFAULT_DB_FILE, openDatabase } from './db.js';
import { isEmpty, seedDatabase } from './seed.js';

const PORT = Number(process.env.PORT) || 3000;
const DB_FILE = process.env.DB_FILE || DEFAULT_DB_FILE;
const STATIC_DIR = path.resolve(import.meta.dirname, '..', 'dist');

const db = openDatabase(DB_FILE);
if (isEmpty(db)) {
  console.log('First run: adding demo data (this takes a few seconds)…');
  const summary = await seedDatabase(db);
  console.log(`Added ${summary.resources} resources, ${summary.reservations} reservations, and ${summary.requests} requests.`);
}

const server = createApp({
  db,
  staticDir: STATIC_DIR,
  secureCookies: process.env.SECURE_COOKIES === '1',
  logRequests: process.env.LOG_REQUESTS !== '0',
  demoMode: process.env.DEMO_MODE !== '0',
});

/** Addresses other devices on the same network can use. */
function lanAddresses() {
  return Object.values(networkInterfaces())
    .flat()
    .filter((address) => address && address.family === 'IPv4' && !address.internal)
    .map((address) => address.address);
}

server.listen(PORT, '0.0.0.0', () => {
  console.log('\nCommons is running:');
  console.log(`  This computer:   http://localhost:${PORT}`);
  for (const address of lanAddresses()) {
    console.log(`  Phone or tablet: http://${address}:${PORT}`);
  }
  console.log('');
});

function shutDown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
  // Do not wait forever on open connections.
  setTimeout(() => process.exit(0), 2000).unref();
}

process.on('SIGINT', shutDown);
process.on('SIGTERM', shutDown);
