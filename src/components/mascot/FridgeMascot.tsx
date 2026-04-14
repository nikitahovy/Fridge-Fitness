/**
 * FridgeMascot — the canonical Fridge Fitness mascot character.
 *
 * A tiny anthropomorphized fridge with eyes, a smile, two legs, and
 * optional waving arms. Color: uses `currentColor` everywhere.
 */

type FridgeMascotProps = {
  size?: number;
  running?: boolean;
  waving?: boolean;
  className?: string;
};

export default function FridgeMascot({
  size = 22,
  running = false,
  waving = false,
  className = "",
}: FridgeMascotProps) {
  // Wider viewBox when waving to fit arms that extend beyond the body
  const vb = waving ? "-4 0 32 32" : "0 0 24 32";
  const aspect = waving ? 32 / 32 : 32 / 24;
  const height = Math.round(size * aspect);

  return (
    <svg
      viewBox={vb}
      width={size}
      height={height}
      className={className}
      fill="none"
      aria-hidden="true"
    >
      {/* Waving arms — both move, slightly offset timing */}
      {waving && (
        <>
          <g className="mascot-wave-left">
            <line x1="3" y1="14" x2="-2" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </g>
          <g className="mascot-wave-right">
            <line x1="21" y1="14" x2="26" y2="9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </g>
        </>
      )}
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
      {/* Left leg */}
      <g className={running ? "fridge-leg-a" : ""}>
        <line x1="8" y1="25" x2="8" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
      {/* Right leg */}
      <g className={running ? "fridge-leg-b" : ""}>
        <line x1="16" y1="25" x2="16" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}
