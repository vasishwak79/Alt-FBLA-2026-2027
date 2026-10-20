/**
 * Original line icons drawn for Commons on a 24 × 24 grid.
 *
 * Icons are decorative (hidden from screen readers) unless a `title` is
 * passed, in which case they are announced, e.g. on icon-only buttons.
 */

const ICONS = {
  search: ['M18 11a7 7 0 1 1-14 0a7 7 0 1 1 14 0z', 'M16.2 16.2L21 21'],
  calendar: ['M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z', 'M3 10h18', 'M8 3v4', 'M16 3v4'],
  clock: ['M21 12a9 9 0 1 1-18 0a9 9 0 1 1 18 0z', 'M12 7v5l3 2'],
  'map-pin': ['M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z', 'M14.5 9.5a2.5 2.5 0 1 1-5 0a2.5 2.5 0 1 1 5 0z'],
  user: ['M16 8a4 4 0 1 1-8 0a4 4 0 1 1 8 0z', 'M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5'],
  users: [
    'M13 8a3.5 3.5 0 1 1-7 0a3.5 3.5 0 1 1 7 0z',
    'M2.5 20c0-3.6 3-5.5 7-5.5s7 1.9 7 5.5',
    'M15.5 4.8a3.5 3.5 0 0 1 0 6.4',
    'M18 14.8c2.2.6 3.5 2.4 3.5 5.2',
  ],
  bell: ['M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z', 'M10 21h4'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  'check-circle': ['M21 12a9 9 0 1 1-18 0a9 9 0 1 1 18 0z', 'M8 12.5l2.7 2.7L16 10'],
  x: ['M6 6l12 12', 'M18 6L6 18'],
  'x-circle': ['M21 12a9 9 0 1 1-18 0a9 9 0 1 1 18 0z', 'M9 9l6 6', 'M15 9l-6 6'],
  alert: [
    'M10.3 4.2L2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0z',
    'M12 9v4.5',
    'M12 17.2v.1',
  ],
  info: ['M21 12a9 9 0 1 1-18 0a9 9 0 1 1 18 0z', 'M12 11v5.5', 'M12 7.8v.1'],
  'chevron-left': ['M15 5l-7 7l7 7'],
  'chevron-right': ['M9 5l7 7l-7 7'],
  'chevron-down': ['M5 9l7 7l7-7'],
  'arrow-right': ['M4 12h15', 'M13 6l6 6l-6 6'],
  'arrow-left': ['M20 12H5', 'M11 6l-6 6l6 6'],
  plus: ['M12 5v14', 'M5 12h14'],
  edit: ['M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z', 'M13.5 6.5l4 4'],
  trash: ['M4 7h16', 'M9 7V4.5h6V7', 'M6 7l1 13h10l1-13', 'M10 11v6', 'M14 11v6'],
  download: ['M12 4v11', 'M7 10.5l5 5l5-5', 'M4 20h16'],
  logout: ['M10 4H5v16h5', 'M14 8l4 4l-4 4', 'M8.5 12H18'],
  menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
  sun: [
    'M16 12a4 4 0 1 1-8 0a4 4 0 1 1 8 0z',
    'M12 2.5v2',
    'M12 19.5v2',
    'M4.6 4.6L6 6',
    'M18 18l1.4 1.4',
    'M2.5 12h2',
    'M19.5 12h2',
    'M4.6 19.4L6 18',
    'M18 6l1.4-1.4',
  ],
  moon: ['M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z'],
  monitor: ['M4 4h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z', 'M9 20h6', 'M12 16v4'],
  accessibility: [
    'M21.5 12a9.5 9.5 0 1 1-19 0a9.5 9.5 0 1 1 19 0z',
    'M13.3 7.2a1.3 1.3 0 1 1-2.6 0a1.3 1.3 0 1 1 2.6 0z',
    'M7 10l5 1l5-1',
    'M12 11v3.5',
    'M9.5 18l2.5-3.5l2.5 3.5',
  ],
  laptop: ['M5 5h14a1 1 0 0 1 1 1v9H4V6a1 1 0 0 1 1-1z', 'M2.5 15h19l-1 3.4a1 1 0 0 1-1 .6h-15a1 1 0 0 1-1-.6z'],
  camera: [
    'M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z',
    'M15.5 13a3.5 3.5 0 1 1-7 0a3.5 3.5 0 1 1 7 0z',
  ],
  door: ['M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17', 'M3.5 21h17', 'M14.5 12v.5'],
  flask: ['M9.5 3h5', 'M10.5 3v6L5 18.5A1.7 1.7 0 0 0 6.5 21h11a1.7 1.7 0 0 0 1.5-2.5L13.5 9V3', 'M7.5 15h9'],
  megaphone: ['M4 10v4a1 1 0 0 0 1 1h2l8 4V5L7 9H5a1 1 0 0 0-1 1z', 'M7 15l1 5h2.5l-1-4.2', 'M18.5 9.5a3 3 0 0 1 0 5'],
  wrench: ['M15 4a5 5 0 0 0-4.6 6.9L4 17.3a1.9 1.9 0 0 0 2.7 2.7l6.4-6.4A5 5 0 0 0 20 9l-3 1l-3-3l1-3z'],
  package: ['M12 3l8 4.5v9L12 21l-8-4.5v-9z', 'M4 7.5l8 4.5l8-4.5', 'M12 12v9'],
  message: ['M5 5h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-9l-5 4v-4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z'],
  speaker: ['M5 9h3l5-4v14l-5-4H5z', 'M16.5 9a4 4 0 0 1 0 6', 'M19 6.5a7.5 7.5 0 0 1 0 11'],
  home: ['M4 11l8-7l8 7', 'M6 9.5V20h12V9.5', 'M10 20v-5h4v5'],
  chart: ['M4 20h16', 'M7 16v-5', 'M12 16V7', 'M17 16v-8'],
  shield: ['M12 3l7 3v5.5c0 4.3-3 7.9-7 9.5c-4-1.6-7-5.2-7-9.5V6z', 'M9 12l2 2l4-4'],
  clipboard: [
    'M9 3.5h6v3H9z',
    'M9 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-3',
    'M9 12h6',
    'M9 16h4',
  ],
  external: ['M14 4h6v6', 'M20 4l-9 9', 'M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5'],
  book: [
    'M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5z',
    'M20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z',
  ],
  eye: ['M2.5 12S6 5.5 12 5.5S21.5 12 21.5 12S18 18.5 12 18.5S2.5 12 2.5 12z', 'M15 12a3 3 0 1 1-6 0a3 3 0 1 1 6 0z'],
  'eye-off': [
    'M2.5 12S6 5.5 12 5.5S21.5 12 21.5 12S18 18.5 12 18.5S2.5 12 2.5 12z',
    'M15 12a3 3 0 1 1-6 0a3 3 0 1 1 6 0z',
    'M4 4l16 16',
  ],
  grid: ['M4 4h6v6H4z', 'M14 4h6v6h-6z', 'M4 14h6v6H4z', 'M14 14h6v6h-6z'],
  list: ['M9 6h11', 'M9 12h11', 'M9 18h11', 'M4.5 6h.01', 'M4.5 12h.01', 'M4.5 18h.01'],
  tag: ['M3.5 12.5v-8a1 1 0 0 1 1-1h8l8 8a1 1 0 0 1 0 1.4l-7.6 7.6a1 1 0 0 1-1.4 0z', 'M8.5 8.5h.01'],
  inbox: ['M3 13l3-8h12l3 8v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z', 'M3 13h5l1.5 2.5h5L16 13h5'],
  sparkle: ['M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z'],
  sliders: ['M4 7h10', 'M18 7h2', 'M4 17h2', 'M10 17h10', 'M18 7a2 2 0 1 1-4 0a2 2 0 1 1 4 0z', 'M10 17a2 2 0 1 1-4 0a2 2 0 1 1 4 0z'],
  wifi: ['M2.5 9a14 14 0 0 1 19 0', 'M5.5 12.5a9.5 9.5 0 0 1 13 0', 'M8.8 16a5 5 0 0 1 6.4 0', 'M12 19.5h.01'],
  filter: ['M4 5h16l-6 7.5V19l-4 2v-8.5z'],
  send: ['M21 3L10 14', 'M21 3l-6.5 18l-4.5-7l-7-4.5z'],
  lock: ['M7 11h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z', 'M8.5 11V8a3.5 3.5 0 0 1 7 0v3'],
  mail: ['M5 6h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z', 'M4.5 7l7.5 6l7.5-6'],
  pin: ['M9 4h6l-1 6l3 3H7l3-3z', 'M12 13v7'],
  history: ['M3.5 12a8.5 8.5 0 1 0 2.5-6', 'M3.5 4v4h4', 'M12 8v4.5l3 1.5'],
  layers: ['M12 4l9 4.5l-9 4.5l-9-4.5z', 'M3 13l9 4.5l9-4.5'],
};

/** Which icon represents each resource and request category. */
export const CATEGORY_ICONS = {
  technology: 'laptop',
  media: 'camera',
  spaces: 'door',
  stem: 'flask',
  events: 'megaphone',
  it: 'wifi',
  facilities: 'wrench',
  av: 'speaker',
  supplies: 'package',
  other: 'message',
};

export function Icon({ name, title, size = 20, className = '' }) {
  const paths = ICONS[name] ?? ICONS.info;
  const accessibility = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true, focusable: 'false' };

  return (
    <svg
      className={`icon ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...accessibility}
    >
      {title ? <title>{title}</title> : null}
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
