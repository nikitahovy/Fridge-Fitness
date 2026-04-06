"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ItemWithRisk, DailyRecoveryContext } from "@/lib/types";

type WasteStats = {
  wastedValue: number;
  savedValue: number;
  itemsConsumed: number;
  itemsDiscarded: number;
  discardedItems: { name: string; price: number }[];
};

export default function EatFirstPage() {
  const [items, setItems] = useState<ItemWithRisk[]>([]);
  const [recovery, setRecovery] = useState<DailyRecoveryContext | null>(null);
  const [stats, setStats] = useState<WasteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [itemsData, recData, statsData] = await Promise.all([
      fetch("/api/eat-first").then((r) => r.json()),
      fetch("/api/recovery").then((r) => r.json()),
      fetch("/api/stats").then((r) => r.json()),
    ]);
    setItems(itemsData);
    setRecovery(recData.context);
    setStats(statsData);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function markItem(id: string, status: string, extraUpdates?: Record<string, string>) {
    const item = items.find((i) => i.id === id);
    const action = status === "consumed" ? "eaten" :
      status === "discarded" ? "discarded" :
      status === "frozen" ? "frozen" : "updated";
    await fetch("/api/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, ...extraUpdates }),
    });
    setActionFeedback(`${item?.name} → ${action}`);
    setTimeout(() => setActionFeedback(null), 2500);
    fetchData();
  }

  const totalAtRisk = items
    .filter((i) => i.riskTier === "use-today" || i.riskTier === "use-this-week")
    .reduce((sum, i) => sum + i.purchasePrice, 0);
  const totalValue = items.reduce((sum, i) => sum + i.purchasePrice, 0);

  if (loading) return <div className="max-w-3xl mx-auto py-20"><p className="font-pixel text-muted text-sm">LOADING...</p></div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 md:mb-8">
        <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-2">// EAT FIRST QUEUE</p>
        <h2 className="text-display text-3xl md:text-4xl">Use It or<br/>Lose It</h2>
      </div>

      {actionFeedback && (
        <div className="bg-card border border-card-border rounded-xl px-4 py-3 text-sm font-medium mb-5">
          {actionFeedback}
        </div>
      )}

      {/* Stats row — 2x2 on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-6 md:mb-8">
        <div className="bg-gradient-to-br from-red-950/80 to-red-900/30 border border-red-500/20 rounded-2xl p-3 md:p-4">
          <p className="text-display text-lg md:text-2xl text-danger">${totalAtRisk.toFixed(2)}</p>
          <p className="font-pixel text-[8px] md:text-[9px] text-red-400/60 uppercase mt-1">At Risk</p>
        </div>
        <div className="bg-card border border-card-border rounded-2xl p-3 md:p-4">
          <p className="text-display text-lg md:text-2xl">${totalValue.toFixed(2)}</p>
          <p className="font-pixel text-[8px] md:text-[9px] text-muted uppercase mt-1">In Stock</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-950/80 to-emerald-900/30 border border-emerald-500/20 rounded-2xl p-3 md:p-4">
          <p className="text-display text-lg md:text-2xl text-safe">${stats?.savedValue.toFixed(2) || "0.00"}</p>
          <p className="font-pixel text-[8px] md:text-[9px] text-safe/60 uppercase mt-1">Saved</p>
        </div>
        <div className="bg-card border border-card-border rounded-2xl p-3 md:p-4">
          <p className="text-display text-lg md:text-2xl text-danger">${stats?.wastedValue.toFixed(2) || "0.00"}</p>
          <p className="font-pixel text-[8px] md:text-[9px] text-muted uppercase mt-1">Wasted</p>
        </div>
      </div>

      {/* Waste/save banners */}
      {stats && stats.itemsDiscarded > 0 && (
        <div className="bg-danger/5 border border-danger/10 rounded-2xl p-3 md:p-4 mb-4">
          <p className="text-xs md:text-sm"><span className="font-bold">${stats.wastedValue.toFixed(2)}</span> wasted — {stats.discardedItems.map(i => i.name).join(", ")}</p>
        </div>
      )}
      {stats && stats.itemsConsumed > 0 && (
        <div className="bg-safe/5 border border-safe/10 rounded-2xl p-3 md:p-4 mb-4">
          <p className="text-xs md:text-sm">Saved <span className="font-bold">${stats.savedValue.toFixed(2)}</span> by eating {stats.itemsConsumed} item{stats.itemsConsumed !== 1 ? "s" : ""}</p>
        </div>
      )}

      {/* Items */}
      <div className="space-y-2">
        {items.map((item, idx) => {
          const isUrgent = item.riskTier === "use-today";
          return (
            <div
              key={item.id}
              className={`rounded-2xl p-3 md:p-4 border transition-all duration-200 hover:border-white/30 cursor-default ${
                isUrgent
                  ? "bg-gradient-to-r from-red-950/80 to-red-900/30 border-red-500/20"
                  : item.riskTier === "use-this-week"
                  ? "bg-gradient-to-r from-yellow-900/30 via-amber-950/20 to-card border-yellow-500/15"
                  : item.riskTier === "frozen"
                  ? "bg-gradient-to-r from-blue-950/50 to-blue-900/15 border-blue-500/15"
                  : "bg-gradient-to-r from-emerald-950/40 to-emerald-900/10 border-emerald-500/10"
              }`}
            >
              {/* Top row: rank, name, price */}
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <span className={`font-pixel text-[10px] md:text-xs w-5 md:w-6 text-center flex-shrink-0 ${isUrgent ? "text-red-400/60" : "text-muted"}`}>
                  {String(idx + 1).padStart(2, "0")}
                </span>

                {/* Risk bar — hidden on mobile to save space */}
                <div className="hidden md:block w-12 flex-shrink-0">
                  <div className={`h-1.5 rounded-full overflow-hidden ${isUrgent ? "bg-red-400/10" : "bg-white/[0.05]"}`}>
                    <div
                      className={`h-full rounded-full ${
                        item.spoilageRiskScore > 70 ? "bg-danger" : item.spoilageRiskScore > 40 ? "bg-warning" : "bg-safe"
                      }`}
                      style={{ width: `${Math.max(item.spoilageRiskScore, 8)}%` }}
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-bold text-sm truncate">{item.name}</h4>
                    {item.daysUntilQualityDecline <= 1 && (
                      <span className="font-pixel text-[8px] md:text-[9px] text-danger uppercase whitespace-nowrap">TODAY</span>
                    )}
                    {item.daysUntilQualityDecline > 1 && item.daysUntilQualityDecline <= 5 && (
                      <span className="font-pixel text-[8px] md:text-[9px] text-yellow-400 uppercase whitespace-nowrap">{item.daysUntilQualityDecline}D</span>
                    )}
                  </div>
                  <p className={`text-[10px] md:text-[11px] truncate ${isUrgent ? "text-red-300/50" : "text-muted"}`}>
                    {item.quantity} · {item.location}
                  </p>
                </div>

                <p className="text-display text-base md:text-lg flex-shrink-0">${item.purchasePrice.toFixed(2)}</p>
              </div>

              {/* Bottom row: buttons */}
              <div className="flex gap-1.5 ml-5 md:ml-[4.5rem]">
                <button onClick={() => markItem(item.id, "consumed")} className="btn btn-eat flex-1 !text-[9px] !px-2 !py-1">EATEN</button>
                {item.location !== "freezer" && (
                  <button onClick={() => markItem(item.id, "frozen", { location: "freezer" })} className="btn btn-freeze flex-1 !text-[9px] !px-2 !py-1">FREEZE</button>
                )}
                <button onClick={() => markItem(item.id, "discarded")} className="btn btn-danger flex-1 !text-[9px] !px-2 !py-1">TOSS</button>
              </div>
            </div>
          );
        })}
      </div>

      {items.length > 0 && (
        <div className="mt-6 md:mt-8 text-center">
          <Link href="/recipes" className="font-pixel text-xs text-muted hover:text-foreground uppercase tracking-wider underline underline-offset-4">
            FIND RECIPES USING THESE ITEMS →
          </Link>
        </div>
      )}
    </div>
  );
}
