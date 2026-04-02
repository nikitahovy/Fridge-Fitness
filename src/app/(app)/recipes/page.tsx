"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ScoredRecipe } from "@/lib/types";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<ScoredRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/recipes").then((r) => r.json()).then((data) => { setRecipes(data); setLoading(false); });
  }, []);

  if (loading) return <div className="max-w-4xl mx-auto py-20"><p className="font-pixel text-muted text-sm">LOADING...</p></div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-2">// RECIPES</p>
        <h2 className="text-display text-4xl">Cook<br/>Something</h2>
      </div>

      <div className="space-y-3">
        {recipes.map((sr, idx) => (
          <Link
            key={sr.recipe.id}
            href={`/recipes/${sr.recipe.id}`}
            className={`block rounded-2xl p-5 border transition-all duration-200 group ${
              idx === 0
                ? "bg-gradient-to-r from-emerald-950/60 to-emerald-900/20 border-emerald-500/20 hover:border-emerald-400/40"
                : "bg-card border-card-border hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.04)]"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-xl font-bold">{sr.recipe.name}</h3>
                <div className="flex gap-2 mt-1.5">
                  {sr.recipe.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className={`font-pixel text-[9px] uppercase tracking-wider ${
                      "text-muted"
                    }`}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <span className="text-display text-2xl">{sr.score}<span className={`text-sm font-normal ${"text-muted"}`}>pts</span></span>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {sr.explanation.map((ex, i) => (
                <span key={i} className={`text-[11px] px-3 py-1 rounded-full border ${
                  "border-white/10 text-muted group-hover:border-white/20"
                }`}>
                  {ex}
                </span>
              ))}
            </div>

            <div className={`flex gap-6 font-pixel text-[10px] uppercase ${
              "text-muted"
            }`}>
              <span>{sr.recipe.cookTimeMinutes}m</span>
              <span>{sr.recipe.macros.protein}g protein</span>
              <span>{sr.recipe.macros.carbs}g carbs</span>
              <span>{sr.matchedItems.length}/{sr.recipe.ingredients.length} owned</span>
              {sr.wasteRescueValue > 0 && (
                <span className={"text-danger"}>
                  saves ${sr.wasteRescueValue.toFixed(2)}
                </span>
              )}
            </div>

            {(sr.atRiskItemsRescued.length > 0 || sr.missingIngredients.length > 0) && (
              <div className="mt-3 flex gap-4">
                {sr.atRiskItemsRescued.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {sr.atRiskItemsRescued.map((item) => (
                      <span key={item.id} className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        "bg-danger/10 text-danger"
                      }`}>
                        {item.name}
                      </span>
                    ))}
                  </div>
                )}
                {sr.missingIngredients.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {sr.missingIngredients.map((ing) => (
                      <span key={ing.name} className={`text-[10px] px-2 py-0.5 rounded ${
                        "bg-white/[0.06] text-muted"
                      }`}>
                        {ing.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
