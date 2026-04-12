"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ScoredRecipe, Recipe } from "@/lib/types";

const AI_RECIPES_STORAGE_KEY = "ff_ai_recipes";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<ScoredRecipe[]>([]);
  const [aiRecipes, setAiRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showAi, setShowAi] = useState(false);

  useEffect(() => {
    fetch("/api/recipes").then((r) => r.json()).then((data) => { setRecipes(data); setLoading(false); });
    // Restore AI recipes from previous session so the user can re-open
    // their generated recipes after navigating away and back.
    try {
      const stored = localStorage.getItem(AI_RECIPES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAiRecipes(parsed);
        }
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
        // Persist so the detail page (and re-visits) can find them
        try {
          localStorage.setItem(AI_RECIPES_STORAGE_KEY, JSON.stringify(data.recipes));
        } catch {}
      }
    } catch { /* ignore */ }
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
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-2">// RECIPES</p>
          <h2 className="text-display text-4xl">Cook<br/>Something</h2>
        </div>
        <button
          onClick={generateRecipes}
          disabled={generating}
          className="btn btn-primary btn-lg disabled:opacity-50"
        >
          {generating ? "GENERATING..." : "AI GENERATE →"}
        </button>
      </div>

      {/* Toggle between scored and AI raw */}
      {aiRecipes.length > 0 && (
        <div className="flex gap-1 bg-card border border-card-border rounded-xl p-1 mb-6 w-fit">
          <button onClick={() => setShowAi(false)}
            className={`font-pixel text-[10px] px-4 py-2 rounded-lg transition-all cursor-pointer ${!showAi ? "bg-white text-black font-bold" : "text-muted hover:text-foreground"}`}>
            RANKED
          </button>
          <button onClick={() => setShowAi(true)}
            className={`font-pixel text-[10px] px-4 py-2 rounded-lg transition-all cursor-pointer ${showAi ? "bg-white text-black font-bold" : "text-muted hover:text-foreground"}`}>
            AI GENERATED ({aiRecipes.length})
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
              className={`block rounded-2xl p-5 transition-all duration-200 group ${
                idx === 0
                  ? "risk-safe"
                  : "bg-card border border-card-border hover:border-slate-400 hover:shadow-[0_0_15px_rgba(255,255,255,0.04)]"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-xl font-bold">{sr.recipe.name}</h3>
                  <div className="flex gap-2 mt-1.5">
                    {sr.recipe.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="font-pixel text-[9px] text-muted uppercase tracking-wider">{tag}</span>
                    ))}
                  </div>
                </div>
                <span className="text-display text-2xl">{sr.score}<span className="text-sm font-normal text-muted">pts</span></span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {sr.explanation.map((ex, i) => (
                  <span key={i} className="text-[11px] px-3 py-1 rounded-full border border-white/10 text-muted group-hover:border-slate-300">{ex}</span>
                ))}
              </div>
              <div className="flex gap-6 font-pixel text-[10px] text-muted uppercase">
                <span>{sr.recipe.cookTimeMinutes}m</span>
                <span>{sr.recipe.macros.protein}g protein</span>
                <span>{sr.recipe.macros.carbs}g carbs</span>
                <span>{sr.matchedItems.length}/{sr.recipe.ingredients.length} owned</span>
                {sr.wasteRescueValue > 0 && <span className="text-danger">saves ${sr.wasteRescueValue.toFixed(2)}</span>}
              </div>
              {(sr.atRiskItemsRescued.length > 0 || sr.missingIngredients.length > 0) && (
                <div className="mt-3 flex gap-4">
                  {sr.atRiskItemsRescued.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {sr.atRiskItemsRescued.map((item) => (
                        <span key={item.id} className="text-[10px] font-bold px-2 py-0.5 rounded bg-danger/10 text-danger">{item.name}</span>
                      ))}
                    </div>
                  )}
                  {sr.missingIngredients.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {sr.missingIngredients.map((ing) => (
                        <span key={ing.name} className="text-[10px] px-2 py-0.5 rounded bg-white/75 text-muted">{ing.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* AI generated recipes (unscored, raw from LLM) */}
      {showAi && (
        <div className="space-y-3">
          {aiRecipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipes/${recipe.id}`}
              className="block rounded-2xl p-5 bg-card border border-card-border hover:border-slate-400 hover:shadow-[0_0_15px_rgba(255,255,255,0.04)] transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-bold">{recipe.name}</h3>
                <span className="font-pixel text-[10px] text-safe uppercase">AI</span>
              </div>
              <div className="flex gap-2 mb-3">
                {recipe.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="font-pixel text-[9px] text-muted uppercase tracking-wider">{tag}</span>
                ))}
              </div>
              <div className="flex gap-6 font-pixel text-[10px] text-muted uppercase">
                <span>{recipe.cookTimeMinutes}m</span>
                <span>{recipe.macros.protein}g protein</span>
                <span>{recipe.macros.carbs}g carbs</span>
                <span>{recipe.ingredients.length} ingredients</span>
                <span className="capitalize">{recipe.difficulty}</span>
              </div>
              <div className="mt-2 flex gap-1 flex-wrap">
                {recipe.ingredients.slice(0, 6).map((ing) => (
                  <span key={ing.name} className="text-[10px] px-2 py-0.5 rounded bg-white/75 text-muted">{ing.name}</span>
                ))}
                {recipe.ingredients.length > 6 && (
                  <span className="text-[10px] px-2 py-0.5 text-muted">+{recipe.ingredients.length - 6} more</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
