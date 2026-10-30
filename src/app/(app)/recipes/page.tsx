"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Heart, Clock, Flame, Sparkles, Leaf } from "lucide-react";
import { ScoredRecipe, Recipe } from "@/lib/types";
import { getRecipeImageUrl, proxyImageUrl } from "@/lib/recipe-images";

const AI_RECIPES_STORAGE_KEY = "ff_ai_recipes";
const FAVORITES_KEY = "ff_favorite_recipes";

type Tab = "ranked" | "ai" | "favorites";
type QuickFilter = "all" | "quick" | "protein" | "rescue";
type SortKey = "score" | "time" | "protein";

const QUICK_FILTERS: { key: QuickFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "quick", label: "≤ 15 min" },
  { key: "protein", label: "25g+ protein" },
  { key: "rescue", label: "Uses expiring" },
];

// Shared shape so ranked, AI and favorite recipes render through one card
type CardData = {
  recipe: Recipe;
  imageSrc: string;
  score?: number;
  explanation?: string[];
  ownedCount?: number;
  rescued?: string[];
  missing?: string[];
  rescueValue?: number;
  badge?: string;
};

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<ScoredRecipe[]>([]);
  const [aiRecipes, setAiRecipes] = useState<Recipe[]>([]);
  const [favorites, setFavorites] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [tab, setTab] = useState<Tab>("ranked");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");
  const [sort, setSort] = useState<SortKey>("score");

  useEffect(() => {
    fetch("/api/recipes").then((r) => r.json()).then((data) => { setRecipes(Array.isArray(data) ? data : []); setLoading(false); });
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

  const cards: CardData[] = useMemo(() => {
    let list: CardData[];
    if (tab === "ranked") {
      list = recipes.map((sr, idx) => ({
        recipe: sr.recipe,
        imageSrc: sr.recipe.imageUrl ? proxyImageUrl(sr.recipe.imageUrl) : getRecipeImageUrl(sr.recipe.name, idx),
        score: sr.score,
        explanation: sr.explanation,
        ownedCount: sr.matchedItems.length,
        rescued: sr.atRiskItemsRescued.map((i) => i.name),
        missing: sr.missingIngredients.map((i) => i.name),
        rescueValue: sr.wasteRescueValue,
      }));
    } else {
      const source = tab === "ai" ? aiRecipes : favorites;
      list = source.map((recipe, idx) => ({
        recipe,
        imageSrc: recipe.imageUrl ? proxyImageUrl(recipe.imageUrl) : getRecipeImageUrl(recipe.name, idx),
        badge: tab === "ai" ? "AI" : undefined,
      }));
    }

    list = list.filter((c) => {
      if (quickFilter === "quick") return c.recipe.cookTimeMinutes <= 15;
      if (quickFilter === "protein") return c.recipe.macros.protein >= 25;
      if (quickFilter === "rescue") return (c.rescued?.length ?? 0) > 0;
      return true;
    });

    if (sort === "time") list = [...list].sort((a, b) => a.recipe.cookTimeMinutes - b.recipe.cookTimeMinutes);
    if (sort === "protein") list = [...list].sort((a, b) => b.recipe.macros.protein - a.recipe.macros.protein);
    return list;
  }, [tab, recipes, aiRecipes, favorites, quickFilter, sort]);

  const summary = useMemo(() => {
    const quick = recipes.filter((r) => r.recipe.cookTimeMinutes <= 15).length;
    const rescue = recipes.reduce((sum, r) => sum + r.wasteRescueValue, 0);
    const avgProtein = recipes.length
      ? Math.round(recipes.reduce((sum, r) => sum + r.recipe.macros.protein, 0) / recipes.length)
      : 0;
    return { count: recipes.length, best: recipes[0]?.score ?? 0, quick, rescue, avgProtein };
  }, [recipes]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-8"><div className="animate-pulse bg-slate-300/60 rounded-lg w-24 h-3 mb-3" /><div className="animate-pulse bg-slate-300/60 rounded-lg w-40 h-10" /></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">{[1,2,3,4].map((i) => <div key={i} className="animate-pulse bg-slate-300/60 rounded-2xl h-20" />)}</div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{[1,2,3,4,5,6].map((i) => <div key={i} className="animate-pulse bg-slate-300/60 rounded-2xl h-80" />)}</div>
      </div>
    );
  }

  const tabs = [
    { key: "ranked" as Tab, label: `RANKED (${recipes.length})` },
    ...(aiRecipes.length > 0 ? [{ key: "ai" as Tab, label: `AI (${aiRecipes.length})` }] : []),
    ...(favorites.length > 0 ? [{ key: "favorites" as Tab, label: `FAVS (${favorites.length})` }] : []),
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-6 gap-3">
        <div>
          <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-2">// RECIPES</p>
          <h2 className="text-display text-3xl md:text-4xl">Cook Something</h2>
          <p className="text-sm text-muted mt-2">Ranked by what you own, what&apos;s expiring and today&apos;s training.</p>
        </div>
        <button
          onClick={generateRecipes}
          disabled={generating}
          className="btn btn-primary !text-[9px] md:!text-xs !px-3 md:btn-lg disabled:opacity-50 flex-shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" aria-hidden />
          {generating ? "GENERATING..." : "AI GENERATE"}
        </button>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <SummaryTile label="Recipes" value={String(summary.count)} sub={`top match ${summary.best} pts`} />
        <SummaryTile label="Quick meals" value={String(summary.quick)} sub="15 min or less" />
        <SummaryTile label="Avg protein" value={`${summary.avgProtein}g`} sub="per serving" />
        <SummaryTile label="Rescue value" value={`$${summary.rescue.toFixed(0)}`} sub="of expiring food used" tone={summary.rescue > 0 ? "text-safe" : undefined} />
      </div>

      {/* Toolbar: tabs, quick filters, sort */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-5">
        <div className="flex gap-1 bg-card border border-card-border rounded-xl p-1 w-fit overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`font-pixel text-[9px] md:text-[10px] px-3 md:px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${tab === t.key ? "bg-white text-black font-bold" : "text-muted hover:text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {QUICK_FILTERS.filter((f) => f.key !== "rescue" || tab === "ranked").map((f) => (
            <button key={f.key} onClick={() => setQuickFilter(f.key)} aria-pressed={quickFilter === f.key}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                quickFilter === f.key
                  ? "border-foreground/60 text-foreground bg-white/10"
                  : "border-card-border text-muted hover:text-foreground"
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <label className="lg:ml-auto">
          <span className="sr-only">Sort recipes</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
            className="bg-card border border-card-border rounded-xl px-3 py-2 font-pixel text-[10px] uppercase text-foreground cursor-pointer focus:outline-none focus:border-sky-400">
            <option value="score">Best match</option>
            <option value="time">Fastest</option>
            <option value="protein">Most protein</option>
          </select>
        </label>
      </div>

      {cards.length === 0 ? (
        <div className="text-center py-16 bg-card border border-card-border rounded-2xl">
          <p className="text-display text-2xl mb-2">Nothing here</p>
          <p className="text-sm text-muted">
            {tab === "favorites" ? "Tap the heart on any recipe to save it here." : "Try a different filter, or generate new ideas with AI."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cards.map((card, idx) => (
            <RecipeCard
              key={card.recipe.id}
              card={card}
              highlight={tab === "ranked" && sort === "score" && quickFilter === "all" && idx === 0}
              favorite={isFavorite(card.recipe.id)}
              onToggleFavorite={(e) => toggleFavorite(e, card.recipe)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RecipeCard({ card, highlight, favorite, onToggleFavorite }: {
  card: CardData;
  highlight: boolean;
  favorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
}) {
  const { recipe } = card;
  const totalIngredients = recipe.ingredients.length;
  const ownedPct = card.ownedCount !== undefined && totalIngredients > 0 ? (card.ownedCount / totalIngredients) * 100 : null;
  const chips = card.missing ?? recipe.ingredients.map((i) => i.name);

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className={`group flex flex-col rounded-2xl overflow-hidden transition-all duration-200 ${
        highlight ? "risk-safe" : "bg-card border border-card-border hover:border-slate-400 hover:shadow-[0_0_15px_rgba(255,255,255,0.04)]"
      }`}
    >
      {/* Image with overlays */}
      <div className="relative h-40 overflow-hidden">
        <img src={card.imageSrc} alt={recipe.name} loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" aria-hidden />
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          {highlight && <span className="font-pixel text-[9px] font-bold uppercase px-2 py-1 rounded-md bg-emerald-500 text-black">Top pick</span>}
          {card.badge && <span className="font-pixel text-[9px] font-bold uppercase px-2 py-1 rounded-md bg-black/60 text-white backdrop-blur">{card.badge}</span>}
        </div>
        <button onClick={onToggleFavorite} aria-label={favorite ? `Remove ${recipe.name} from favorites` : `Save ${recipe.name} to favorites`}
          aria-pressed={favorite}
          className="absolute top-2 right-2 w-9 h-9 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70 transition-colors cursor-pointer">
          <Heart className={`w-4 h-4 ${favorite ? "fill-rose-500 text-rose-500" : ""}`} />
        </button>
        <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between text-white">
          <span className="flex items-center gap-3 font-pixel text-[10px] uppercase">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" aria-hidden />{recipe.cookTimeMinutes}m</span>
            <span className="capitalize">{recipe.difficulty}</span>
          </span>
          {card.score !== undefined && (
            <span className="text-display text-2xl">{card.score}<span className="text-xs font-normal opacity-80">pts</span></span>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4">
        <h3 className="text-lg font-bold leading-tight">{recipe.name}</h3>
        <div className="flex gap-2 mt-1 flex-wrap">
          {recipe.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="font-pixel text-[9px] text-muted uppercase tracking-wider">{tag}</span>
          ))}
        </div>

        {card.explanation && card.explanation.length > 0 && (
          <p className="text-xs text-muted mt-2.5 line-clamp-2">{card.explanation.slice(0, 2).join(" · ")}</p>
        )}

        {/* Macros */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <MacroBar label="Protein" grams={recipe.macros.protein} max={50} color="bg-emerald-500" />
          <MacroBar label="Carbs" grams={recipe.macros.carbs} max={80} color="bg-sky-400" />
          <MacroBar label="Fat" grams={recipe.macros.fat} max={40} color="bg-amber-400" />
        </div>

        {/* Pantry coverage */}
        {ownedPct !== null && (
          <div className="mt-3">
            <div className="flex justify-between text-[11px] text-muted mb-1">
              <span>You have {card.ownedCount}/{totalIngredients} ingredients</span>
              {(card.rescueValue ?? 0) > 0 && <span className="text-safe flex items-center gap-1"><Leaf className="w-3 h-3" aria-hidden />saves ${card.rescueValue!.toFixed(0)}</span>}
            </div>
            <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-foreground/70" style={{ width: `${Math.max(ownedPct, 3)}%` }} />
            </div>
          </div>
        )}

        {/* Ingredient chips: rescued items first, then what's missing */}
        <div className="mt-auto pt-3 flex gap-1 flex-wrap">
          {card.rescued?.slice(0, 2).map((name) => (
            <span key={`r-${name}`} className="text-[10px] font-bold px-2 py-0.5 rounded bg-danger/10 text-danger flex items-center gap-1">
              <Flame className="w-2.5 h-2.5" aria-hidden />{name}
            </span>
          ))}
          {chips.slice(0, 3).map((name) => (
            <span key={name} className="text-[10px] px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 text-muted">
              {card.missing ? `+ ${name}` : name}
            </span>
          ))}
          {chips.length > 3 && <span className="text-[10px] px-1.5 py-0.5 text-muted">+{chips.length - 3} more</span>}
        </div>
      </div>
    </Link>
  );
}

function MacroBar({ label, grams, max, color }: { label: string; grams: number; max: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] text-muted mb-1">
        <span className="font-pixel uppercase">{label}</span>
        <span className="text-foreground font-semibold">{grams}g</span>
      </div>
      <div className="h-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, (grams / max) * 100)}%` }} />
      </div>
    </div>
  );
}

function SummaryTile({ label, value, sub, tone = "text-foreground" }: { label: string; value: string; sub: string; tone?: string }) {
  return (
    <div className="bg-card border border-card-border rounded-2xl p-4">
      <p className="font-pixel text-[10px] text-muted uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-display text-2xl md:text-3xl ${tone}`}>{value}</p>
      <p className="text-[11px] text-muted mt-1.5 truncate">{sub}</p>
    </div>
  );
}
