"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Beef, Milk, Carrot, Wheat, Cookie, CupSoda, Droplet, Snowflake, Package,
  Pencil, Trash2, Search, AlertTriangle, Clock, Wallet, type LucideIcon,
} from "lucide-react";
import { ItemWithRisk, StorageLocation, FoodCategory, RiskTier } from "@/lib/types";
import FridgeMascot from "@/components/mascot/FridgeMascot";

const LOCATIONS: { key: StorageLocation | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "fridge", label: "Fridge" },
  { key: "freezer", label: "Freezer" },
  { key: "pantry", label: "Pantry" },
];

const CATEGORY_ICONS: Record<FoodCategory, LucideIcon> = {
  protein: Beef,
  dairy: Milk,
  produce: Carrot,
  grain: Wheat,
  snack: Cookie,
  beverage: CupSoda,
  condiment: Droplet,
  frozen: Snowflake,
  other: Package,
};

type SortKey = "expiring" | "price" | "name";

const TIER_ORDER: Record<RiskTier, number> = { "use-today": 0, "use-this-week": 1, safe: 2, frozen: 3 };

// Per-tier accent colors shared by the icon tile, badge and freshness meter
const TIER_STYLES: Record<RiskTier, { text: string; tile: string; bar: string }> = {
  "use-today": { text: "text-red-700 dark:text-red-300", tile: "bg-red-600 text-white", bar: "bg-red-600" },
  "use-this-week": { text: "text-amber-700 dark:text-amber-300", tile: "bg-amber-500 text-white", bar: "bg-amber-400" },
  safe: { text: "text-emerald-700 dark:text-emerald-300", tile: "bg-emerald-500 text-white", bar: "bg-emerald-500" },
  frozen: { text: "text-sky-700 dark:text-sky-300", tile: "bg-sky-500 text-white", bar: "bg-sky-400" },
};

