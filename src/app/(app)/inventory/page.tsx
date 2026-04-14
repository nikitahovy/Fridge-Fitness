"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ItemWithRisk, StorageLocation, FoodCategory } from "@/lib/types";
import FridgeMascot from "@/components/mascot/FridgeMascot";

const LOCATIONS: { key: StorageLocation | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "fridge", label: "Fridge" },
  { key: "freezer", label: "Freezer" },
  { key: "pantry", label: "Pantry" },
];

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-300/60 rounded-lg ${className}`} />;
}

export default function InventoryPage() {
  const [items, setItems] = useState<ItemWithRisk[]>([]);
  const [filter, setFilter] = useState<StorageLocation | "all">("all");
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

  const filtered = filter === "all" ? items : items.filter((i) => i.location === filter);

  // Loading skeletons
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <Skeleton className="w-20 h-3 mb-3" />
            <Skeleton className="w-48 h-10" />
          </div>
          <Skeleton className="w-28 h-10 rounded-xl" />
        </div>
        <div className="flex gap-2 mb-6">
          {[1,2,3,4].map((i) => <Skeleton key={i} className="w-20 h-9 rounded-lg" />)}
        </div>
        <div className="space-y-2">
          {[1,2,3,4,5].map((i) => <Skeleton key={i} className="w-full h-20 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-end justify-between mb-6 md:mb-8">
        <div>
          <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-2">// INVENTORY</p>
          <h2 className="text-display text-3xl md:text-4xl">Your Food</h2>
        </div>
        <Link href="/add-item" className="btn btn-primary btn-lg">+ ADD</Link>
      </div>

      {actionFeedback && (
        <div className="bg-card border border-card-border rounded-xl px-4 py-3 text-sm font-medium mb-5">{actionFeedback}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-card border border-card-border rounded-xl p-1 mb-6 w-fit overflow-x-auto">
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

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto mb-4 text-slate-400 dark:text-slate-500"><FridgeMascot size={40} /></div>
          <p className="text-display text-2xl mb-3">Empty</p>
          <Link href="/add-item" className="font-pixel text-xs text-muted hover:text-foreground uppercase tracking-wider underline underline-offset-4">
            ADD YOUR FIRST ITEM →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const isUrgent = item.riskTier === "use-today";
            const isFrozen = item.riskTier === "frozen";
            const isEditing = editingId === item.id;

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
                  <div className="p-3 md:p-4">
                    <div className="flex items-center gap-2 md:gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-sm truncate">{item.name}</h4>
                          <span className={`font-pixel text-[8px] md:text-[9px] uppercase tracking-wider font-bold ${
                            isUrgent ? "text-rose-700 dark:text-rose-300" : item.riskTier === "use-this-week" ? "text-amber-700 dark:text-amber-300"
                            : isFrozen ? "text-sky-700 dark:text-sky-300" : "text-emerald-700 dark:text-emerald-300"
                          }`}>
                            {isUrgent ? "TODAY" : item.riskTier === "use-this-week" ? `${item.daysUntilQualityDecline}D`
                            : isFrozen ? "FROZEN" : "SAFE"}
                          </span>
                        </div>
                        <p className="text-[10px] md:text-[11px] text-muted truncate">
                          {item.quantity} · {item.location} · {item.category}
                          {isFrozen && " · paused"}
                        </p>
                        {item.reason && (
                          <p className="text-[10px] text-slate-500/70 truncate mt-0.5">
                            {item.reason}{item.confidence < 0.6 ? " · ~estimate" : ""}
                          </p>
                        )}
                      </div>
                      <p className="text-display text-base md:text-lg flex-shrink-0">${item.purchasePrice.toFixed(2)}</p>
                    </div>

                    {/* Buttons row */}
                    <div className="flex gap-1.5 flex-wrap">
                      {!isFrozen
                        && !item.openedAt
                        && item.status === "active"
                        && item.category !== "produce"  // produce doesn't have an "opened" state
                        && item.category !== "protein"  // whole proteins (chicken, steak) don't either
                        && item.riskTier !== "use-today"  // already expired — opening doesn't bring it back
                        && (
                        <button
                          onClick={() => updateItem(item.id, { openedAt: new Date().toISOString().split("T")[0] })}
                          className="btn flex-1 !text-[9px] !px-2 !py-1"
                        >
                          OPEN
                        </button>
                      )}
                      <button onClick={() => updateItem(item.id, { status: "consumed" })} className="btn btn-eat flex-1 !text-[9px] !px-2 !py-1">EATEN</button>
                      {isFrozen ? (
                        <button
                          onClick={() => updateItem(item.id, { status: "active", location: "fridge" })}
                          title="Thawing starts a shorter freshness window"
                          className="btn btn-freeze flex-1 !text-[9px] !px-2 !py-1"
                        >
                          THAW
                        </button>
                      ) : (
                        <button onClick={() => updateItem(item.id, { status: "frozen", location: "freezer" })} className="btn btn-freeze flex-1 !text-[9px] !px-2 !py-1">FREEZE</button>
                      )}
                      <button onClick={() => updateItem(item.id, { status: "discarded" })} className="btn btn-danger flex-1 !text-[9px] !px-2 !py-1">TOSS</button>
                      <button onClick={() => startEdit(item)} className="btn !text-[9px] !px-2 !py-1">EDIT</button>
                      <button onClick={() => deleteItem(item.id)} className="btn btn-danger !text-[9px] !px-2 !py-1">DEL</button>
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
