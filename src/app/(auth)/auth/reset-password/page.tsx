"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) { setError(error.message); setLoading(false); return; }

    router.push("/");
    router.refresh();
  }

  return (
    <div>
      <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-4 text-center">// NEW PASSWORD</p>
      <form onSubmit={handleUpdate} className="bg-card border border-card-border rounded-2xl p-6 space-y-4">
        {error && (
          <div className="bg-gradient-to-r from-red-950/40 to-red-900/15 border border-red-500/20 rounded-xl p-3 text-sm text-danger">{error}</div>
        )}
        <div>
          <label className="block font-pixel text-[9px] text-muted uppercase mb-1.5">New Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
            className="w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-white/30 transition"
            placeholder="Min 6 characters" />
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full disabled:opacity-50">
          {loading ? "UPDATING..." : "SET NEW PASSWORD"}
        </button>
      </form>
    </div>
  );
}
