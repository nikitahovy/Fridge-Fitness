"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Camera, Pencil, Settings, Plus } from "lucide-react";
import { ScoredRecipe, ItemWithRisk } from "@/lib/types";
import FridgeMascot from "@/components/mascot/FridgeMascot";

export default function Dashboard() {
  const [recipes, setRecipes] = useState<ScoredRecipe[]>([]);
  const [eatFirst, setEatFirst] = useState<ItemWithRisk[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [r, e] = await Promise.all([
      fetch("/api/recipes").then((r) => r.json()),
      fetch("/api/eat-first").then((r) => r.json()),
    ]);
    setRecipes(r); setEatFirst(e); setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function markItem(id: string, status: string, extraUpdates?: Record<string, string>) {
    await fetch("/api/inventory", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status, ...extraUpdates }) });
    fetchAll();
  }

  const atRiskItems = eatFirst.filter((i) => i.riskTier === "use-today" || i.riskTier === "use-this-week");
  const freezableItems = atRiskItems.filter((i) => i.location === "fridge" && i.category !== "produce");
  const dollarAtRisk = atRiskItems.reduce((sum, i) => sum + i.purchasePrice, 0);
  const topAtRiskNames = atRiskItems.slice(0, 3).map((i) => i.name);
  const topRecipe = recipes[0];
  const hasInventory = eatFirst.length > 0;
  const heroExplanation = topRecipe?.explanation?.[0];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div><div className="animate-pulse bg-slate-300/60 rounded-lg w-24 h-3 mb-3" /><div className="animate-pulse bg-slate-300/60 rounded-lg w-56 h-12" /></div>
        <div className="animate-pulse bg-slate-300/60 rounded-2xl h-28" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 animate-pulse bg-slate-300/60 rounded-2xl h-56" />
          <div className="lg:col-span-2 animate-pulse bg-slate-300/60 rounded-2xl h-56" />
        </div>
        <div className="flex gap-4">{[1,2,3].map((i) => <div key={i} className="animate-pulse bg-slate-300/60 rounded-2xl h-40 w-56 flex-shrink-0" />)}</div>
      </div>
    );
  }

  // Onboarding for new users with empty inventory
  if (!hasInventory) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 py-8">
        <div className="text-center">
          <div className="flex flex-col items-center mb-5">
            <div className="bg-card border border-card-border rounded-xl px-3 py-1.5 mb-2 text-xs text-muted">Let&apos;s stock me up!</div>
            <div className="text-slate-600 dark:text-slate-300"><FridgeMascot size={52} waving /></div>
          </div>
          <h2 className="text-display text-4xl mb-3">Welcome!</h2>
          <p className="text-muted max-w-md mx-auto">Your kitchen is empty. Let&apos;s stock it up — scan a receipt, take a photo of your fridge, or add items manually.</p>
        </div>

        <div className="space-y-3">
          <Link href="/add-item" className="glass rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 hover:border-slate-300 border border-transparent block">
            <Camera className="w-7 h-7 text-slate-700 flex-shrink-0" strokeWidth={1.75} />
            <div>
              <p className="font-bold">Scan with Camera</p>
              <p className="text-xs text-muted">Take a photo of your groceries — AI detects items automatically</p>
            </div>
          </Link>

          <Link href="/add-item" className="glass rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 hover:border-slate-300 border border-transparent block">
            <Pencil className="w-7 h-7 text-slate-700 flex-shrink-0" strokeWidth={1.75} />
            <div>
              <p className="font-bold">Add Manually</p>
              <p className="text-xs text-muted">Type in items one by one with prices and expiry dates</p>
            </div>
          </Link>

          <Link href="/settings" className="glass rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 hover:border-slate-300 border border-transparent block">
            <Settings className="w-7 h-7 text-slate-700 flex-shrink-0" strokeWidth={1.75} />
            <div>
              <p className="font-bold">Set Up Your Profile</p>
              <p className="text-xs text-muted">Dietary preferences, fitness goals, household size</p>
            </div>
          </Link>
        </div>

        <div className="glass rounded-2xl p-6 text-center">
          <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-3">// HOW IT WORKS</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-2xl mb-2">1</p>
              <p className="text-xs text-muted">Add your food items via camera or manually</p>
            </div>
            <div>
              <p className="text-2xl mb-2">2</p>
              <p className="text-xs text-muted">We track what&apos;s expiring and suggest what to cook</p>
            </div>
            <div>
              <p className="text-2xl mb-2">3</p>
              <p className="text-xs text-muted">Save money by eating food before it goes to waste</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 md:space-y-10">
      <div>
        <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-2">// DASHBOARD</p>
        <h2 className="text-display text-4xl md:text-5xl">What&apos;s<br/>Cooking?</h2>
      </div>

      {/* WHOOP Recovery — Coming Soon */}
      <div className="glass rounded-2xl p-6 md:p-8 flex items-center gap-6 transition-all duration-200">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden flex-shrink-0 opacity-60 ring-1 ring-white/20">
          <img src="/logo.png" alt="Fridge Fitness" className="w-full h-full object-contain" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-pixel text-[10px] text-muted uppercase tracking-wider">WHOOP RECOVERY</p>
            <span className="font-pixel text-[8px] px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">BETA</span>
          </div>
          <p className="text-display text-xl md:text-2xl mb-1">Coming Soon</p>
          <p className="text-xs text-muted">Wearable integration for recovery-based meal recommendations. Connect your WHOOP, Oura, or Apple Watch to get personalized nutrition aligned with your training.</p>
        </div>
      </div>

      {/* Unified loss-aversion hero */}
      <div className="glass rounded-2xl p-5 md:p-8 flex flex-col transition-all duration-200">
        {dollarAtRisk > 0 ? (
          <>
            <div className="flex items-start justify-between mb-3">
              <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em]">// AT RISK THIS WEEK</p>
              <div className="text-rose-400 dark:text-rose-300"><FridgeMascot size={28} running className="fridge-bob" /></div>
            </div>
            <div className="text-display text-5xl md:text-7xl text-danger mb-2 leading-none">
              ${dollarAtRisk.toFixed(0)}<span className="text-2xl md:text-3xl">.{dollarAtRisk.toFixed(2).split('.')[1]}</span>
            </div>
            {topAtRiskNames.length > 0 && (
              <p className="text-sm md:text-base text-muted mb-1">
                {topAtRiskNames.join(", ")}
                {atRiskItems.length > 3 && ` + ${atRiskItems.length - 3} more`}
              </p>
            )}
            <p className="text-xs text-muted mb-6 md:mb-7">losing quality soon.</p>
          </>
        ) : (
          <>
            <div className="flex items-start justify-between mb-3">
              <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em]">// YOU&apos;RE ON TRACK</p>
              <div className="text-emerald-400 dark:text-emerald-300"><FridgeMascot size={28} /></div>
            </div>
            <div className="text-display text-4xl md:text-5xl text-safe mb-2 leading-none">All clear</div>
            <p className="text-xs text-muted mb-6 md:mb-7">Nothing at risk this week.</p>
          </>
        )}

        {topRecipe && (
          <>
            <div className="border-t border-slate-300/50 pt-5 md:pt-6">
              <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-3">
                // {dollarAtRisk > 0 ? "TONIGHT'S RESCUE" : "YOUR BEST MEAL RIGHT NOW"}
              </p>
              <h3 className="text-display text-2xl md:text-4xl mb-3">{topRecipe.recipe.name}</h3>
              {heroExplanation && (
                <p className="text-sm text-muted mb-4">{heroExplanation}</p>
              )}
              <div className="flex flex-wrap gap-x-6 gap-y-2 font-pixel text-xs text-muted mb-5 md:mb-6">
                {topRecipe.wasteRescueValue > 0 && (
                  <span className="text-danger">rescues ${topRecipe.wasteRescueValue.toFixed(2)}</span>
                )}
                <span>{topRecipe.recipe.macros.protein}g protein</span>
                <span>{topRecipe.recipe.cookTimeMinutes} min</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href={`/recipes/${topRecipe.recipe.id}`} className="btn btn-primary">
                  Cook this →
                </Link>
                {dollarAtRisk > 0 && (
                  <Link href="/eat-first" className="btn">
                    See all {atRiskItems.length} at-risk →
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
        {!topRecipe && (
          <p className="text-muted">No recipes available</p>
        )}
      </div>

      {/* Expiring Soon */}
      <div>
        <div className="flex items-center justify-between mb-4 md:mb-5">
          <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em]">// EXPIRING SOON</p>
          {atRiskItems.length > 0 && <Link href="/eat-first" className="btn text-[9px]">View all →</Link>}
        </div>

        {atRiskItems.length === 0 ? (
          <Link href="/add-item" className="glass rounded-2xl p-6 flex items-center gap-5 transition-all duration-200 hover:border-slate-300 border border-transparent block">
            <Plus className="w-7 h-7 text-slate-700 flex-shrink-0" strokeWidth={1.75} />
            <div>
              <p className="font-bold mb-0.5">Nothing expiring yet</p>
              <p className="text-xs text-muted">Add items to your inventory to start tracking freshness and saving food.</p>
            </div>
          </Link>
        ) : (
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-3">
          {atRiskItems.slice(0, 6).map((item) => {
            const isToday = item.riskTier === "use-today";
            return (
              <div key={item.id}
                className="flex-shrink-0 w-48 md:w-56 rounded-2xl p-4 md:p-5 transition-all duration-200 backdrop-blur-2xl"
                style={{
                  background: isToday
                    ? "linear-gradient(135deg, rgba(254,205,211,0.75) 0%, rgba(255,255,255,0.5) 50%, rgba(254,205,211,0.55) 100%)"
                    : "linear-gradient(135deg, rgba(254,215,170,0.65) 0%, rgba(255,255,255,0.5) 50%, rgba(254,215,170,0.4) 100%)",
                  border: `1px solid ${isToday ? "rgba(244,63,94,0.35)" : "rgba(234,179,8,0.35)"}`,
                  boxShadow: "0 4px 16px rgba(31,87,184,0.12), inset 0 1px 0 rgba(255,255,255,0.95)",
                }}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`font-pixel text-[9px] uppercase tracking-wider ${isToday ? "text-danger" : "text-yellow-400"}`}>
                    {isToday ? "USE TODAY" : "THIS WEEK"}
                  </span>
                  <span className={`text-display text-lg ${isToday ? "text-danger" : "text-yellow-400"}`}>${item.purchasePrice.toFixed(2)}</span>
                </div>
                <p className="font-bold text-sm mb-0.5">{item.name}</p>
                <p className="text-xs text-muted mb-4">{item.quantity}</p>
                <div className="flex gap-1.5">
                  <button onClick={() => markItem(item.id, "consumed")} className="btn btn-eat flex-1 !px-2 !py-1.5">EATEN</button>
                  <button onClick={() => markItem(item.id, "frozen", { location: "freezer" })} className="btn btn-freeze flex-1 !px-2 !py-1.5">FREEZE</button>
                  <button onClick={() => markItem(item.id, "discarded")} className="btn btn-danger flex-1 !px-2 !py-1.5">TOSS</button>
                </div>
              </div>
            );
          })}
        </div>
        )}
      </div>

      {/* Freeze Now nudges */}
      {freezableItems.length > 0 && (
        <div className="risk-frozen backdrop-blur-md shadow-[0_2px_10px_rgba(31,87,184,0.08)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.4)] rounded-2xl p-4 md:p-5">
          <p className="font-pixel text-[10px] text-sky-700 dark:text-sky-300 uppercase tracking-[0.2em] mb-3">// FREEZE TO SAVE ${freezableItems.reduce((s, i) => s + i.purchasePrice, 0).toFixed(2)}</p>
          <p className="text-xs text-muted mb-3">These items are expiring but can be frozen to extend their life.</p>
          <div className="space-y-2">
            {freezableItems.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{item.name}</p>
                  <p className="text-[10px] text-muted">{item.quantity} · ${item.purchasePrice.toFixed(2)}</p>
                </div>
                <button onClick={() => markItem(item.id, "frozen", { location: "freezer" })} className="btn btn-freeze !text-[9px] !px-3 !py-1.5 flex-shrink-0">
                  FREEZE NOW
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recipes */}
      <div>
        <div className="flex items-center justify-between mb-4 md:mb-5">
          <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em]">// SUGGESTED RECIPES</p>
          <Link href="/recipes" className="btn text-[9px]">View all →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {recipes.slice(1, 5).map((sr) => (
            <Link key={sr.recipe.id} href={`/recipes/${sr.recipe.id}`}
              className="glass rounded-2xl overflow-hidden transition-all duration-200 group block">
              {sr.recipe.imageUrl && (
                <div className="w-full h-32">
                  <img
                    src={sr.recipe.imageUrl}
                    alt={sr.recipe.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="p-4 md:p-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold">{sr.recipe.name}</h4>
                  <span className="glass-btn rounded-lg px-2.5 py-1 font-pixel text-[10px] text-muted">{sr.score}pts</span>
                </div>
                <p className="text-xs text-muted mb-3">{sr.explanation[0]}</p>
                <div className="flex gap-4 font-pixel text-[10px] text-muted">
                  <span>{sr.recipe.cookTimeMinutes}m</span>
                  <span>{sr.recipe.macros.protein}g pro</span>
                  {sr.wasteRescueValue > 0 && <span className="text-danger">saves ${sr.wasteRescueValue.toFixed(2)}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile: Quick camera — glass button */}
      <div className="md:hidden fixed bottom-20 right-4 z-40">
        <Link href="/add-item" className="glass-btn w-14 h-14 rounded-full flex items-center justify-center text-slate-700">
          <Camera className="w-6 h-6" strokeWidth={1.75} />
        </Link>
      </div>
    </div>
  );
}
