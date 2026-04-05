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
          <div className="bg-gradient-to-r from-red-950/40 to-red-900/15 border border-red-500/20 rounded-xl p-3 text-sm text-danger">
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
            className="w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-white/30 transition"
            placeholder="you@email.com"
          />
        </div>

        <div>
          <label className="block font-pixel text-[9px] text-muted uppercase mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-white/30 transition"
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
        <Link href="/signup" className="text-foreground underline underline-offset-4 hover:text-white">
          Sign up
        </Link>
      </p>
    </div>
  );
}
