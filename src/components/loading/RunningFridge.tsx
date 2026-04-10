/**
 * RunningFridge — a cute loading bar with a tiny fridge character
 * running across a dashed track. Used during AI photo analysis.
 *
 * Animations live in globals.css under "Running fridge loader".
 */

export default function RunningFridge({ label = "SCANNING WITH AI" }: { label?: string }) {
  return (
    <div className="glass rounded-2xl p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em]">
          // {label}
        </p>
        <span className="font-pixel text-[10px] text-muted animate-pulse">...</span>
      </div>

      {/* The track */}
      <div className="relative h-10 rounded-full overflow-hidden bg-white/[0.04] border border-white/[0.08]">
        {/* Scrolling dashed ground line */}
        <div className="fridge-track absolute left-0 right-0 bottom-1.5 h-[2px] opacity-70" />

        {/* The runner — absolutely positioned, animates `left` across the bar.
            Uses top-0/bottom-0 + flex to vertically center (instead of -translate-y-1/2)
            so the runner has no transform of its own and the `left` animation runs cleanly. */}
        <div className="fridge-runner absolute top-0 bottom-0 w-7 flex items-center justify-center text-white">
          <svg viewBox="0 0 24 32" width="22" height="28" className="fridge-bob" fill="none">
            {/* Body */}
            <rect x="3" y="1" width="18" height="24" rx="2.5" stroke="currentColor" strokeWidth="1.6"/>
            {/* Freezer divider */}
            <line x1="4" y1="9" x2="20" y2="9" stroke="currentColor" strokeWidth="1.4"/>
            {/* Top handle */}
            <line x1="17" y1="4" x2="17" y2="6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            {/* Bottom handle */}
            <line x1="17" y1="13" x2="17" y2="16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            {/* Cute eyes */}
            <circle cx="9" cy="13.5" r="0.9" fill="currentColor"/>
            <circle cx="13" cy="13.5" r="0.9" fill="currentColor"/>
            {/* Tiny smile */}
            <path d="M 9.5 16.5 Q 11 17.5 12.5 16.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none"/>
            {/* Left leg (animated) */}
            <g className="fridge-leg-a">
              <line x1="8" y1="25" x2="8" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </g>
            {/* Right leg (animated, opposite phase) */}
            <g className="fridge-leg-b">
              <line x1="16" y1="25" x2="16" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </g>
          </svg>
        </div>
      </div>

      <p className="font-pixel text-[9px] text-muted/70 mt-3 text-center tracking-wider">
        DETECTING ITEMS · USUALLY 3-5 SECONDS
      </p>
    </div>
  );
}
