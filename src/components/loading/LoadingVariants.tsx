/**
 * Loading animation variants — experimental.
 *
 * Three options to try out between route transitions. Swap which one
 * is rendered by editing the import in:
 *   - src/app/(app)/loading.tsx
 *   - src/app/(auth)/loading.tsx
 *
 * Once a winner is picked, delete the unused variants.
 */

function LoadingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center gap-5">
      {children}
      <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em]">
        // LOADING
      </p>
    </div>
  );
}

/** Variant A — gentle opacity pulse on the logo. Calm, branded. */
export function LogoPulse() {
  return (
    <LoadingShell>
      <div className="w-20 h-20 rounded-2xl overflow-hidden animate-pulse ring-1 ring-white/20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" className="w-20 h-20 object-contain" />
      </div>
    </LoadingShell>
  );
}

/** Variant B — logo with a slow rotating ring around it. More active. */
export function LogoOrbit() {
  return (
    <LoadingShell>
      <div className="relative w-24 h-24 flex items-center justify-center">
        <div className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-white/40 border-r-white/10 animate-spin" />
        <div className="w-16 h-16 rounded-2xl overflow-hidden ring-1 ring-white/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="w-16 h-16 object-contain" />
        </div>
      </div>
    </LoadingShell>
  );
}

/** Variant C — three bouncing dots, no logo. Cleanest, lightest. */
export function MinimalDots() {
  return (
    <LoadingShell>
      <div className="flex items-end gap-2 h-8">
        <span className="w-2 h-2 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </LoadingShell>
  );
}
