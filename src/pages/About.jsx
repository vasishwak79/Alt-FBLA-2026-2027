import { Link } from 'react-router';

import { MAX_DAYS_AHEAD, ORGANIZATION_NAME } from '../../shared/constants.js';
import { PageHeader } from '../components/Feedback.jsx';
import { Icon } from '../components/Icon.jsx';
import { useDocumentTitle } from '../hooks/useCommon.js';

const BORROW_STEPS = [
  { icon: 'search', title: 'Find', text: 'Search or filter the catalog. Each card shows how many units are free right now.' },
  { icon: 'calendar', title: 'Reserve', text: 'Choose a time on the availability timeline. Commons checks for conflicts before you submit.' },
  { icon: 'shield', title: 'Approval (some items)', text: 'Special equipment, like cameras and the auditorium, is reviewed by staff, usually within one school day.' },
  { icon: 'package', title: 'Pick up & return', text: 'Staff check the item out to you and back in when you return it. Overdue items are flagged automatically.' },
];

const REQUEST_STEPS = [
  { icon: 'send', title: 'Report', text: 'Describe the problem, where it is, and how urgent it is.' },
  { icon: 'message', title: 'Talk it through', text: 'Staff reply on the request page, and you get a notification for every update.' },
  { icon: 'check-circle', title: 'Resolved', text: 'You can see exactly when your request was fixed and who handled it.' },
];

const ACCESSIBILITY_FEATURES = [
  ['Keyboard access', 'Every feature works without a mouse. A “Skip to main content” link appears on the first Tab press, and focus outlines are always visible.'],
  ['Screen reader support', 'Pages use real headings, landmarks, and labels. Live regions announce search results, availability checks, and messages. Focus moves to each new page’s heading.'],
  ['Color and contrast', 'Text meets WCAG 2.2 AA contrast (4.5:1). Status is shown with icons and words, never color alone. A high-contrast mode is one click away.'],
  ['Adjustable display', 'Choose light or dark mode, larger text, reduced motion, underlined links, or the Atkinson Hyperlegible reading font from the accessibility menu.'],
  ['Large touch targets', 'Every control meets the WCAG 2.2 minimum target size, and main buttons and time slots are 44 pixels or taller, so they are easy to tap on a phone.'],
  ['Accessible charts', 'Every chart has a text summary and a “Show data” button that turns it into a table.'],
];

const FAQS = [
  {
    question: 'Who can use Commons?',
    answer: `All ${ORGANIZATION_NAME} students and staff. Anyone can browse the catalog; you sign in to reserve or submit a request.`,
  },
  {
    question: 'How long can I borrow something?',
    answer: `Each resource lists its longest booking, from 2 hours for study rooms to 7 days for hotspots and calculators. You can reserve up to ${MAX_DAYS_AHEAD} days ahead.`,
  },
  {
    question: 'Why do some items need approval?',
    answer: 'Expensive or high-demand equipment (like cameras and VR headsets) and large spaces (like the auditorium) are reviewed by staff to make sure users are trained and events are planned.',
  },
  {
    question: 'What happens if I return something late?',
    answer: 'The item is marked overdue on your dashboard and in the staff console, and it stays unavailable to others until it is checked back in. Please return items on time so everyone gets a turn.',
  },
  {
    question: 'How do I report something that is broken?',
    answer: 'Open the item in the catalog and choose “Report a problem,” or go to Requests and select “New request.” You can follow the fix and reply to staff on the request page.',
  },
  {
    question: 'Can I use Commons on my phone?',
    answer: 'Yes. Commons is responsive and works on phones, tablets, and computers in any modern browser.',
  },
];

