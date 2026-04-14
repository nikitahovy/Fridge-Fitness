"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ScoredRecipe, Recipe, ItemWithRisk, DailyRecoveryContext } from "@/lib/types";
import { scoreRecipe } from "@/lib/scoring";
import { getRecipeImageUrl } from "@/lib/recipe-images";
import FridgeMascot from "@/components/mascot/FridgeMascot";

const AI_RECIPES_STORAGE_KEY = "ff_ai_recipes";
const MEAL_PLAN_STORAGE_KEY = "ff_meal_plan";

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
          // Look in AI recipes storage
          const stored = localStorage.getItem(AI_RECIPES_STORAGE_KEY);
          const aiRecipes: Recipe[] = stored ? JSON.parse(stored) : [];
          let raw = aiRecipes.find((r) => r.id === id);

          // Also check meal plan storage for mp-r-* recipes
          if (!raw) {
            const mpStored = localStorage.getItem(MEAL_PLAN_STORAGE_KEY);
            if (mpStored) {
              const meals = JSON.parse(mpStored);
              if (Array.isArray(meals)) {
                const meal = meals.find((m: { recipe?: { id?: string } }) => m.recipe?.id === id);
                if (meal?.recipe) raw = meal.recipe;
              }
            }
          }

          if (!raw) {
            setRecipe(null);
            setLoading(false);
            return;
          }

          // Fetch the live inventory + recovery context to score the recipe
          const [inventory, recoveryData] = await Promise.all([
            fetch("/api/eat-first").then((r) => r.json()),
            fetch("/api/recovery").then((r) => r.json()),
          ]);
          const recovery: DailyRecoveryContext = recoveryData.context || recoveryData;
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

  // Categories where a recipe typically uses only a portion (keep in inventory)
  const PARTIAL_USE_CATEGORIES = new Set(["condiment", "beverage", "grain"]);
  // Ingredient amount keywords that indicate partial use
  const PARTIAL_KEYWORDS = /\b(tbsp|tsp|tablespoon|teaspoon|pinch|dash|drizzle|splash|clove|slice|cup|oz(?!\s*can)|ml)\b/i;

  function isPartialUse(item: ItemWithRisk): boolean {
    // Condiments, sauces, oils, grains are almost always partially used
    if (PARTIAL_USE_CATEGORIES.has(item.category)) return true;

    // Check if the recipe calls for a small amount of this item
    const recipeIng = r.ingredients.find((ing) =>
      item.name.toLowerCase().includes(ing.normalizedName) ||
      ing.normalizedName.includes(item.name.toLowerCase())
    );
    if (recipeIng && PARTIAL_KEYWORDS.test(recipeIng.amount)) return true;

    return false;
  }

  async function handleCookNow() {
    if (!recipe) return;
    setCooking(true);
    for (const item of recipe.matchedItems) {
      if (isPartialUse(item)) {
        // Mark as opened (started using) but keep in inventory
        if (!item.openedAt) {
          await fetch("/api/inventory", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, openedAt: new Date().toISOString().split("T")[0] }) });
        }
        // else already opened — no change needed
      } else {
        // Fully consumed (e.g. whole chicken breast, bag of spinach)
        await fetch("/api/inventory", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, status: "consumed" }) });
      }
    }
    setCooking(false);
    setCooked(true);
  }

  if (loading) return <div className="max-w-3xl mx-auto py-20"><p className="font-pixel text-muted text-sm">LOADING...</p></div>;
  if (!recipe) return (
    <div className="max-w-3xl mx-auto py-20 text-center flex flex-col items-center">
      <div className="bg-card border border-card-border rounded-xl px-3 py-1.5 mb-2 text-xs text-muted">Where&apos;d it go?</div>
      <div className="mb-4 text-slate-400 dark:text-slate-500"><FridgeMascot size={40} /></div>
      <p className="text-display text-2xl mb-3">Not found</p>
      <Link href="/recipes" className="font-pixel text-xs text-muted hover:text-foreground uppercase tracking-wider underline underline-offset-4">← BACK TO RECIPES</Link>
    </div>
  );

  const { recipe: r, matchedItems, atRiskItemsRescued, missingIngredients, wasteRescueValue, score, explanation } = recipe;
  const isAiRecipe = r.id.startsWith("ai-") || r.id.startsWith("mp-r-");
  const heroImage = isAiRecipe ? getRecipeImageUrl(r.name, 0) : (r.imageUrl || getRecipeImageUrl(r.name, 0));

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/recipes" className="font-pixel text-[10px] text-muted uppercase tracking-wider hover:text-foreground transition mb-6 inline-block">
        ← BACK TO RECIPES
      </Link>

      {/* Header */}
      <div className="glass rounded-2xl overflow-hidden mb-6">
        <div className="w-full h-48 md:h-64">
          <img
            src={heroImage}
            alt={r.name}
            className="w-full h-full object-cover"
          />
        </div>
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
          <div className="mx-auto mb-3 text-emerald-500"><FridgeMascot size={40} running className="fridge-bob" /></div>
          <p className="font-bold mb-3">
            {matchedItems.filter((i) => !isPartialUse(i)).length} used up, {matchedItems.filter((i) => isPartialUse(i)).length} partially used
          </p>
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
