/**
 * The Commons logo: four "cubbies" on a shelf, one highlighted, which stands
 * for one shared item being reserved from a larger collection.
 */
export function LogoMark({ size = 32 }) {
  return (
    <svg className="logo-mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect className="logo-mark__bg" x="1" y="1" width="30" height="30" rx="8" />
      <rect className="logo-mark__tile" x="8" y="8" width="7" height="7" rx="2" />
      <rect className="logo-mark__tile" x="17" y="8" width="7" height="7" rx="2" />
      <rect className="logo-mark__tile" x="8" y="17" width="7" height="7" rx="2" />
      <rect className="logo-mark__accent" x="17" y="17" width="7" height="7" rx="2" />
    </svg>
  );
}
