/**
 * Home page illustration: a shared shelf of "cubbies" holding items from
 * each category, surrounded by the three things Commons manages: a
 * confirmed reservation, a service request, and live availability.
 */
export function HeroArt() {
  return (
    <svg className="hero-art" viewBox="0 0 520 440" aria-hidden="true" focusable="false">
      {/* Backdrop */}
      <circle className="hero-blob" cx="265" cy="220" r="200" />
      <circle className="hero-blob-accent" cx="70" cy="110" r="46" />

      {/* Shelf with six cubbies */}
      <rect className="hero-shelf" x="150" y="70" width="230" height="300" rx="16" />
      <path className="hero-shelf-line" d="M150 170h230M150 270h230M265 70v300" />
      <rect className="hero-shelf-foot" x="168" y="370" width="16" height="14" rx="3" />
      <rect className="hero-shelf-foot" x="346" y="370" width="16" height="14" rx="3" />

      {/* Laptop */}
      <g className="art--technology">
        <rect className="art-main" x="180" y="100" width="54" height="34" rx="4" />
        <rect className="art-paper" x="184" y="104" width="46" height="26" rx="2" />
        <rect className="art-soft" x="189" y="109" width="22" height="4" rx="2" />
        <rect className="art-accent" x="189" y="117" width="12" height="8" rx="1.5" />
        <path className="art-main-dark" d="M172 134h70l-5 7h-60z" />
      </g>

      {/* Camera */}
      <g className="art--media">
        <rect className="art-main-dark" x="311" y="99" width="22" height="10" rx="3" />
        <rect className="art-main" x="292" y="106" width="60" height="40" rx="7" />
        <circle className="art-paper" cx="322" cy="126" r="13" />
        <circle className="art-main-dark" cx="322" cy="126" r="8" />
        <circle className="art-paper" cx="319" cy="123" r="2" />
      </g>

      {/* Flask */}
      <g className="art--stem">
        <path className="art-paper" d="M200 206l-15 33a5 5 0 0 0 4.5 7h35a5 5 0 0 0 4.5-7l-15-33v-16h-14z" />
        <path className="art-main" d="M192 224h30l7 15a5 5 0 0 1-4.5 7h-35a5 5 0 0 1-4.5-7z" />
        <path className="art-stroke" d="M200 206l-15 33a5 5 0 0 0 4.5 7h35a5 5 0 0 0 4.5-7l-15-33v-16h-14zM196 190h22" />
        <circle className="art-soft" cx="203" cy="236" r="3" />
        <circle className="art-soft" cx="213" cy="231" r="2" />
      </g>

      {/* Empty cubby: this item is checked out */}
      <rect className="hero-dashed" x="288" y="190" width="68" height="58" rx="8" />
      <g className="art--spaces">
        <rect className="art-accent" x="300" y="206" width="44" height="26" rx="6" />
        <circle className="art-paper" cx="309" cy="219" r="3" />
        <path className="hero-check-dark" d="M318 219l5 5l10-10" />
      </g>

      {/* Calculator */}
      <g className="art--technology">
        <rect className="art-main-dark" x="187" y="288" width="40" height="58" rx="6" />
        <rect className="art-paper" x="193" y="294" width="28" height="12" rx="2" />
        {[0, 1, 2].map((row) =>
          [0, 1, 2].map((column) => (
            <rect
              key={`${row}-${column}`}
              className={row === 2 && column === 2 ? 'art-accent' : 'art-soft'}
              x={193 + column * 10}
              y={312 + row * 10}
              width="8"
              height="6"
              rx="1.5"
            />
          )),
        )}
      </g>

      {/* Megaphone */}
      <g className="art--events">
        <path className="art-main" d="M294 310h12l28-15v46l-28-15h-12z" />
        <path className="art-main-dark" d="M299 326l4 17h9l-3-17z" />
        <path className="art-stroke-main" d="M343 307a16 16 0 0 1 0 22" />
      </g>

      {/* Reservation card */}
      <g className="hero-card">
        <rect className="hero-card__bg" x="24" y="250" width="180" height="112" rx="14" />
        <rect className="hero-primary" x="40" y="268" width="36" height="36" rx="8" />
        <path className="hero-paper-line" d="M47 281h22M47 289h14M50 262v10M66 262v10" />
        <rect className="hero-ink-soft" x="88" y="272" width="90" height="8" rx="4" />
        <rect className="hero-muted-soft" x="88" y="288" width="60" height="8" rx="4" />
        <rect className="hero-primary-soft" x="40" y="320" width="46" height="24" rx="12" />
        <rect className="hero-primary-soft" x="92" y="320" width="46" height="24" rx="12" />
        <rect className="hero-accent-soft" x="144" y="320" width="44" height="24" rx="12" />
        <circle className="hero-success" cx="198" cy="256" r="17" />
        <path className="hero-check" d="M190 256l5.5 5.5l10-10" />
      </g>

      {/* Service request card */}
      <g className="hero-card">
        <rect className="hero-card__bg" x="330" y="24" width="170" height="92" rx="14" />
        <circle className="hero-avatar" cx="356" cy="52" r="13" />
        <rect className="hero-ink-soft" x="378" y="44" width="100" height="8" rx="4" />
        <rect className="hero-muted-soft" x="378" y="60" width="68" height="8" rx="4" />
        <rect className="hero-accent" x="346" y="82" width="90" height="20" rx="10" />
        <circle className="hero-ink" cx="359" cy="92" r="4" />
        <rect className="hero-ink-soft" x="368" y="89" width="56" height="6" rx="3" />
      </g>

      {/* Availability chip */}
      <g className="hero-card">
        <rect className="hero-card__bg" x="300" y="360" width="200" height="60" rx="14" />
        {['open', 'open', 'limited', 'full', 'open', 'open'].map((level, index) => (
          <rect key={index} className={`hero-slot hero-slot--${level}`} x={316 + index * 29} y="376" width="24" height="28" rx="6" />
        ))}
      </g>

      {/* Sparkles */}
      <path className="hero-sparkle" d="M112 40l4 10l10 4l-10 4l-4 10l-4-10l-10-4l10-4z" />
      <path className="hero-sparkle" d="M470 170l3 7l7 3l-7 3l-3 7l-3-7l-7-3l7-3z" />
      <path className="hero-sparkle" d="M60 400l3 7l7 3l-7 3l-3 7l-3-7l-7-3l7-3z" />
    </svg>
  );
}
