# Commons — Digital Resource Management

**FBLA Website Coding & Development, 2026–2027**
Topic: *Digital Resource Management Website*

Commons is a full-stack website that helps a school (the fictional Lakeside High School) manage everything it shares:

| Topic keyword | How Commons handles it |
| --- | --- |
| **Shared resources** | A searchable catalog of 30 items and spaces with live availability |
| **Requests** | Reservations with conflict checking and a staff approval queue |
| **Services** | Service requests (repairs, tech help, supplies) with status tracking and a conversation thread |
| **Information** | Announcements, notifications, analytics, an activity log, and CSV export |

---

## Quick start

Requires **Node.js 22.13 or newer** (built with Node 24). No database server is needed.

```bash
npm install
npm run demo
```

Then open **http://localhost:3000**. The first run creates `data/commons.db` and fills it with demo data (this takes a few seconds while passwords are hashed).

The server also prints a **"Phone or tablet"** address. Any device on the same Wi-Fi (or a laptop hotspot) can open it, which is handy for showing the site on several devices during the presentation.

### Demo accounts

On the sign-in page, the **"Exploring the demo?"** box signs you in with one click:

- **Student (Avery Chen)**: reservations, requests, notifications
- **Staff (Jordan Rivera)**: the staff console

All demo accounts share the password stored in `DEMO_PASSWORD` in [`server/seed.js`](server/seed.js), and their emails are listed in `DEMO_USERS` in the same file. To turn off one-click demo sign-in, start the server with `DEMO_MODE=0`.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run demo` | Builds the React app and starts the server on port 3000 |
| `npm run dev` | Development mode: API on port 3000 plus Vite with hot reload on port 5173 |
| `npm run build` | Builds the React app into `dist/` |
| `npm start` | Starts the server (serves `dist/` and the API) |
| `npm test` | Runs the automated tests (Node's built-in test runner) |
| `npm run reset-db` | Deletes the database and re-creates fresh demo data |

> **Before presenting:** run `npm run reset-db` so the demo starts with clean data. Dates are generated relative to "today," so there are always items due today, overdue returns, and pending approvals to show.

---

## How it is built

```
Browser (React 19 + React Router)  ──JSON──▶  Node.js API (no framework)  ──SQL──▶  SQLite (node:sqlite)
```

```
commons/
├── index.html              Vite entry page
├── public/                 Favicon and the theme pre-loader script
├── shared/constants.js     Categories, statuses, and limits used by BOTH server and browser
├── server/
│   ├── index.js            Starts the server and prints network addresses
│   ├── app.js              HTTP server, security headers, static files, API dispatch
│   ├── router.js           Our own URL router (e.g. /api/resources/:id)
│   ├── db.js               Database schema, transactions, audit log, notifications
│   ├── auth.js             scrypt password hashing, sessions, rate limiting
│   ├── validation.js       Input validation and NIST-style password rules
│   ├── scheduling.js       Sweep-line availability algorithm (pure functions)
│   ├── booking.js          Booking rules shared by every reservation route
│   ├── seed.js             Fictional demo data, generated relative to today
│   └── routes/             auth, resources, reservations, requests, community, stats
├── src/
│   ├── main.jsx, App.jsx   App entry and page routes
│   ├── api/client.js       fetch() wrapper with friendly errors
│   ├── context/            Auth, display preferences, and toast messages
│   ├── hooks/              useApi, useDebouncedValue, useDismiss, …
│   ├── components/         Layout, header, forms, dialogs, timeline, charts, SVG art
│   ├── pages/              Home, Catalog, ResourceDetail, Dashboard, Requests, Admin, About, Sources, …
│   ├── styles/             tokens, base, layout, components, art, pages, admin
│   └── utils/dates.js      Date and time formatting
└── tests/                  Unit tests (scheduling) and API tests (full server)
```

### Technical highlights (good talking points)

- **No back-end framework.** The server uses only Node's built-in `http`, `crypto`, and `sqlite` modules. We wrote our own router, cookie handling, body parsing, and static file server.
- **Conflict-free booking.** `server/scheduling.js` uses a *sweep-line algorithm*: every booking becomes a "+units" event at its start and a "−units" event at its end; sorting the events and keeping a running total finds the busiest moment. That is how 24 laptops can be shared without ever being overbooked, while back-to-back bookings (10–11 and 11–12) are allowed.
- **One source of truth.** The live "Is this time free?" check on the form and the final "Reserve" button call the same `checkReservation()` function, so the preview always matches the result.
- **Race-safe.** The availability check and the insert run inside one database transaction.
- **State machine.** Reservations move `pending → approved → checked_out → returned` (or `denied` / `cancelled`). Each staff action lists which states it is allowed from (`STAFF_ACTIONS` in `routes/reservations.js`).
- **Overdue logic.** An item that is not returned stays unavailable until staff check it back in.
- **Security.** scrypt password hashing (OWASP settings), HttpOnly session cookies with only a SHA-256 of the token stored, login rate limiting, timing-safe comparisons, a same-origin (CSRF) check, prepared SQL statements, CSV formula-injection protection, and a strict Content-Security-Policy.
- **Accessibility.** Skip link, focus moved to each page's `<h1>` on navigation, ARIA tabs with arrow-key support, native `<dialog>` modals, live regions, labelled forms that focus the first error, status shown with icons and text (not color alone), charts with "Show data" tables, plus a settings panel for theme, text size, high contrast, reduced motion, an easy-reading font, and underlined links.
- **Responsive.** Mobile-first CSS grid and flexbox; data tables turn into stacked cards on phones.
- **Original graphics.** Every icon, illustration, the logo, and the charts are hand-coded SVG that recolor automatically in dark and high-contrast modes.

---

## Rating sheet checklist

| Rating sheet item | Where to show it |
| --- | --- |
| Coding style (separate files, spacing) | `src/styles/*` (7 stylesheets), `src/components`, `server/` modules, `.editorconfig` |
| Usability, accessibility, navigation | Accessibility menu (header), skip link (press Tab on load), keyboard-only booking, About → Accessibility statement |
| Color, contrast, fonts | `src/styles/tokens.css` (light, dark, high-contrast palettes) |
| Graphics | Home illustration, category art, empty states, charts (`src/components/art`) |
| Fully addresses the topic | Home page "Why Commons?" + About page |
| Multiple coding skills | Timeline + live availability check, staff console, sweep-line algorithm, tests |
| Grammar and spelling | All copy lives in the page components and `server/seed.js` |
| Cites sources | `/sources` page (APA 7), source links on the home page facts |
| Works on multiple platforms | Phone/tablet address printed by the server; responsive layouts |
| Interactivity is error-free | `npm test` (24 automated tests) |
| Consistent pages | Shared `Layout`, `PageHeader`, and design tokens |
| Source code and documentation | This README, `/sources`, comments throughout the code |

## Backup plan (no internet)

Everything runs locally: the server, database, and app need no internet connection. If Google Fonts cannot load, the site automatically falls back to system fonts. Bring the laptop charged (no outlets at preliminaries) and run `npm run demo` before the set-up time.

## Credits

All code, styles, and graphics were written for this project. Open-source tools (React, React Router, Vite, Node.js, SQLite) and fonts (Atkinson Hyperlegible, Plus Jakarta Sans) are credited with their licenses on the site's **Sources & credits** page. Lakeside High School, its people, and all data are fictional.
