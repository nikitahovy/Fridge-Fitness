"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // Auto-login after signup (if email confirmation is disabled)
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (!loginError) {
      router.push("/");
      router.refresh();
    }
  }

  if (success) {
    return (
      <div className="bg-gradient-to-r from-emerald-950/50 to-emerald-900/20 border border-emerald-500/20 rounded-2xl p-6 text-center">
        <p className="font-bold mb-2">Account created!</p>
        <p className="text-sm text-muted">Check your email for a confirmation link, or you may be redirected automatically.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-4 text-center">// CREATE ACCOUNT</p>

      <form onSubmit={handleSignup} className="bg-card border border-card-border rounded-2xl p-6 space-y-4">
        {error && (
          <div className="bg-gradient-to-r from-red-950/40 to-red-900/15 border border-red-500/20 rounded-xl p-3 text-sm text-danger">
            {error}
          </div>
        )}

        <div>
          <label className="block font-pixel text-[9px] text-muted uppercase mb-1.5">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-white/30 transition"
            placeholder="Your name"
          />
        </div>

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
            minLength={6}
            className="w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-white/30 transition"
            placeholder="Min 6 characters"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary btn-lg w-full disabled:opacity-50"
        >
          {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
        </button>
      </form>

      <p className="text-center text-sm text-muted mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground underline underline-offset-4 hover:text-white">
          Sign in
        </Link>
      </p>
    </div>
  );
}
