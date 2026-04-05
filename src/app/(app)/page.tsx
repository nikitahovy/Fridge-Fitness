"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ScoredRecipe, ItemWithRisk } from "@/lib/types";

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
  const dollarAtRisk = atRiskItems.reduce((sum, i) => sum + i.purchasePrice, 0);
  const topRecipe = recipes[0];
  const hasInventory = eatFirst.length > 0;

  if (loading) {
    return <div className="max-w-6xl mx-auto flex items-center justify-center py-32"><p className="font-pixel text-muted text-sm">LOADING...</p></div>;
  }

  // Onboarding for new users with empty inventory
  if (!hasInventory) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 py-8">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4">
            <img src="/logo.png" alt="Fridge Fitness" className="w-20 h-20 object-cover scale-110" />
          </div>
          <h2 className="text-display text-4xl mb-3">Welcome!</h2>
          <p className="text-muted max-w-md mx-auto">Your kitchen is empty. Let&apos;s stock it up — scan a receipt, take a photo of your fridge, or add items manually.</p>
        </div>

        <div className="space-y-3">
          <Link href="/add-item" className="glass rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 hover:border-white/20 border border-transparent block">
            <span className="text-3xl">📸</span>
            <div>
              <p className="font-bold">Scan with Camera</p>
              <p className="text-xs text-muted">Take a photo of your groceries — AI detects items automatically</p>
            </div>
          </Link>

          <Link href="/add-item" className="glass rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 hover:border-white/20 border border-transparent block">
            <span className="text-3xl">✏️</span>
            <div>
              <p className="font-bold">Add Manually</p>
              <p className="text-xs text-muted">Type in items one by one with prices and expiry dates</p>
            </div>
          </Link>

          <Link href="/settings" className="glass rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 hover:border-white/20 border border-transparent block">
            <span className="text-3xl">⚙️</span>
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
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden flex-shrink-0 opacity-60">
          <img src="/logo.png" alt="Fridge Fitness" className="w-full h-full object-cover scale-110" />
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

      {/* Hero + At Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 md:gap-6">
        {/* Hero — glass */}
        <div className="lg:col-span-3 glass rounded-2xl p-5 md:p-7 flex flex-col transition-all duration-200">
          <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-4">// BEST NEXT MEAL</p>
          {topRecipe ? (
            <>
              <h3 className="text-display text-3xl md:text-4xl mb-4 md:mb-5">{topRecipe.recipe.name}</h3>
              <div className="flex flex-wrap gap-2 mb-4 md:mb-5">
                {topRecipe.explanation.map((ex, i) => (
                  <span key={i} className="glass-btn text-[11px] px-3 py-1.5 rounded-full text-muted">{ex}</span>
                ))}
              </div>
              <div className="flex gap-6 md:gap-8 font-pixel text-xs text-muted mb-5 md:mb-6">
                <span>{topRecipe.recipe.macros.protein}g protein</span>
                <span>{topRecipe.recipe.macros.carbs}g carbs</span>
                <span>{topRecipe.recipe.cookTimeMinutes} min</span>
              </div>
              <Link href={`/recipes/${topRecipe.recipe.id}`} className="glass-btn rounded-xl px-6 py-3 font-pixel text-xs font-bold uppercase tracking-wider self-start transition-all duration-200">
                View Recipe →
              </Link>
            </>
          ) : (
            <p className="text-muted">No recipes available</p>
          )}
        </div>

        {/* At Risk — glass */}
        <div className="lg:col-span-2 glass rounded-2xl p-5 md:p-7 flex flex-col transition-all duration-200">
          <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-4">// VALUE AT RISK</p>
          <div className="text-display text-5xl md:text-6xl text-danger mb-2">
            ${dollarAtRisk.toFixed(0)}<span className="text-xl md:text-2xl">.{dollarAtRisk.toFixed(2).split('.')[1]}</span>
          </div>
          <p className="text-sm text-muted mb-auto">{atRiskItems.length} item{atRiskItems.length !== 1 ? "s" : ""} expiring soon</p>
          <div className="flex gap-3 mt-5 md:mt-6 pt-4 md:pt-5 border-t border-white/[0.06]">
            <Link href="/eat-first" className="btn btn-primary">Eat-First →</Link>
            <Link href="/inventory" className="btn">Inventory →</Link>
          </div>
        </div>
      </div>

      {/* Expiring Soon */}
      <div>
        <div className="flex items-center justify-between mb-4 md:mb-5">
          <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em]">// EXPIRING SOON</p>
          {atRiskItems.length > 0 && <Link href="/eat-first" className="btn text-[9px]">View all →</Link>}
        </div>

        {atRiskItems.length === 0 ? (
          <Link href="/add-item" className="glass rounded-2xl p-6 flex items-center gap-5 transition-all duration-200 hover:border-white/20 border border-transparent block">
            <span className="text-3xl">➕</span>
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
                    ? "linear-gradient(135deg, rgba(127,29,29,0.5) 0%, rgba(255,255,255,0.05) 50%, rgba(127,29,29,0.25) 100%)"
                    : "linear-gradient(135deg, rgba(113,63,18,0.25) 0%, rgba(255,255,255,0.05) 50%, rgba(113,63,18,0.1) 100%)",
                  border: `1px solid ${isToday ? "rgba(255,107,107,0.2)" : "rgba(234,179,8,0.15)"}`,
                  boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
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

      {/* Recipes */}
      <div>
        <div className="flex items-center justify-between mb-4 md:mb-5">
          <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em]">// SUGGESTED RECIPES</p>
          <Link href="/recipes" className="btn text-[9px]">View all →</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {recipes.slice(1, 5).map((sr) => (
            <Link key={sr.recipe.id} href={`/recipes/${sr.recipe.id}`}
              className="glass rounded-2xl p-4 md:p-5 transition-all duration-200 group block">
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
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile: Quick camera — glass button */}
      <div className="md:hidden fixed bottom-20 right-4 z-40">
        <Link href="/add-item" className="glass-btn w-14 h-14 rounded-full flex items-center justify-center text-2xl">
          📷
        </Link>
      </div>
    </div>
  );
}
