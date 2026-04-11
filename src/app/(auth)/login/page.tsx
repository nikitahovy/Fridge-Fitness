"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div>
      <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-4 text-center">// LOG IN</p>

      <form onSubmit={handleLogin} className="bg-card border border-card-border rounded-2xl p-6 space-y-4">
        {error && (
          <div className="bg-gradient-to-r from-rose-200/40 to-rose-100/15 border border-red-500/20 rounded-xl p-3 text-sm text-danger">
            {error}
          </div>
        )}

        <div>
          <label className="block font-pixel text-[9px] text-muted uppercase mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-white/75 dark:bg-neutral-900/70 border border-slate-300/70 dark:border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-sky-400 transition"
            placeholder="you@email.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block font-pixel text-[9px] text-muted uppercase">Password</label>
            <Link href="/forgot-password" className="font-pixel text-[9px] text-muted hover:text-foreground uppercase">Forgot?</Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-white/75 dark:bg-neutral-900/70 border border-slate-300/70 dark:border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-sky-400 transition"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-lg w-full disabled:opacity-50"
        >
          {loading ? "SIGNING IN..." : "SIGN IN"}
        </button>
      </form>

      <p className="text-center text-sm text-muted mt-4">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-foreground underline underline-offset-4 hover:text-slate-900">
          Sign up
        </Link>
      </p>
    </div>
  );
}
