/**
 * FridgeMascot — the canonical Fridge Fitness mascot character.
 *
 * A tiny anthropomorphized fridge with eyes, a smile, and two legs.
 * Used in loading states (running animation) and reusable for any
 * other cute UI moments — empty states, success toasts, error pages,
 * easter eggs, etc.
 *
 * Design source of truth: this file. Do not duplicate the SVG paths
 * elsewhere — import this component instead. A standalone raster/vector
 * version also exists at public/mascot.svg for marketing/design use.
 *
 * Color: uses `currentColor` everywhere, so set the parent's text color
 * to recolor the mascot (e.g. <div className="text-emerald-300">).
 */

type FridgeMascotProps = {
  /** Width in pixels. Height auto-scales to keep the 24:32 aspect ratio. Default 22. */
  size?: number;
  /** When true, the legs animate in alternating step phases (requires the
   *  `fridge-leg-a` / `fridge-leg-b` keyframes from globals.css). */
  running?: boolean;
  /** Extra classes applied to the SVG element (e.g. `fridge-bob` for the
   *  bobbing animation, or `text-emerald-300` to recolor). */
  className?: string;
};

export default function FridgeMascot({
  size = 22,
  running = false,
  className = "",
}: FridgeMascotProps) {
  const height = Math.round(size * (32 / 24));
  return (
    <svg
      viewBox="0 0 24 32"
      width={size}
      height={height}
      className={className}
      fill="none"
      aria-hidden="true"
    >
      {/* Body */}
      <rect x="3" y="1" width="18" height="24" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      {/* Freezer divider */}
      <line x1="4" y1="9" x2="20" y2="9" stroke="currentColor" strokeWidth="1.4" />
      {/* Top compartment handle */}
      <line x1="17" y1="4" x2="17" y2="6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      {/* Bottom compartment handle */}
      <line x1="17" y1="13" x2="17" y2="16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      {/* Cute eyes */}
      <circle cx="9" cy="13.5" r="0.9" fill="currentColor" />
      <circle cx="13" cy="13.5" r="0.9" fill="currentColor" />
      {/* Tiny smile */}
      <path d="M 9.5 16.5 Q 11 17.5 12.5 16.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" />
      {/* Left leg (animated when running) */}
      <g className={running ? "fridge-leg-a" : ""}>
        <line x1="8" y1="25" x2="8" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
      {/* Right leg (animated when running, opposite phase) */}
      <g className={running ? "fridge-leg-b" : ""}>
        <line x1="16" y1="25" x2="16" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
