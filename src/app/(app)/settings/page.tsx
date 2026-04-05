"use client";

import { useEffect, useState, useCallback } from "react";

const FITNESS_GOALS = [
  { value: "maintenance", label: "Maintenance" },
  { value: "muscle-gain", label: "Muscle Gain" },
  { value: "fat-loss", label: "Fat Loss" },
  { value: "endurance", label: "Endurance" },
];

const DIETARY_OPTIONS = [
  "Vegetarian", "Vegan", "Pescatarian", "Keto", "Paleo",
  "Gluten-Free", "Dairy-Free", "Nut-Free", "Halal", "Kosher",
];

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [householdSize, setHouseholdSize] = useState(1);
  const [fitnessGoal, setFitnessGoal] = useState("maintenance");
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchProfile = useCallback(async () => {
    const res = await fetch("/api/profile");
    const data = await res.json();
    setEmail(data.email || "");
    setDisplayName(data.displayName || "");
    setHouseholdSize(data.householdSize || 1);
    setFitnessGoal(data.fitnessGoal || "maintenance");
    setDietaryPreferences(data.dietaryPreferences || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName, householdSize, fitnessGoal, dietaryPreferences }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function toggleDietary(pref: string) {
    setDietaryPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  }

  if (loading) return <div className="max-w-2xl mx-auto py-20"><p className="font-pixel text-muted text-sm">LOADING...</p></div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-2">// SETTINGS</p>
        <h2 className="text-display text-4xl">Your<br/>Profile</h2>
      </div>

      {saved && (
        <div className="bg-gradient-to-r from-emerald-950/50 to-emerald-900/20 border border-emerald-500/20 rounded-2xl p-4 mb-5">
          <p className="text-sm">Settings saved!</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Account info */}
        <div className="bg-card border border-card-border rounded-2xl p-5 md:p-6 space-y-4">
          <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em]">// ACCOUNT</p>

          <div>
            <label className="block font-pixel text-[9px] text-muted uppercase mb-1.5">Email</label>
            <p className="text-sm text-foreground/60 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5">{email}</p>
          </div>

          <div>
            <label className="block font-pixel text-[9px] text-muted uppercase mb-1.5">Display Name</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-white/30 transition"
              placeholder="Your name" />
          </div>

          <div>
            <label className="block font-pixel text-[9px] text-muted uppercase mb-1.5">Household Size</label>
            <div className="flex gap-1 bg-white/[0.04] rounded-lg p-1 w-fit">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <button key={n} onClick={() => setHouseholdSize(n)}
                  className={`font-pixel text-[11px] w-9 py-1.5 rounded-md transition-all cursor-pointer ${
                    householdSize === n ? "bg-white text-black font-bold" : "text-muted hover:text-foreground"
                  }`}>{n}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Fitness */}
        <div className="bg-card border border-card-border rounded-2xl p-5 md:p-6 space-y-4">
          <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em]">// FITNESS GOAL</p>
          <div className="flex flex-wrap gap-2">
            {FITNESS_GOALS.map((g) => (
              <button key={g.value} onClick={() => setFitnessGoal(g.value)}
                className={`font-pixel text-[10px] px-4 py-2 rounded-xl border transition-all cursor-pointer ${
                  fitnessGoal === g.value
                    ? "bg-white text-black font-bold border-white"
                    : "text-muted border-white/[0.08] hover:border-white/25"
                }`}>{g.label}</button>
            ))}
          </div>
        </div>

        {/* Dietary */}
        <div className="bg-card border border-card-border rounded-2xl p-5 md:p-6 space-y-4">
          <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em]">// DIETARY PREFERENCES</p>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((pref) => (
              <button key={pref} onClick={() => toggleDietary(pref)}
                className={`font-pixel text-[10px] px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  dietaryPreferences.includes(pref)
                    ? "bg-gradient-to-r from-emerald-950/60 to-emerald-900/20 border-emerald-500/30 text-safe"
                    : "text-muted border-white/[0.08] hover:border-white/25"
                }`}>{pref}</button>
            ))}
          </div>
          {dietaryPreferences.length === 0 && (
            <p className="text-xs text-muted">None selected — all foods included</p>
          )}
        </div>

        <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-lg w-full disabled:opacity-50">
          {saving ? "SAVING..." : "SAVE SETTINGS"}
        </button>
      </div>
    </div>
  );
}
