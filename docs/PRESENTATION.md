# Presentation Plan (7 minutes + 3 minutes Q&A)

Split the speaking parts evenly; every team member must present. Rehearse with a timer, because judges give a one-minute warning and stop you at 7:00.

## Before you walk in

- [ ] `npm run reset-db`, then `npm run demo`, and keep the terminal open.
- [ ] Open these tabs in order: Home, Catalog, a resource page, Sign in, Staff console, About → Accessibility, Sources.
- [ ] Phone or tablet connected to the laptop's hotspot, showing the "Phone or tablet" address.
- [ ] Laptop fully charged (no power at preliminaries). Screen brightness up, notifications off.
- [ ] Code editor open to `server/scheduling.js` and `src/pages/admin` in case judges ask to see source code.

## Suggested flow

| Time | Who | What to show | Rating sheet items |
| --- | --- | --- | --- |
| 0:00–0:45 | Member 1 | **The problem.** Paper sign-out sheets, double-booked rooms, lost equipment, ignored repair requests. Point to the "Why Commons?" research facts and their sources. | Topic, sources |
| 0:45–2:15 | Member 1 | **Find and reserve (student view).** Search "camera," filter by category, open a resource. Click a time slot on the timeline, show the live availability check, then try a time that is full to show the conflict message. Reserve and show the confirmation and toast. | Interactivity, usability |
| 2:15–3:00 | Member 2 | **Phone view.** Pick up the phone and show the same page. Then show the dashboard (upcoming, checked out, overdue alert) and the notification bell. | Multiple platforms |
| 3:00–4:30 | Member 2 | **Staff console.** Sign in as staff with the demo button. Overview charts, then approve one request and deny one with a reason. Check an item in. Move a service request on the board. Export the CSV. | Coding skills, interactivity |
| 4:30–5:30 | Member 3 | **Accessibility.** Open the accessibility menu: dark mode, larger text, high contrast. Press Tab on a fresh page to show the skip link and focus outlines. Mention screen-reader support and color-independent status badges. | Accessibility, design |
| 5:30–6:30 | Member 3 | **Under the hood.** About page architecture diagram. Explain the sweep-line algorithm, scrypt password hashing, and the strict security policy. Mention 24 automated tests. | Code structure, source code |
| 6:30–7:00 | Everyone | **Wrap up.** Sources page (original graphics, no templates, licenses). One-sentence impact statement. | Documentation |

## Likely judge questions

**Why did you build your own server instead of using a framework?**
To show we understand what a framework does: routing, cookies, request bodies, and security headers are all in `server/app.js`, `router.js`, and `http-utils.js`. It also means fewer dependencies to break on competition day.

**How do you prevent double-booking?**
`server/scheduling.js` turns each booking into start and end events, sorts them, and keeps a running total to find the busiest moment in the requested window. If the busiest moment plus the new request exceeds the number of units, the server rejects it. The check and the insert happen in one transaction.

**How are passwords stored?**
Never in plain text. We use scrypt with a random salt per user, following OWASP's recommended settings. Sessions are random 256-bit tokens in an HttpOnly cookie, and the database only stores a SHA-256 hash of each token.

**What makes the site accessible?**
WCAG 2.2 AA contrast, full keyboard support, a skip link, focus moved to each page's heading, labelled forms that focus the first error, ARIA tabs and native dialogs, status shown with icons and words (not color alone), charts with data tables, and a settings panel for theme, text size, high contrast, motion, font, and link underlines.

**How would a real school use this?**
Replace the fictional data with the school's inventory (staff can add items in the Inventory tab), connect sign-in to the school's accounts, and host it on a school server. The CSV export and activity log support audits.

**What would you add next?**
Email or text reminders before items are due, barcode scanning at check-out, recurring bookings for classes, and single sign-on with school accounts.

**What was the hardest part?**
Be ready to give a real answer from your own experience building and testing the project.
