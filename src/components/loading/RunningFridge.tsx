/**
 * RunningFridge — a cute loading bar with the FridgeMascot character
 * running across a dashed track. Used during AI photo analysis.
 *
 * Animations live in globals.css under "Running fridge loader".
 * Mascot design lives in src/components/mascot/FridgeMascot.tsx.
 */

import FridgeMascot from "@/components/mascot/FridgeMascot";

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
      <div className="relative h-10 rounded-full overflow-hidden bg-white/60 dark:bg-neutral-900/60 border border-slate-300/60 dark:border-neutral-700/60">
        {/* Scrolling dashed ground line */}
        <div className="fridge-track absolute left-0 right-0 bottom-1.5 h-[2px] opacity-70" />

        {/* The runner — absolutely positioned, animates `left` across the bar.
            Uses top-0/bottom-0 + flex to vertically center (instead of -translate-y-1/2)
            so the runner has no transform of its own and the `left` animation runs cleanly. */}
        <div className="fridge-runner absolute top-0 bottom-0 w-7 flex items-center justify-center text-slate-700">
          <FridgeMascot size={22} running className="fridge-bob" />
        </div>
      </div>

      <p className="font-pixel text-[9px] text-muted/70 mt-3 text-center tracking-wider">
        DETECTING ITEMS · USUALLY 3-5 SECONDS
      </p>
    </div>
  );
}
