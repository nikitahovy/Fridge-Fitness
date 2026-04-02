"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ItemWithRisk, StorageLocation } from "@/lib/types";

const LOCATIONS: { key: StorageLocation | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "fridge", label: "Fridge" },
  { key: "freezer", label: "Freezer" },
  { key: "pantry", label: "Pantry" },
];

export default function InventoryPage() {
  const [items, setItems] = useState<ItemWithRisk[]>([]);
  const [filter, setFilter] = useState<StorageLocation | "all">("all");
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    const data = await fetch("/api/inventory").then((r) => r.json());
    setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  async function updateItem(id: string, updates: Record<string, unknown>) {
    const item = items.find((i) => i.id === id);
    const action = updates.status === "consumed" ? "marked as eaten" :
      updates.status === "discarded" ? "discarded" :
      updates.status === "frozen" ? "moved to freezer" :
      updates.status === "active" ? "thawed" : "updated";
    await fetch("/api/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    setActionFeedback(`${item?.name} ${action}`);
    setTimeout(() => setActionFeedback(null), 2500);
    fetchItems();
  }

  const filtered = filter === "all" ? items : items.filter((i) => i.location === filter);

  if (loading) return <div className="max-w-4xl mx-auto py-20"><p className="font-pixel text-muted text-sm">LOADING...</p></div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-2">// INVENTORY</p>
          <h2 className="text-display text-4xl">Your Food</h2>
        </div>
        <Link href="/add-item" className="btn btn-primary btn-lg">+ ADD ITEM</Link>
      </div>

      {actionFeedback && (
        <div className="bg-card border border-card-border rounded-xl px-4 py-3 text-sm font-medium mb-5">
          {actionFeedback}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-card-border rounded-xl p-1 mb-6 w-fit">
        {LOCATIONS.map((loc) => (
          <button
            key={loc.key}
            onClick={() => setFilter(loc.key)}
            className={`px-4 py-2 rounded-lg text-sm transition-all cursor-pointer ${
              filter === loc.key
                ? "bg-white text-black font-bold"
                : "text-muted hover:text-foreground font-medium"
            }`}
          >
            {loc.label}
            <span className="ml-1.5 font-pixel text-[10px] opacity-60">
              {loc.key === "all" ? items.length : items.filter((i) => i.location === loc.key).length}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-display text-2xl mb-3">Empty</p>
          <Link href="/add-item" className="font-pixel text-xs text-muted hover:text-foreground underline underline-offset-4">
            ADD YOUR FIRST ITEM →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const isUrgent = item.riskTier === "use-today";
            const isFrozen = item.riskTier === "frozen";
            return (
              <div
                key={item.id}
                className={`rounded-2xl p-4 flex items-center gap-4 border transition-all duration-200 hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.04)] cursor-default ${
                  isUrgent
                    ? "bg-gradient-to-r from-red-950/80 to-red-900/30 border-red-500/20"
                    : item.riskTier === "use-this-week"
                    ? "bg-gradient-to-r from-yellow-900/30 via-amber-950/20 to-card border-yellow-500/15"
                    : isFrozen
                    ? "bg-gradient-to-r from-blue-950/50 to-blue-900/15 border-blue-500/15"
                    : "bg-gradient-to-r from-emerald-950/40 to-emerald-900/10 border-emerald-500/10"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="font-bold text-sm">{item.name}</h4>
                    <span className={`font-pixel text-[9px] uppercase tracking-wider ${
                      isUrgent ? "text-[#ff6b6b]" :
                      item.riskTier === "use-this-week" ? "text-yellow-400" :
                      isFrozen ? "text-blue-400" : "text-safe"
                    }`}>
                      {isUrgent ? "TODAY" :
                       item.riskTier === "use-this-week" ? `${item.daysUntilQualityDecline}D LEFT` :
                       isFrozen ? "FROZEN" : "SAFE"}
                    </span>
                  </div>
                  <p className={`text-xs ${isUrgent ? "text-red-300/50" : "text-muted"}`}>
                    {item.quantity} · {item.location} · {item.category}
                    {isFrozen && " · spoilage paused"}
                  </p>
                </div>

                <p className={`text-display text-lg ${isUrgent ? "text-white" : ""}`}>
                  ${item.purchasePrice.toFixed(2)}
                </p>

                <div className="flex gap-1.5">
                  <button onClick={() => updateItem(item.id, { status: "consumed" })} className="btn btn-eat">EATEN</button>
                  {isFrozen ? (
                    <button onClick={() => updateItem(item.id, { status: "active", location: "fridge" })} className="btn btn-freeze">THAW</button>
                  ) : (
                    <button onClick={() => updateItem(item.id, { status: "frozen", location: "freezer" })} className="btn btn-freeze">FREEZE</button>
                  )}
                  <button onClick={() => updateItem(item.id, { status: "discarded" })} className="btn btn-danger">TOSS</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
