/** An empty, open box with a magnifying glass, used when a list has no results. */
export function EmptyArt({ className = '' }) {
  return (
    <svg className={`empty-art ${className}`.trim()} viewBox="0 0 160 120" aria-hidden="true" focusable="false">
      <ellipse className="empty-art__shadow" cx="76" cy="104" rx="52" ry="8" />
      <path className="empty-art__side" d="M30 52l46 14v36l-46-14z" />
      <path className="empty-art__front" d="M76 66l46-14v36l-46 14z" />
      <path className="empty-art__flap" d="M30 52l-12 16l46 14l12-16z" />
      <path className="empty-art__flap" d="M122 52l12 16l-46 14l-12-16z" />
      <path className="empty-art__inside" d="M30 52l46-14l46 14l-46 14z" />
      <circle className="empty-art__lens" cx="118" cy="30" r="14" />
      <path className="empty-art__handle" d="M128 40l12 12" />
    </svg>
  );
}
