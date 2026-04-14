import Link from "next/link";
import FridgeMascot from "@/components/mascot/FridgeMascot";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center flex flex-col items-center">
        <div className="bg-white/60 dark:bg-neutral-800/60 border border-slate-200/50 dark:border-white/10 rounded-xl px-4 py-2 mb-3 text-sm text-muted">Maybe it expired?</div>
        <div className="mb-6 text-slate-400 dark:text-slate-500">
          <FridgeMascot size={64} waving />
        </div>
        <h2 className="text-display text-5xl mb-3">404</h2>
        <p className="text-muted mb-6">This page doesn&apos;t exist.</p>
        <Link href="/" className="btn btn-primary">Back to Dashboard</Link>
      </div>
    </div>
  );
}
