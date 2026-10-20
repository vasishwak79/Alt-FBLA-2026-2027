/**
 * Original illustrations for each resource category, drawn with basic SVG
 * shapes. Colors come from CSS classes (see styles/art.css), so every
 * illustration adapts automatically to dark mode and high contrast.
 */

function Technology() {
  return (
    <>
      <rect className="art-main" x="56" y="34" width="88" height="58" rx="7" />
      <rect className="art-paper" x="63" y="41" width="74" height="44" rx="3" />
      <rect className="art-soft" x="70" y="49" width="34" height="5" rx="2.5" />
      <rect className="art-soft" x="70" y="59" width="54" height="5" rx="2.5" />
      <rect className="art-accent" x="70" y="69" width="20" height="10" rx="2" />
      <rect className="art-soft" x="95" y="69" width="29" height="10" rx="2" />
      <path className="art-main-dark" d="M44 92h112l-7 11a4 4 0 0 1-3.4 2H54.4a4 4 0 0 1-3.4-2z" />
      <rect className="art-paper" x="88" y="95" width="24" height="4" rx="2" />
    </>
  );
}

function Media() {
  return (
    <>
      <rect className="art-main-dark" x="84" y="34" width="32" height="12" rx="4" />
      <rect className="art-main" x="50" y="42" width="100" height="62" rx="10" />
      <circle className="art-paper" cx="100" cy="73" r="23" />
      <circle className="art-main-dark" cx="100" cy="73" r="16" />
      <circle className="art-soft" cx="100" cy="73" r="8" />
      <circle className="art-paper" cx="95" cy="68" r="3" />
      <rect className="art-accent" x="129" y="50" width="12" height="7" rx="2" />
      <circle className="art-paper" cx="62" cy="53" r="3.5" />
    </>
  );
}

function Spaces() {
  return (
    <>
      <rect className="art-paper" x="40" y="30" width="120" height="78" rx="4" />
      <rect className="art-soft" x="52" y="42" width="34" height="26" rx="2" />
      <path className="art-line" d="M69 42v26M52 55h34" />
      <rect className="art-main" x="104" y="40" width="40" height="68" rx="3" />
      <rect className="art-main-dark" x="110" y="47" width="28" height="22" rx="2" />
      <rect className="art-main-dark" x="110" y="76" width="28" height="24" rx="2" />
      <circle className="art-accent" cx="134" cy="74" r="3.5" />
      <rect className="art-main-dark" x="52" y="80" width="38" height="5" rx="2.5" />
      <rect className="art-main-dark" x="56" y="85" width="4" height="23" />
      <rect className="art-main-dark" x="82" y="85" width="4" height="23" />
      <path className="art-ground" d="M30 108h140" />
    </>
  );
}

function Stem() {
  return (
    <>
      <ellipse className="art-orbit" cx="134" cy="52" rx="24" ry="9" />
      <ellipse className="art-orbit" cx="134" cy="52" rx="24" ry="9" transform="rotate(60 134 52)" />
      <ellipse className="art-orbit" cx="134" cy="52" rx="24" ry="9" transform="rotate(120 134 52)" />
      <circle className="art-accent" cx="134" cy="52" r="5" />
      <path className="art-paper" d="M74 30h28v6h-3v22l22 36a6 6 0 0 1-5.1 9H60.1a6 6 0 0 1-5.1-9l22-36V36h-3z" />
      <path className="art-main" d="M65.5 76h45l9 15a6 6 0 0 1-5.1 9H61.6a6 6 0 0 1-5.1-9z" />
      <circle className="art-soft" cx="80" cy="88" r="4" />
      <circle className="art-soft" cx="95" cy="83" r="3" />
      <circle className="art-soft" cx="90" cy="65" r="3" />
      <path className="art-line" d="M74 30h28v6h-3v22l22 36a6 6 0 0 1-5.1 9H60.1a6 6 0 0 1-5.1-9l22-36V36h-3z" />
    </>
  );
}

function Events() {
  return (
    <>
      <path className="art-line" d="M30 34q70 22 140 0" />
      <path className="art-main" d="M44 38l8 14l6-12z" />
      <path className="art-accent" d="M70 44l7 14l7-12z" />
      <path className="art-main" d="M96 47l7 14l7-14z" />
      <path className="art-accent" d="M122 44l7 12l7-14z" />
      <path className="art-main" d="M148 38l4 12l8-14z" />
      <path className="art-main" d="M56 76l44-16l44 16z" />
      <path className="art-main-dark" d="M56 76h88v6a5 5 0 0 1-10 0a5 5 0 0 1-10 0a5 5 0 0 1-10 0a5 5 0 0 1-10 0a5 5 0 0 1-10 0a5 5 0 0 1-10 0a5 5 0 0 1-10 0a5 5 0 0 1-8 0z" />
      <rect className="art-main-dark" x="60" y="82" width="4" height="26" />
      <rect className="art-main-dark" x="136" y="82" width="4" height="26" />
      <rect className="art-paper" x="76" y="92" width="48" height="16" rx="2" />
      <rect className="art-soft" x="82" y="97" width="16" height="6" rx="2" />
      <rect className="art-accent" x="102" y="97" width="16" height="6" rx="2" />
      <path className="art-ground" d="M30 108h140" />
    </>
  );
}

const SCENES = {
  technology: Technology,
  media: Media,
  spaces: Spaces,
  stem: Stem,
  events: Events,
};

export function CategoryArt({ category, className = '' }) {
  const Scene = SCENES[category] ?? Technology;
  return (
    <svg
      className={`art art--${category} ${className}`.trim()}
      viewBox="0 0 200 130"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <rect className="art-bg" width="200" height="130" />
      <circle className="art-blob" cx="172" cy="18" r="42" />
      <circle className="art-blob" cx="20" cy="124" r="32" />
      <Scene />
    </svg>
  );
}
