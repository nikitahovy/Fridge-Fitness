import Link from "next/link";
import FridgeMascot from "@/components/mascot/FridgeMascot";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 text-slate-400 dark:text-slate-500">
          <FridgeMascot size={64} />
        </div>
        <h2 className="text-display text-5xl mb-3">404</h2>
        <p className="text-muted mb-6">This page doesn&apos;t exist. Maybe it expired?</p>
        <Link href="/" className="btn btn-primary">Back to Dashboard</Link>
      </div>
    </div>
  );
}
