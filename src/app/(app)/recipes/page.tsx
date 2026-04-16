"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ScoredRecipe, Recipe } from "@/lib/types";
import { getRecipeImageUrl, proxyImageUrl } from "@/lib/recipe-images";

const AI_RECIPES_STORAGE_KEY = "ff_ai_recipes";
const FAVORITES_KEY = "ff_favorite_recipes";

type Tab = "ranked" | "ai" | "favorites";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<ScoredRecipe[]>([]);
  const [aiRecipes, setAiRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [tab, setTab] = useState<Tab>("ranked");

  useEffect(() => {
    fetch("/api/recipes").then((r) => r.json()).then((data) => { setRecipes(data); setLoading(false); });
    try {
      const stored = localStorage.getItem(AI_RECIPES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) setAiRecipes(parsed);
      }
    } catch {}
    try {
      const fav = localStorage.getItem(FAVORITES_KEY);
      if (fav) {
        const parsed = JSON.parse(fav);
        if (Array.isArray(parsed)) setFavorites(parsed);
      }
    } catch {}
  }, []);

  function isFavorite(id: string) {
    return favorites.some((f) => f.id === id);
  }

  function toggleFavorite(e: React.MouseEvent, recipe: Recipe) {
    e.preventDefault();
    e.stopPropagation();
    const updated = isFavorite(recipe.id)
      ? favorites.filter((f) => f.id !== recipe.id)
      : [...favorites, recipe];
    setFavorites(updated);
    try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated)); } catch {}
  }

  async function generateRecipes() {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-recipes");
      const data = await res.json();
      if (data.recipes?.length > 0) {
        setAiRecipes(data.recipes);
        setTab("ai");
        try { localStorage.setItem(AI_RECIPES_STORAGE_KEY, JSON.stringify(data.recipes)); } catch {}
      }
    } catch {}
    setGenerating(false);
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8"><div className="animate-pulse bg-slate-300/60 rounded-lg w-24 h-3 mb-3" /><div className="animate-pulse bg-slate-300/60 rounded-lg w-40 h-10" /></div>
        <div className="space-y-3">{[1,2,3,4].map((i) => <div key={i} className="animate-pulse bg-slate-300/60 rounded-2xl h-36" />)}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-6 md:mb-8 gap-3">
        <div>
          <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-2">// RECIPES</p>
          <h2 className="text-display text-3xl md:text-4xl">Cook<br/>Something</h2>
        </div>
        <button
          onClick={generateRecipes}
          disabled={generating}
          className="btn btn-primary !text-[9px] md:!text-xs !px-3 md:btn-lg disabled:opacity-50 flex-shrink-0"
        >
          {generating ? "GENERATING..." : "AI GENERATE"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-card-border rounded-xl p-1 mb-5 md:mb-6 w-fit overflow-x-auto">
        {([
          { key: "ranked" as Tab, label: "RANKED" },
          ...(aiRecipes.length > 0 ? [{ key: "ai" as Tab, label: `AI (${aiRecipes.length})` }] : []),
          ...(favorites.length > 0 ? [{ key: "favorites" as Tab, label: `FAVS (${favorites.length})` }] : []),
        ]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`font-pixel text-[9px] md:text-[10px] px-3 md:px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${tab === t.key ? "bg-white text-black font-bold" : "text-muted hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Scored recipes */}
      {tab === "ranked" && (
        <div className="space-y-3">
          {recipes.map((sr, idx) => (
            <Link
              key={sr.recipe.id}
              href={`/recipes/${sr.recipe.id}`}
              className={`block rounded-2xl overflow-hidden transition-all duration-200 group ${
                idx === 0
                  ? "risk-safe"
                  : "bg-card border border-card-border hover:border-slate-400 hover:shadow-[0_0_15px_rgba(255,255,255,0.04)]"
              }`}
            >
              {/* Mobile: image on top. Desktop: image on left */}
              {sr.recipe.imageUrl && (
                <div className="w-full h-32 lg:hidden">
                  <img src={proxyImageUrl(sr.recipe.imageUrl)} alt={sr.recipe.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
              )}
              <div className="flex">
                {sr.recipe.imageUrl && (
                  <div className="hidden lg:block w-36 flex-shrink-0">
                    <img src={proxyImageUrl(sr.recipe.imageUrl)} alt={sr.recipe.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                )}
                <div className="flex-1 p-3.5 lg:p-5 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2 md:mb-3">
                    <div className="min-w-0">
                      <h3 className="text-base lg:text-xl font-bold leading-tight">{sr.recipe.name}</h3>
                      <div className="flex gap-1.5 md:gap-2 mt-1 flex-wrap">
                        {sr.recipe.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="font-pixel text-[8px] md:text-[9px] text-muted uppercase tracking-wider">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={(e) => toggleFavorite(e, sr.recipe)} className="text-muted hover:text-rose-500 transition-colors">
                        <Heart className={`w-4 h-4 ${isFavorite(sr.recipe.id) ? "fill-rose-500 text-rose-500" : ""}`} />
                      </button>
                      <span className="text-display text-lg lg:text-2xl">{sr.score}<span className="text-[10px] md:text-sm font-normal text-muted">pts</span></span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 md:gap-2 mb-2 md:mb-3">
                    {sr.explanation.slice(0, 2).map((ex, i) => (
                      <span key={i} className="text-[10px] md:text-[11px] px-2 md:px-3 py-0.5 md:py-1 rounded-full border border-white/10 text-muted">{ex}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-3 lg:gap-x-6 gap-y-0.5 font-pixel text-[9px] md:text-[10px] text-muted uppercase">
                    <span>{sr.recipe.cookTimeMinutes}m</span>
                    <span>{sr.recipe.macros.protein}g pro</span>
                    <span>{sr.recipe.macros.carbs}g carb</span>
                    <span>{sr.matchedItems.length}/{sr.recipe.ingredients.length} owned</span>
                    {sr.wasteRescueValue > 0 && <span className="text-danger">saves ${sr.wasteRescueValue.toFixed(0)}</span>}
                  </div>
                  {(sr.atRiskItemsRescued.length > 0 || sr.missingIngredients.length > 0) && (
                    <div className="mt-2 md:mt-3 flex gap-2 md:gap-4 flex-wrap">
                      {sr.atRiskItemsRescued.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {sr.atRiskItemsRescued.slice(0, 3).map((item) => (
                            <span key={item.id} className="text-[9px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded bg-danger/10 text-danger">{item.name}</span>
                          ))}
                        </div>
                      )}
                      {sr.missingIngredients.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {sr.missingIngredients.slice(0, 3).map((ing) => (
                            <span key={ing.name} className="text-[9px] md:text-[10px] px-1.5 md:px-2 py-0.5 rounded bg-white/75 text-muted">{ing.name}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* AI generated recipes */}
      {tab === "ai" && (
        <div className="space-y-3">
          {aiRecipes.map((recipe, idx) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="block rounded-2xl overflow-hidden bg-card border border-card-border hover:border-slate-400 hover:shadow-[0_0_15px_rgba(255,255,255,0.04)] transition-all duration-200"
            >
              {/* Mobile: image on top */}
              <div className="w-full h-32 lg:hidden">
                <img src={getRecipeImageUrl(recipe.name, idx)} alt={recipe.name} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="flex">
                {/* Desktop: image on left */}
                <div className="hidden lg:block w-36 flex-shrink-0">
                  <img src={getRecipeImageUrl(recipe.name, idx)} alt={recipe.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="flex-1 p-3.5 lg:p-5 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1.5 md:mb-2">
                    <h3 className="text-base lg:text-xl font-bold leading-tight">{recipe.name}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={(e) => toggleFavorite(e, recipe)} className="text-muted hover:text-rose-500 transition-colors">
                        <Heart className={`w-4 h-4 ${isFavorite(recipe.id) ? "fill-rose-500 text-rose-500" : ""}`} />
                      </button>
                      <span className="font-pixel text-[9px] md:text-[10px] text-safe uppercase">AI</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5 md:gap-2 mb-2 md:mb-3 flex-wrap">
                    {recipe.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="font-pixel text-[8px] md:text-[9px] text-muted uppercase tracking-wider">{tag}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-3 lg:gap-x-6 gap-y-0.5 font-pixel text-[9px] md:text-[10px] text-muted uppercase">
                    <span>{recipe.cookTimeMinutes}m</span>
                    <span>{recipe.macros.protein}g pro</span>
                    <span>{recipe.macros.carbs}g carb</span>
                    <span>{recipe.ingredients.length} ing</span>
                    <span className="capitalize">{recipe.difficulty}</span>
                  </div>
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {recipe.ingredients.slice(0, 4).map((ing) => (
                      <span key={ing.name} className="text-[9px] md:text-[10px] px-1.5 md:px-2 py-0.5 rounded bg-white/75 text-muted">{ing.name}</span>
                    ))}
                    {recipe.ingredients.length > 4 && (
                      <span className="text-[9px] md:text-[10px] px-1.5 py-0.5 text-muted">+{recipe.ingredients.length - 4}</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Favorites */}
      {tab === "favorites" && (
        <div className="space-y-3">
          {favorites.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted mb-2">No favorites yet</p>
              <p className="text-xs text-muted">Tap the heart on any recipe to save it here.</p>
            </div>
          ) : (
            favorites.map((recipe, idx) => (
              <Link
                key={recipe.id}
                href={`/recipes/${recipe.id}`}
                className="block rounded-2xl overflow-hidden bg-card border border-card-border hover:border-slate-400 transition-all duration-200"
              >
                <div className="w-full h-32 lg:hidden">
                  <img src={recipe.imageUrl ? proxyImageUrl(recipe.imageUrl) : getRecipeImageUrl(recipe.name, idx)} alt={recipe.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="flex">
                  <div className="hidden lg:block w-36 flex-shrink-0">
                    <img src={recipe.imageUrl ? proxyImageUrl(recipe.imageUrl) : getRecipeImageUrl(recipe.name, idx)} alt={recipe.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                  <div className="flex-1 p-3.5 lg:p-5 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-base lg:text-xl font-bold leading-tight">{recipe.name}</h3>
                      <button onClick={(e) => toggleFavorite(e, recipe)} className="text-rose-500 flex-shrink-0">
                        <Heart className="w-4 h-4 fill-rose-500" />
                      </button>
                    </div>
                    <div className="flex gap-1.5 mb-2 flex-wrap">
                      {recipe.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="font-pixel text-[8px] md:text-[9px] text-muted uppercase tracking-wider">{tag}</span>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-pixel text-[9px] md:text-[10px] text-muted uppercase">
                      <span>{recipe.cookTimeMinutes}m</span>
                      <span>{recipe.macros.protein}g pro</span>
                      <span>{recipe.macros.carbs}g carb</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
