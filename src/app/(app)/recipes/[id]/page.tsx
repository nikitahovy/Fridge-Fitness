"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ScoredRecipe, Recipe, ItemWithRisk, DailyRecoveryContext } from "@/lib/types";
import { scoreRecipe } from "@/lib/scoring";

const AI_RECIPES_STORAGE_KEY = "ff_ai_recipes";

export default function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [recipe, setRecipe] = useState<ScoredRecipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [cooking, setCooking] = useState(false);
  const [cooked, setCooked] = useState(false);

  useEffect(() => {
    // AI-generated recipes are persisted client-side in localStorage by
    // the recipes/page.tsx component. Look there first for ai-* IDs and
    // build a ScoredRecipe shape on the fly using the scoring engine.
    if (id.startsWith("ai-") || id.startsWith("mp-r-")) {
      (async () => {
        try {
          const stored = localStorage.getItem(AI_RECIPES_STORAGE_KEY);
          const aiRecipes: Recipe[] = stored ? JSON.parse(stored) : [];
          const raw = aiRecipes.find((r) => r.id === id);
          if (!raw) {
            setRecipe(null);
            setLoading(false);
            return;
          }
          // Fetch the live inventory + recovery context to score the recipe
          const [inventory, recovery]: [ItemWithRisk[], DailyRecoveryContext] = await Promise.all([
            fetch("/api/eat-first").then((r) => r.json()),
            fetch("/api/recovery").then((r) => r.json()),
          ]);
          setRecipe(scoreRecipe(raw, inventory, recovery));
        } catch {
          setRecipe(null);
        }
        setLoading(false);
      })();
      return;
    }

    // Seed/scored recipes come from /api/recipes
    fetch("/api/recipes").then((r) => r.json()).then((recipes: ScoredRecipe[]) => {
      setRecipe(recipes.find((r) => r.recipe.id === id) || null);
      setLoading(false);
    });
  }, [id]);

  async function handleCookNow() {
    if (!recipe) return;
    setCooking(true);
    for (const item of recipe.matchedItems) {
      await fetch("/api/inventory", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, status: "consumed" }) });
    }
    setCooking(false);
    setCooked(true);
  }

  if (loading) return <div className="max-w-3xl mx-auto py-20"><p className="font-pixel text-muted text-sm">LOADING...</p></div>;
  if (!recipe) return <div className="max-w-3xl mx-auto py-20"><p className="text-display text-2xl">Not found</p><Link href="/recipes" className="font-pixel text-xs text-muted mt-4 inline-block">← BACK</Link></div>;

  const { recipe: r, matchedItems, atRiskItemsRescued, missingIngredients, wasteRescueValue, score, explanation } = recipe;

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/recipes" className="font-pixel text-[10px] text-muted uppercase tracking-wider hover:text-foreground transition mb-6 inline-block">
        ← BACK TO RECIPES
      </Link>

      {/* Header */}
      <div className="glass rounded-2xl overflow-hidden mb-6">
        {r.imageUrl && (
          <div className="w-full h-48 md:h-64">
            <img
              src={r.imageUrl}
              alt={r.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-7">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex gap-2 mb-3">
              {r.tags.map((tag) => (
                <span key={tag} className="font-pixel text-[9px] text-muted uppercase tracking-wider">{tag}</span>
              ))}
            </div>
            <h2 className="text-display text-4xl">{r.name}</h2>
          </div>
          <div className="text-right">
            <p className="text-display text-3xl">{score}</p>
            <p className="font-pixel text-[9px] text-muted uppercase">MATCH</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {explanation.map((ex, i) => (
            <span key={i} className="text-[11px] px-3 py-1 rounded-full border border-white/10 text-muted">{ex}</span>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div><p className="text-display text-2xl">{r.macros.protein}<span className="text-sm text-muted">g</span></p><p className="font-pixel text-[9px] text-muted uppercase mt-0.5">Protein</p></div>
          <div><p className="text-display text-2xl">{r.macros.carbs}<span className="text-sm text-muted">g</span></p><p className="font-pixel text-[9px] text-muted uppercase mt-0.5">Carbs</p></div>
          <div><p className="text-display text-2xl">{r.macros.fat}<span className="text-sm text-muted">g</span></p><p className="font-pixel text-[9px] text-muted uppercase mt-0.5">Fat</p></div>
          <div><p className="text-display text-2xl">{r.cookTimeMinutes}<span className="text-sm text-muted">m</span></p><p className="font-pixel text-[9px] text-muted uppercase mt-0.5">Cook Time</p></div>
        </div>

        {wasteRescueValue > 0 && (
          <div className="mt-5 pt-4 border-t border-white/10">
            <p className="text-sm text-muted">Saves <span className="font-bold text-danger">${wasteRescueValue.toFixed(2)}</span> in expiring ingredients</p>
          </div>
        )}
        </div>
      </div>

      {/* Cook Now */}
      {cooked ? (
        <div className="bg-safe/5 border border-safe/20 rounded-2xl p-5 mb-6 text-center">
          <p className="font-bold mb-3">{matchedItems.length} ingredient{matchedItems.length !== 1 ? "s" : ""} marked as used</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.push("/")} className="btn btn-primary btn-lg">Dashboard</button>
            <button onClick={() => router.push("/recipes")} className="btn btn-lg">More Recipes</button>
          </div>
        </div>
      ) : (
        <button onClick={handleCookNow} disabled={cooking}
          className="btn btn-primary btn-lg w-full !py-4 !text-sm mb-6 disabled:opacity-50">
          {cooking ? "LOGGING MEAL..." : `COOK NOW — USE ${matchedItems.length} INGREDIENT${matchedItems.length !== 1 ? "S" : ""}`}
        </button>
      )}

      {/* Ingredients */}
      <div className="bg-card border border-card-border rounded-2xl p-6 mb-6">
        <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-4">// INGREDIENTS</p>
        <div className="space-y-2">
          {r.ingredients.map((ing) => {
            const isOwned = matchedItems.some((m) => m.name.toLowerCase().includes(ing.normalizedName) || ing.normalizedName.includes(m.name.toLowerCase()));
            const isAtRisk = atRiskItemsRescued.some((m) => m.name.toLowerCase().includes(ing.normalizedName) || ing.normalizedName.includes(m.name.toLowerCase()));
            const isMissing = missingIngredients.some((m) => m.name === ing.name);
            return (
              <div key={ing.name} className="flex items-center gap-3 py-1">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isAtRisk ? "bg-[#ff6b6b]" : isOwned ? "bg-safe" : "bg-[#d0ccc6]"}`} />
                <span className={`text-sm ${isMissing ? "text-muted" : "font-medium"}`}>{ing.amount} {ing.name}</span>
                {ing.optional && <span className="font-pixel text-[9px] text-muted">OPT</span>}
                <span className="ml-auto">
                  {isAtRisk && <span className="font-pixel text-[9px] text-danger uppercase">EXPIRING</span>}
                  {isOwned && !isAtRisk && <span className="font-pixel text-[9px] text-safe uppercase">IN STOCK</span>}
                  {isMissing && <span className="font-pixel text-[9px] text-muted uppercase">MISSING</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Steps */}
      <div className="bg-card border border-card-border rounded-2xl p-6">
        <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-4">// INSTRUCTIONS</p>
        <ol className="space-y-4">
          {r.steps.map((step, i) => (
            <li key={i} className="flex gap-4">
              <span className="font-pixel text-xs text-muted w-6 flex-shrink-0 pt-0.5">{String(i + 1).padStart(2, "0")}</span>
              <p className="text-sm leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
