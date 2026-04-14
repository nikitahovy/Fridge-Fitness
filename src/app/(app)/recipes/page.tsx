"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ScoredRecipe, Recipe } from "@/lib/types";
import { getRecipeImageUrl } from "@/lib/recipe-images";

const AI_RECIPES_STORAGE_KEY = "ff_ai_recipes";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<ScoredRecipe[]>([]);
  const [aiRecipes, setAiRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showAi, setShowAi] = useState(false);

  useEffect(() => {
    fetch("/api/recipes").then((r) => r.json()).then((data) => { setRecipes(data); setLoading(false); });
    try {
      const stored = localStorage.getItem(AI_RECIPES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) setAiRecipes(parsed);
      }
    } catch {}
  }, []);

  async function generateRecipes() {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-recipes");
      const data = await res.json();
      if (data.recipes?.length > 0) {
        setAiRecipes(data.recipes);
        setShowAi(true);
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

      {/* Toggle */}
      {aiRecipes.length > 0 && (
        <div className="flex gap-1 bg-card border border-card-border rounded-xl p-1 mb-5 md:mb-6 w-fit">
          <button onClick={() => setShowAi(false)}
            className={`font-pixel text-[9px] md:text-[10px] px-3 md:px-4 py-2 rounded-lg transition-all cursor-pointer ${!showAi ? "bg-white text-black font-bold" : "text-muted hover:text-foreground"}`}>
            RANKED
          </button>
          <button onClick={() => setShowAi(true)}
            className={`font-pixel text-[9px] md:text-[10px] px-3 md:px-4 py-2 rounded-lg transition-all cursor-pointer ${showAi ? "bg-white text-black font-bold" : "text-muted hover:text-foreground"}`}>
            AI ({aiRecipes.length})
          </button>
        </div>
      )}

      {/* Scored recipes */}
      {!showAi && (
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
                <div className="w-full h-32 md:hidden">
                  <img src={sr.recipe.imageUrl} alt={sr.recipe.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
              )}
              <div className="flex">
                {sr.recipe.imageUrl && (
                  <div className="hidden md:block w-36 flex-shrink-0">
                    <img src={sr.recipe.imageUrl} alt={sr.recipe.name} className="w-full h-full object-cover" loading="lazy" />
                  </div>
                )}
                <div className="flex-1 p-3.5 md:p-5 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2 md:mb-3">
                    <div className="min-w-0">
                      <h3 className="text-base md:text-xl font-bold leading-tight">{sr.recipe.name}</h3>
                      <div className="flex gap-1.5 md:gap-2 mt-1 flex-wrap">
                        {sr.recipe.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="font-pixel text-[8px] md:text-[9px] text-muted uppercase tracking-wider">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <span className="text-display text-lg md:text-2xl flex-shrink-0">{sr.score}<span className="text-[10px] md:text-sm font-normal text-muted">pts</span></span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 md:gap-2 mb-2 md:mb-3">
                    {sr.explanation.slice(0, 2).map((ex, i) => (
                      <span key={i} className="text-[10px] md:text-[11px] px-2 md:px-3 py-0.5 md:py-1 rounded-full border border-white/10 text-muted">{ex}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-3 md:gap-x-6 gap-y-0.5 font-pixel text-[9px] md:text-[10px] text-muted uppercase">
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
      {showAi && (
        <div className="space-y-3">
          {aiRecipes.map((recipe, idx) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="block rounded-2xl overflow-hidden bg-card border border-card-border hover:border-slate-400 hover:shadow-[0_0_15px_rgba(255,255,255,0.04)] transition-all duration-200"
            >
              {/* Mobile: image on top */}
              <div className="w-full h-32 md:hidden">
                <img src={getRecipeImageUrl(recipe.name, idx)} alt={recipe.name} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="flex">
                {/* Desktop: image on left */}
                <div className="hidden md:block w-36 flex-shrink-0">
                  <img src={getRecipeImageUrl(recipe.name, idx)} alt={recipe.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="flex-1 p-3.5 md:p-5 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1.5 md:mb-2">
                    <h3 className="text-base md:text-xl font-bold leading-tight">{recipe.name}</h3>
                    <span className="font-pixel text-[9px] md:text-[10px] text-safe uppercase flex-shrink-0">AI</span>
                  </div>
                  <div className="flex gap-1.5 md:gap-2 mb-2 md:mb-3 flex-wrap">
                    {recipe.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="font-pixel text-[8px] md:text-[9px] text-muted uppercase tracking-wider">{tag}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-3 md:gap-x-6 gap-y-0.5 font-pixel text-[9px] md:text-[10px] text-muted uppercase">
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
    </div>
  );
}
