"use client";

import { useEffect, useState, useCallback } from "react";

type Stats = {
  wastedValue: number;
  savedValue: number;
  itemsConsumed: number;
  itemsDiscarded: number;
  discardedItems: { name: string; price: number }[];
};

type InventoryItem = {
  purchasePrice: number;
  category: string;
  status: string;
};

// Mock monthly history for demo
const MOCK_MONTHS = [
  { month: "Jan", saved: 42.50, wasted: 18.30 },
  { month: "Feb", saved: 56.20, wasted: 12.10 },
  { month: "Mar", saved: 61.80, wasted: 9.50 },
  { month: "Apr", saved: 0, wasted: 0 }, // current — filled from live data
];

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [s, inv] = await Promise.all([
      fetch("/api/stats").then((r) => r.json()),
      fetch("/api/inventory").then((r) => r.json()),
    ]);
    setStats(s);
    setInventory(inv);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <div className="max-w-4xl mx-auto py-20"><p className="font-pixel text-muted text-sm">LOADING...</p></div>;

  const totalStock = inventory.reduce((sum: number, i: InventoryItem) => sum + i.purchasePrice, 0);
  const saved = stats?.savedValue || 0;
  const wasted = stats?.wastedValue || 0;
  const net = saved - wasted;

  // Fill current month with live data
  const months = MOCK_MONTHS.map((m, i) =>
    i === MOCK_MONTHS.length - 1 ? { ...m, saved, wasted } : m
  );

  const allTimeSaved = months.reduce((s, m) => s + m.saved, 0);
  const allTimeWasted = months.reduce((s, m) => s + m.wasted, 0);
  const allTimeNet = allTimeSaved - allTimeWasted;
  const maxBar = Math.max(...months.map((m) => Math.max(m.saved, m.wasted)), 1);

  // Category breakdown from inventory
  const categories: Record<string, number> = {};
  inventory.forEach((item: InventoryItem) => {
    categories[item.category] = (categories[item.category] || 0) + item.purchasePrice;
  });
  const sortedCategories = Object.entries(categories).sort((a, b) => b[1] - a[1]);
  const maxCat = sortedCategories[0]?.[1] || 1;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-2">// ANALYTICS</p>
        <h2 className="text-display text-4xl">Monthly<br/>+/−</h2>
      </div>

      {/* Big numbers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <div className="bg-gradient-to-br from-emerald-950/50 to-emerald-900/15 border border-emerald-500/15 rounded-2xl p-4 md:p-5">
          <p className="text-display text-2xl md:text-3xl text-safe">${saved.toFixed(2)}</p>
          <p className="font-pixel text-[9px] text-safe/60 uppercase mt-1.5">Saved This Month</p>
        </div>
        <div className="bg-gradient-to-br from-red-950/50 to-red-900/15 border border-red-500/15 rounded-2xl p-4 md:p-5">
          <p className="text-display text-2xl md:text-3xl text-danger">${wasted.toFixed(2)}</p>
          <p className="font-pixel text-[9px] text-danger/60 uppercase mt-1.5">Wasted This Month</p>
        </div>
        <div className={`border rounded-2xl p-4 md:p-5 ${net >= 0
          ? "bg-gradient-to-br from-emerald-950/30 to-card border-emerald-500/10"
          : "bg-gradient-to-br from-red-950/30 to-card border-red-500/10"
        }`}>
          <p className={`text-display text-2xl md:text-3xl ${net >= 0 ? "text-safe" : "text-danger"}`}>
            {net >= 0 ? "+" : "−"}${Math.abs(net).toFixed(2)}
          </p>
          <p className="font-pixel text-[9px] text-muted uppercase mt-1.5">Net This Month</p>
        </div>
        <div className="bg-card border border-card-border rounded-2xl p-4 md:p-5">
          <p className="text-display text-2xl md:text-3xl">${totalStock.toFixed(2)}</p>
          <p className="font-pixel text-[9px] text-muted uppercase mt-1.5">Current Stock</p>
        </div>
      </div>

      {/* Monthly bar chart */}
      <div className="bg-card border border-card-border rounded-2xl p-5 md:p-6 mb-6 transition-all duration-200 hover:border-white/20">
        <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-6">// SAVED VS WASTED BY MONTH</p>
        <div className="space-y-4">
          {months.map((m) => (
            <div key={m.month} className="flex items-center gap-4">
              <span className="font-pixel text-xs text-muted w-8">{m.month}</span>
              <div className="flex-1 flex flex-col gap-1.5">
                {/* Saved bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-4 bg-white/[0.03] rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-safe/40 to-safe/20 rounded-lg transition-all duration-500"
                      style={{ width: `${(m.saved / maxBar) * 100}%` }}
                    />
                  </div>
                  <span className="font-pixel text-[10px] text-safe w-16 text-right">+${m.saved.toFixed(0)}</span>
                </div>
                {/* Wasted bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-4 bg-white/[0.03] rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-danger/40 to-danger/20 rounded-lg transition-all duration-500"
                      style={{ width: `${(m.wasted / maxBar) * 100}%` }}
                    />
                  </div>
                  <span className="font-pixel text-[10px] text-danger w-16 text-right">−${m.wasted.toFixed(0)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Legend */}
        <div className="flex gap-6 mt-5 pt-4 border-t border-card-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-safe/40" />
            <span className="font-pixel text-[9px] text-muted">SAVED</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-danger/40" />
            <span className="font-pixel text-[9px] text-muted">WASTED</span>
          </div>
        </div>
      </div>

      {/* All-time totals */}
      <div className="glass rounded-2xl p-5 md:p-6 mb-6">
        <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-4">// ALL TIME</p>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-display text-2xl text-safe">${allTimeSaved.toFixed(2)}</p>
            <p className="font-pixel text-[9px] text-muted uppercase mt-1">Total Saved</p>
          </div>
          <div>
            <p className="text-display text-2xl text-danger">${allTimeWasted.toFixed(2)}</p>
            <p className="font-pixel text-[9px] text-muted uppercase mt-1">Total Wasted</p>
          </div>
          <div>
            <p className={`text-display text-2xl ${allTimeNet >= 0 ? "text-safe" : "text-danger"}`}>
              {allTimeNet >= 0 ? "+" : "−"}${Math.abs(allTimeNet).toFixed(2)}
            </p>
            <p className="font-pixel text-[9px] text-muted uppercase mt-1">Net Impact</p>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="bg-card border border-card-border rounded-2xl p-5 md:p-6 mb-6 transition-all duration-200 hover:border-white/20">
        <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-5">// STOCK BY CATEGORY</p>
        <div className="space-y-3">
          {sortedCategories.map(([cat, val]) => (
            <div key={cat} className="flex items-center gap-3">
              <span className="font-pixel text-[10px] text-muted uppercase w-20">{cat}</span>
              <div className="flex-1 h-5 bg-white/[0.03] rounded-lg overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-white/15 to-white/5 rounded-lg"
                  style={{ width: `${(val / maxCat) * 100}%` }}
                />
              </div>
              <span className="font-pixel text-[10px] text-foreground w-14 text-right">${val.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Wasted items detail */}
      {stats && stats.itemsDiscarded > 0 && (
        <div className="bg-gradient-to-br from-red-950/40 to-red-900/10 border border-red-500/15 rounded-2xl p-5 md:p-6">
          <p className="font-pixel text-[10px] text-danger/60 uppercase tracking-[0.2em] mb-3">// ITEMS LOST</p>
          <div className="space-y-2">
            {stats.discardedItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <span className="text-sm">{item.name}</span>
                <span className="font-pixel text-xs text-danger">−${item.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
