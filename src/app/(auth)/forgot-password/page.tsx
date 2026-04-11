"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="bg-gradient-to-r from-emerald-200/50 to-emerald-100/20 border border-emerald-500/20 rounded-2xl p-6 text-center">
        <p className="text-display text-xl mb-2">Check Your Email</p>
        <p className="text-sm text-muted mb-4">We sent a reset link to <span className="text-foreground">{email}</span></p>
        <Link href="/login" className="btn btn-primary">BACK TO LOGIN</Link>
      </div>
    );
  }

  return (
    <div>
      <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-4 text-center">// RESET PASSWORD</p>

      <form onSubmit={handleReset} className="bg-card border border-card-border rounded-2xl p-6 space-y-4">
        {error && (
          <div className="bg-gradient-to-r from-rose-200/40 to-rose-100/15 border border-red-500/20 rounded-xl p-3 text-sm text-danger">{error}</div>
        )}
        <div>
          <label className="block font-pixel text-[9px] text-muted uppercase mb-1.5">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="w-full bg-white/75 dark:bg-neutral-900/70 border border-slate-300/70 dark:border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-sky-400 transition"
            placeholder="you@email.com" />
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full disabled:opacity-50">
          {loading ? "SENDING..." : "SEND RESET LINK"}
        </button>
      </form>

      <p className="text-center text-sm text-muted mt-4">
        <Link href="/login" className="text-foreground underline underline-offset-4 hover:text-slate-900">Back to login</Link>
      </p>
    </div>
  );
}