// Freshness meter fills over a two-week window; anything fresher reads as full
const FRESHNESS_WINDOW_DAYS = 14;

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-300/60 rounded-lg ${className}`} />;
}

export default function InventoryPage() {
  const [items, setItems] = useState<ItemWithRisk[]>([]);
  const [filter, setFilter] = useState<StorageLocation | "all">("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("expiring");
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", quantity: "", purchasePrice: 0, bestByDate: "" });

  const fetchItems = useCallback(async () => {
    const data = await fetch("/api/inventory").then((r) => r.json());
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  function showFeedback(msg: string) {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 2500);
  }

  async function updateItem(id: string, updates: Record<string, unknown>) {
    const item = items.find((i) => i.id === id);
    const action = updates.status === "consumed" ? "eaten" :
      updates.status === "discarded" ? "discarded" :
      updates.status === "frozen" ? "frozen" :
      updates.status === "active" ? "thawed" : "updated";
    await fetch("/api/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    showFeedback(`${item?.name} → ${action}`);
    fetchItems();
  }

  async function deleteItem(id: string) {
    const item = items.find((i) => i.id === id);
    await fetch("/api/inventory", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    showFeedback(`${item?.name} deleted`);
    fetchItems();
  }

  function startEdit(item: ItemWithRisk) {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      quantity: item.quantity,
      purchasePrice: item.purchasePrice,
      bestByDate: item.bestByDate || "",
    });
  }

  async function saveEdit() {
    if (!editingId) return;
    await fetch("/api/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingId,
        name: editForm.name,
        quantity: editForm.quantity,
        purchasePrice: editForm.purchasePrice,
        bestByDate: editForm.bestByDate || null,
      }),
    });
    showFeedback("Item updated");
    setEditingId(null);
    fetchItems();
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items.filter((i) =>
      (filter === "all" || i.location === filter) &&
      (!q || i.name.toLowerCase().includes(q) || i.category.includes(q))
    );
    return [...list].sort((a, b) => {
      if (sort === "price") return b.purchasePrice - a.purchasePrice;
      if (sort === "name") return a.name.localeCompare(b.name);
      return TIER_ORDER[a.riskTier] - TIER_ORDER[b.riskTier] || a.daysUntilQualityDecline - b.daysUntilQualityDecline;
    });
  }, [items, filter, query, sort]);

  const stats = useMemo(() => {
    const count = (tier: RiskTier) => items.filter((i) => i.riskTier === tier).length;
    const atRisk = items.filter((i) => i.riskTier === "use-today" || i.riskTier === "use-this-week");
    return {
      totalValue: items.reduce((sum, i) => sum + i.purchasePrice, 0),
      atRiskValue: atRisk.reduce((sum, i) => sum + i.purchasePrice, 0),
      today: count("use-today"),
      week: count("use-this-week"),
      safe: count("safe"),
      frozen: count("frozen"),
    };
  }, [items]);

  // Loading skeletons
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <Skeleton className="w-20 h-3 mb-3" />
            <Skeleton className="w-48 h-10" />
          </div>
          <Skeleton className="w-28 h-10 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[1,2,3,4].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <div className="flex gap-2 mb-5">
          {[1,2,3,4].map((i) => <Skeleton key={i} className="w-20 h-9 rounded-lg" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {[1,2,3,4].map((i) => <Skeleton key={i} className="w-full h-36 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-2">// INVENTORY</p>
          <h2 className="text-display text-3xl md:text-4xl">Your Food</h2>
          <p className="text-sm text-muted mt-2">
            {items.length} item{items.length === 1 ? "" : "s"} tracked · ${stats.totalValue.toFixed(2)} on hand
          </p>
        </div>
        <Link href="/add-item" className="btn btn-primary btn-lg">+ ADD</Link>
      </div>

      {/* Summary tiles */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <StatTile icon={Wallet} label="On hand" value={`$${stats.totalValue.toFixed(2)}`} sub={`${items.length} items`} />
          <StatTile icon={AlertTriangle} label="Use today" value={String(stats.today)} sub={stats.today ? "eat these first" : "nothing urgent"} tone="text-red-600 dark:text-red-400" />
          <StatTile icon={Clock} label="This week" value={String(stats.week)} sub={`$${stats.atRiskValue.toFixed(2)} at risk`} tone="text-amber-600 dark:text-amber-300" />
          <StatTile icon={Snowflake} label="Frozen" value={String(stats.frozen)} sub="spoilage paused" tone="text-sky-600 dark:text-sky-300" />
        </div>
      )}

      {/* Freshness distribution */}
      {items.length > 0 && (
        <div className="bg-card border border-card-border rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="font-pixel text-[10px] text-muted uppercase tracking-wider">Freshness mix</p>
            <p className="font-pixel text-[10px] text-muted uppercase">{stats.safe} safe</p>
          </div>
          <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-300/40 dark:bg-white/5" role="img"
            aria-label={`${stats.today} use today, ${stats.week} this week, ${stats.safe} safe, ${stats.frozen} frozen`}>
            {([["use-today", stats.today], ["use-this-week", stats.week], ["safe", stats.safe], ["frozen", stats.frozen]] as [RiskTier, number][])
              .filter(([, n]) => n > 0)
              .map(([tier, n]) => (
                <div key={tier} className={TIER_STYLES[tier].bar} style={{ width: `${(n / items.length) * 100}%` }} />
              ))}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[11px] text-muted">
            <Legend color={TIER_STYLES["use-today"].bar} label={`Today ${stats.today}`} />
            <Legend color={TIER_STYLES["use-this-week"].bar} label={`This week ${stats.week}`} />
            <Legend color={TIER_STYLES.safe.bar} label={`Safe ${stats.safe}`} />
            <Legend color={TIER_STYLES.frozen.bar} label={`Frozen ${stats.frozen}`} />
          </div>
        </div>
      )}

      {actionFeedback && (
        <div role="status" className="bg-card border border-card-border rounded-xl px-4 py-3 text-sm font-medium mb-5">{actionFeedback}</div>
      )}

      {/* Toolbar: location tabs, search, sort */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
        <div className="flex gap-1 bg-card border border-card-border rounded-xl p-1 w-fit overflow-x-auto">
          {LOCATIONS.map((loc) => (
            <button key={loc.key} onClick={() => setFilter(loc.key)}
              className={`font-pixel text-[10px] px-3 md:px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                filter === loc.key ? "bg-white text-black font-bold" : "text-muted hover:text-foreground"
              }`}>
              {loc.label}
              <span className="ml-1 opacity-60">
                {loc.key === "all" ? items.length : items.filter((i) => i.location === loc.key).length}
              </span>
            </button>
          ))}
        </div>
        <div className="flex gap-2 md:ml-auto">
          <label className="relative flex-1 md:w-56">
            <span className="sr-only">Search food</span>
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…"
              className="w-full bg-card border border-card-border rounded-xl pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-sky-400" />
          </label>
          <label>
            <span className="sr-only">Sort by</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
              className="bg-card border border-card-border rounded-xl px-3 py-2 font-pixel text-[10px] uppercase text-foreground cursor-pointer focus:outline-none focus:border-sky-400">
              <option value="expiring">Expiring</option>
              <option value="price">Price</option>
              <option value="name">Name</option>
            </select>
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center">
          <div className="bg-card border border-card-border rounded-xl px-3 py-1.5 mb-2 text-xs text-muted">I&apos;m hungry!</div>
          <div className="mb-4 text-slate-400 dark:text-slate-500 animate-bounce"><FridgeMascot size={44} /></div>
          <p className="text-display text-2xl mb-3">{query ? "No matches" : "Empty"}</p>
          <Link href="/add-item" className="font-pixel text-xs text-muted hover:text-foreground uppercase tracking-wider underline underline-offset-4">
            ADD AN ITEM →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((item) => {
            const isUrgent = item.riskTier === "use-today";
            const isFrozen = item.riskTier === "frozen";
            const isEditing = editingId === item.id;
            const tier = TIER_STYLES[item.riskTier];
            const Icon = CATEGORY_ICONS[item.category] ?? Package;
            const freshnessPct = isFrozen ? 100
              : Math.max(4, Math.min(100, (item.daysUntilQualityDecline / FRESHNESS_WINDOW_DAYS) * 100));

            return (
              <div key={item.id}
                className={`rounded-2xl transition-all duration-200 backdrop-blur-md shadow-[0_2px_10px_rgba(31,87,184,0.08)] dark:shadow-[0_2px_10px_rgba(0,0,0,0.4)] ${
                  isUrgent ? "risk-urgent"
                  : item.riskTier === "use-this-week" ? "risk-week"
                  : isFrozen ? "risk-frozen"
                  : "risk-safe"
                }`}>

                {/* View mode */}
                {!isEditing && (
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${tier.tile}`}>
                        <Icon className="w-5 h-5" aria-hidden />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-[15px] leading-tight truncate">{item.name}</h4>
                          <span className={`font-pixel text-[9px] uppercase tracking-wider font-bold ${isUrgent ? "bg-red-600 text-white px-1.5 py-0.5 rounded" : tier.text}`}>
                            {isUrgent ? "TODAY" : item.riskTier === "use-this-week" ? `${item.daysUntilQualityDecline}D`
                            : isFrozen ? "FROZEN" : "SAFE"}
                          </span>
                        </div>
                        <p className="text-xs text-muted truncate mt-0.5">
                          {item.quantity} · {item.location} · {item.category}
                          {item.openedAt && " · opened"}
                        </p>
                      </div>
                      <p className="text-display text-xl flex-shrink-0">${item.purchasePrice.toFixed(2)}</p>
                    </div>

                    {/* Freshness meter */}
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] text-muted mb-1">
                        <span className="truncate">
                          {item.reason || (isFrozen ? "Spoilage paused" : "Freshness")}
                          {item.confidence < 0.6 ? " · ~estimate" : ""}
                        </span>
                        <span className="flex-shrink-0 ml-2">
                          {isFrozen ? "paused" : item.daysUntilQualityDecline <= 0 ? "now" : `${item.daysUntilQualityDecline}d left`}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                        <div className={`h-full rounded-full ${tier.bar} ${isFrozen ? "opacity-50" : ""}`} style={{ width: `${freshnessPct}%` }} />
                      </div>
                    </div>

                    {/* Buttons row */}
                    <div className="flex gap-1.5 mt-3">
                      {!isFrozen
                        && !item.openedAt
                        && item.status === "active"
                        && item.category !== "produce"  // produce doesn't have an "opened" state
                        && item.category !== "protein"  // whole proteins (chicken, steak) don't either
                        && item.riskTier !== "use-today"  // already expired — opening doesn't bring it back
                        && (
                        <button
                          onClick={() => updateItem(item.id, { openedAt: new Date().toISOString().split("T")[0] })}
                          className="btn flex-1 !text-[9px] !px-2 !py-2"
                        >
                          OPEN
                        </button>
                      )}
                      <button onClick={() => updateItem(item.id, { status: "consumed" })} className="btn btn-eat flex-1 !text-[9px] !px-2 !py-2">EATEN</button>
                      {isFrozen ? (
                        <button
                          onClick={() => updateItem(item.id, { status: "active", location: "fridge" })}
                          title="Thawing starts a shorter freshness window"
                          className="btn btn-freeze flex-1 !text-[9px] !px-2 !py-2"
                        >
                          THAW
                        </button>
                      ) : (
                        <button onClick={() => updateItem(item.id, { status: "frozen", location: "freezer" })} className="btn btn-freeze flex-1 !text-[9px] !px-2 !py-2">FREEZE</button>
                      )}
                      <button onClick={() => updateItem(item.id, { status: "discarded" })} className="btn btn-danger flex-1 !text-[9px] !px-2 !py-2">TOSS</button>
                      <button onClick={() => startEdit(item)} aria-label={`Edit ${item.name}`} title="Edit" className="btn !px-2.5 !py-2">
                        <Pencil className="w-3.5 h-3.5" aria-hidden />
                      </button>
                      <button onClick={() => deleteItem(item.id)} aria-label={`Delete ${item.name}`} title="Delete" className="btn btn-danger !px-2.5 !py-2">
                        <Trash2 className="w-3.5 h-3.5" aria-hidden />
                      </button>
                    </div>
                  </div>
                )}

                {/* Edit mode */}
                {isEditing && (
                  <div className="p-3 md:p-4 space-y-3">
                    <p className="font-pixel text-[9px] text-muted uppercase">EDITING</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-pixel text-[8px] text-muted uppercase">Name</label>
                        <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full bg-white/75 dark:bg-neutral-900/70 border border-slate-300/70 dark:border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-sky-400" />
                      </div>
                      <div>
                        <label className="font-pixel text-[8px] text-muted uppercase">Quantity</label>
                        <input type="text" value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                          className="w-full bg-white/75 dark:bg-neutral-900/70 border border-slate-300/70 dark:border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-sky-400" />
                      </div>
                      <div>
                        <label className="font-pixel text-[8px] text-muted uppercase">Price $</label>
                        <input type="number" step="0.01" value={editForm.purchasePrice} onChange={(e) => setEditForm({ ...editForm, purchasePrice: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-white/75 dark:bg-neutral-900/70 border border-slate-300/70 dark:border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-sky-400" />
                      </div>
                      <div>
                        <label className="font-pixel text-[8px] text-muted uppercase">Expires</label>
                        <input type="date" value={editForm.bestByDate} onChange={(e) => setEditForm({ ...editForm, bestByDate: e.target.value })}
                          className="w-full bg-white/75 dark:bg-neutral-900/70 border border-slate-300/70 dark:border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-sky-400" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="btn btn-primary flex-1 !text-[9px]">SAVE</button>
                      <button onClick={() => setEditingId(null)} className="btn flex-1 !text-[9px]">CANCEL</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatTile({ icon: Icon, label, value, sub, tone = "text-foreground" }: {
  icon: LucideIcon; label: string; value: string; sub: string; tone?: string;
}) {
  return (
    <div className="bg-card border border-card-border rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${tone}`} aria-hidden />
        <p className="font-pixel text-[10px] text-muted uppercase tracking-wider">{label}</p>
      </div>
      <p className={`text-display text-2xl md:text-3xl ${tone}`}>{value}</p>
      <p className="text-[11px] text-muted mt-1.5 truncate">{sub}</p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${color}`} aria-hidden />
      {label}
    </span>
  );
}
