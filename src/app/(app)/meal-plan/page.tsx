"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PlannedMeal, MealSlot, ItemWithRisk, Recipe } from "@/lib/types";
import { getRecipeImageUrl } from "@/lib/recipe-images";

const STORAGE_KEY = "ff_meal_plan";
const AI_RECIPES_KEY = "ff_ai_recipes";
const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];
const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

function getWeekDates(): string[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

function formatDay(iso: string): { short: string; date: string; isToday: boolean } {
  const d = new Date(iso + "T12:00:00");
  const today = new Date();
  const isToday = iso === today.toISOString().split("T")[0];
  return {
    short: d.toLocaleDateString("en-US", { weekday: "short" }),
    date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    isToday,
  };
}

export default function MealPlanPage() {
  const [meals, setMeals] = useState<PlannedMeal[]>([]);
  const [inventory, setInventory] = useState<ItemWithRisk[]>([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  const weekDates = getWeekDates();

  const loadData = useCallback(async () => {
    // Load saved plan from localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setMeals(parsed);
      }
    } catch {}

    // Load inventory for coverage check
    try {
      const inv = await fetch("/api/eat-first").then((r) => r.json());
      if (Array.isArray(inv)) setInventory(inv);
    } catch {}

    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function saveMeals(updated: PlannedMeal[]) {
    setMeals(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      // Persist recipes to ff_ai_recipes so /recipes/[id] detail page works.
      // Replace any existing recipes with the same ID (stale from previous generation).
      const existing: Recipe[] = JSON.parse(localStorage.getItem(AI_RECIPES_KEY) || "[]");
      const newRecipeMap = new Map(updated.map((m) => [m.recipe.id, m.recipe]));
      const filtered = existing.filter((r) => !newRecipeMap.has(r.id));
      localStorage.setItem(AI_RECIPES_KEY, JSON.stringify([...filtered, ...newRecipeMap.values()]));
    } catch {}
  }

  async function generatePlan() {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-meal-plan");
      const data = await res.json();
      if (data.meals?.length > 0) {
        saveMeals(data.meals);
      }
    } catch {}
    setGenerating(false);
  }

  function removeMeal(id: string) {
    saveMeals(meals.filter((m) => m.id !== id));
  }

  function clearPlan() {
    saveMeals([]);
  }

  // Coverage calculation
  const totalSlots = weekDates.length * SLOTS.length;
  const filledSlots = meals.length;
  const allIngredients = meals.flatMap((m) => m.recipe.ingredients);
  const ownedNames = new Set(inventory.map((i) => i.name.toLowerCase()));
  const matchedCount = allIngredients.filter(
    (ing) => ownedNames.has(ing.normalizedName) || [...ownedNames].some(
      (n) => n.includes(ing.normalizedName) || ing.normalizedName.includes(n)
    )
  ).length;
  const missingIngredients = allIngredients.filter(
    (ing) => !ownedNames.has(ing.normalizedName) && ![...ownedNames].some(
      (n) => n.includes(ing.normalizedName) || ing.normalizedName.includes(n)
    )
  );
  // Deduplicate missing ingredients by name
  const uniqueMissing = [...new Map(missingIngredients.map((i) => [i.normalizedName, i])).values()];

  // Daily macros
  function getDayMacros(day: string) {
    const dayMeals = meals.filter((m) => m.day === day);
    return {
      protein: dayMeals.reduce((s, m) => s + (m.recipe.macros?.protein || 0), 0),
      carbs: dayMeals.reduce((s, m) => s + (m.recipe.macros?.carbs || 0), 0),
      fat: dayMeals.reduce((s, m) => s + (m.recipe.macros?.fat || 0), 0),
    };
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-8"><div className="animate-pulse bg-slate-300/60 rounded-lg w-24 h-3 mb-3" /><div className="animate-pulse bg-slate-300/60 rounded-lg w-48 h-10" /></div>
        <div className="space-y-4">{[1,2,3].map((i) => <div key={i} className="animate-pulse bg-slate-300/60 rounded-2xl h-48" />)}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-6 md:mb-8">
        <div>
          <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-2">// MEAL PLAN</p>
          <h2 className="text-display text-3xl md:text-4xl">This<br/>Week</h2>
        </div>
        <div className="flex gap-2">
          {meals.length > 0 && (
            <button onClick={clearPlan} className="btn !text-[10px]">CLEAR</button>
          )}
          <button
            onClick={generatePlan}
            disabled={generating}
            className="btn btn-primary btn-lg disabled:opacity-50"
          >
            {generating ? "GENERATING..." : "AI PLAN"}
          </button>
        </div>
      </div>

      {/* Coverage summary */}
      {meals.length > 0 && (
        <div className="glass rounded-2xl p-4 md:p-5 mb-6 flex flex-wrap gap-x-6 gap-y-2 items-center">
          <div>
            <span className="text-display text-2xl">{filledSlots}</span>
            <span className="text-sm text-muted">/{totalSlots} meals</span>
          </div>
          <div>
            <span className="text-display text-2xl text-safe">{matchedCount}</span>
            <span className="text-sm text-muted">/{allIngredients.length} ingredients owned</span>
          </div>
          {uniqueMissing.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              <span className="font-pixel text-[9px] text-muted uppercase mr-1">NEED:</span>
              {uniqueMissing.slice(0, 8).map((ing) => (
                <span key={ing.normalizedName} className="text-[10px] px-2 py-0.5 rounded bg-white/75 dark:bg-neutral-800 text-muted">{ing.name}</span>
              ))}
              {uniqueMissing.length > 8 && (
                <span className="text-[10px] px-2 py-0.5 text-muted">+{uniqueMissing.length - 8} more</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {meals.length === 0 && (
        <div className="glass rounded-2xl p-8 md:p-12 text-center">
          <p className="text-display text-2xl mb-3">No Meal Plan Yet</p>
          <p className="text-sm text-muted mb-6 max-w-md mx-auto">
            Generate an AI-powered weekly meal plan based on what&apos;s in your fridge.
            It prioritizes expiring items first so nothing goes to waste.
          </p>
          <button
            onClick={generatePlan}
            disabled={generating}
            className="btn btn-primary btn-lg disabled:opacity-50"
          >
            {generating ? "GENERATING..." : "GENERATE MEAL PLAN"}
          </button>
        </div>
      )}

      {/* 7-day plan — vertical layout */}
      {meals.length > 0 && (
        <div className="space-y-4">
          {weekDates.map((date) => {
            const dayInfo = formatDay(date);
            const dayMeals = meals.filter((m) => m.day === date);
            const macros = getDayMacros(date);

            if (dayMeals.length === 0) return null;

            return (
              <div key={date} className={`glass rounded-2xl overflow-hidden ${dayInfo.isToday ? "ring-2 ring-sky-400/50" : ""}`}>
                {/* Day header */}
                <div className="px-4 md:px-5 pt-4 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-display text-lg">{dayInfo.short}</span>
                    <span className="font-pixel text-[9px] text-muted uppercase">{dayInfo.date}</span>
                    {dayInfo.isToday && (
                      <span className="font-pixel text-[8px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-500 border border-sky-500/20">TODAY</span>
                    )}
                  </div>
                  <div className="flex gap-3 font-pixel text-[9px] text-muted">
                    <span>{macros.protein}g pro</span>
                    <span>{macros.carbs}g carb</span>
                    <span>{macros.fat}g fat</span>
                  </div>
                </div>

                {/* Meals grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-card-border/30">
                  {SLOTS.map((slot) => {
                    const meal = dayMeals.find((m) => m.slot === slot);
                    return (
                      <div key={slot} className="bg-card/50 p-3">
                        <p className="font-pixel text-[8px] text-muted uppercase tracking-wider mb-2">{SLOT_LABELS[slot]}</p>
                        {meal ? (
                          <div className="group">
                            <Link href={`/recipes/${meal.recipe.id}`} className="flex gap-2 hover:opacity-80 transition-opacity">
                              <img
                                src={getRecipeImageUrl(meal.recipe.name, parseInt(meal.id.replace("mp-", "")) || 0)}
                                alt={meal.recipe.name}
                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                                loading="lazy"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate">{meal.recipe.name}</p>
                                <div className="flex gap-2 font-pixel text-[8px] text-muted mt-0.5">
                                  <span>{meal.recipe.cookTimeMinutes}m</span>
                                  <span>{meal.recipe.macros?.protein || 0}g pro</span>
                                </div>
                              </div>
                            </Link>
                            <button
                              onClick={() => removeMeal(meal.id)}
                              className="font-pixel text-[8px] text-muted hover:text-danger mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              REMOVE
                            </button>
                          </div>
                        ) : (
                          <p className="text-[10px] text-muted/50 italic">--</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Missing ingredients detail */}
      {uniqueMissing.length > 0 && (
        <div className="mt-6 glass rounded-2xl p-4 md:p-5">
          <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-3">// MISSING INGREDIENTS ({uniqueMissing.length})</p>
          <div className="flex flex-wrap gap-2">
            {uniqueMissing.map((ing) => (
              <span key={ing.normalizedName} className="text-xs px-3 py-1.5 rounded-lg bg-card border border-card-border">
                {ing.amount} {ing.name}
              </span>
            ))}
          </div>
          <Link href="/cart" className="btn btn-primary mt-4 inline-block !text-[10px]">
            ADD TO CART
          </Link>
        </div>
      )}
    </div>
  );
}