export default function About() {
  useDocumentTitle('About');

  return (
    <>
      <PageHeader
        eyebrow="About Commons"
        title="One place for everything we share"
        description={`Commons is the digital resource management system for ${ORGANIZATION_NAME}. It helps students and staff find, reserve, and return shared equipment and spaces, and get help when something needs fixing.`}
      />

      <div className="container prose-page">
        <section className="section--tight" aria-labelledby="problem-heading">
          <h2 id="problem-heading">The problem we set out to solve</h2>
          <div className="two-column">
            <p>
              Schools share hundreds of items: laptops, calculators, cameras, lab tools, rooms, and event supplies. They are
              often tracked with paper sign-out sheets, spreadsheets, and email threads. That makes it hard to know what is
              available, easy to double-book a room, and common for equipment to go missing.
            </p>
            <p>
              Requests for help have the same problem. A broken projector might be mentioned in a hallway, an email, and a
              sticky note, with no way to know whether anyone is working on it. Commons brings resources, reservations,
              requests, and announcements into one organized, searchable system.
            </p>
          </div>
        </section>

        <section className="section--tight" aria-labelledby="how-heading">
          <h2 id="how-heading">How borrowing works</h2>
          <ol className="flow">
            {BORROW_STEPS.map((step, index) => (
              <li key={step.title} className="flow__step">
                <span className="flow__icon" aria-hidden="true">
                  <Icon name={step.icon} size={24} />
                </span>
                <h3>
                  <span className="flow__number">{index + 1}.</span> {step.title}
                </h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>

          <h2>How service requests work</h2>
          <ol className="flow flow--three">
            {REQUEST_STEPS.map((step, index) => (
              <li key={step.title} className="flow__step">
                <span className="flow__icon flow__icon--accent" aria-hidden="true">
                  <Icon name={step.icon} size={24} />
                </span>
                <h3>
                  <span className="flow__number">{index + 1}.</span> {step.title}
                </h3>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="section--tight" aria-labelledby="roles-heading">
          <h2 id="roles-heading">Who uses Commons</h2>
          <div className="role-grid">
            <article className="card">
              <h3 className="card__title">
                <Icon name="user" size={20} /> Students
              </h3>
              <p>Borrow laptops, calculators, and creative gear for projects; book study rooms; report problems.</p>
            </article>
            <article className="card">
              <h3 className="card__title">
                <Icon name="book" size={20} /> Teachers &amp; advisers
              </h3>
              <p>Reserve class sets and lab equipment, book spaces for clubs and events, and request room setups.</p>
            </article>
            <article className="card">
              <h3 className="card__title">
                <Icon name="shield" size={20} /> Resource managers
              </h3>
              <p>Approve requests, check items in and out, manage inventory, post announcements, and review usage data.</p>
            </article>
          </div>
        </section>

        <section className="section--tight" id="accessibility" aria-labelledby="accessibility-heading">
          <h2 id="accessibility-heading">Accessibility statement</h2>
          <p>
            We designed Commons to meet the{' '}
            <Link to="/sources#wcag">Web Content Accessibility Guidelines (WCAG) 2.2, Level AA</Link> and followed the W3C
            ARIA Authoring Practices for interactive parts like tabs and dialogs. Open the accessibility menu (the{' '}
            <Icon name="accessibility" size={16} title="accessibility" /> button at the top of every page) to adjust the
            display.
          </p>
          <ul className="feature-list">
            {ACCESSIBILITY_FEATURES.map(([title, text]) => (
              <li key={title}>
                <Icon name="check-circle" size={20} className="feature-list__icon" />
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="section--tight" aria-labelledby="tech-heading">
          <h2 id="tech-heading">How Commons is built</h2>
          <p>
            Commons is a full-stack web application written from scratch by our team. No website templates or UI kits were
            used.
          </p>
          <div className="architecture" role="img" aria-label="Diagram: the React app in the browser sends requests to the Node.js API server, which reads and writes the SQLite database.">
            <div className="architecture__box">
              <Icon name="monitor" size={28} />
              <strong>React app</strong>
              <span>Pages, forms, charts, and accessibility settings in the browser</span>
            </div>
            <div className="architecture__arrow" aria-hidden="true">
              <span>JSON over HTTP</span>
              <Icon name="arrow-right" size={24} />
            </div>
            <div className="architecture__box">
              <Icon name="layers" size={28} />
              <strong>Node.js API</strong>
              <span>Routing, sign-in, validation, booking rules, and security headers</span>
            </div>
            <div className="architecture__arrow" aria-hidden="true">
              <span>SQL</span>
              <Icon name="arrow-right" size={24} />
            </div>
            <div className="architecture__box">
              <Icon name="package" size={28} />
              <strong>SQLite database</strong>
              <span>Users, resources, reservations, requests, and the activity log</span>
            </div>
          </div>
          <ul className="tech-list">
            <li>
              <strong>Conflict-free booking:</strong> a sweep-line algorithm finds the busiest moment in any time window, so
              items with many units (like 24 laptops) can never be overbooked.
            </li>
            <li>
              <strong>Secure accounts:</strong> passwords are hashed with scrypt, sessions use HttpOnly cookies, sign-in
              attempts are rate-limited, and every database query uses parameters to prevent SQL injection.
            </li>
            <li>
              <strong>One set of rules:</strong> the same server code checks a reservation while you type and again when
              you submit, so the preview always matches the result.
            </li>
            <li>
              <strong>Tested:</strong> automated tests cover the booking algorithm, permissions, and the full reservation
              lifecycle.
            </li>
          </ul>
        </section>

        <section className="section--tight" id="faq" aria-labelledby="faq-heading">
          <h2 id="faq-heading">Frequently asked questions</h2>
          <div className="faq">
            {FAQS.map((item) => (
              <details key={item.question} className="faq__item">
                <summary className="faq__question">
                  {item.question}
                  <Icon name="chevron-down" size={20} className="faq__chevron" />
                </summary>
                <p className="faq__answer">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
