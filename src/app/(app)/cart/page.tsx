"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ShoppingCart as ShoppingCartIcon } from "lucide-react";
import { ShoppingCart, ScoredRecipe, FoodCategory } from "@/lib/types";
import FridgeMascot from "@/components/mascot/FridgeMascot";

export default function CartPage() {
  const [carts, setCarts] = useState<ShoppingCart[]>([]);
  const [recipes, setRecipes] = useState<ScoredRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newCartName, setNewCartName] = useState("");
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<FoodCategory>("other");
  const [newItemQty, setNewItemQty] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [cartsData, recipesData] = await Promise.all([
      fetch("/api/carts").then((r) => r.json()),
      fetch("/api/recipes").then((r) => r.json()),
    ]);
    setCarts(cartsData);
    setRecipes(recipesData);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function createCart() {
    if (!newCartName.trim()) return;
    await fetch("/api/carts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCartName }),
    });
    setNewCartName("");
    setCreating(false);
    fetchData();
  }

  async function createCartFromRecipe(sr: ScoredRecipe) {
    const items = sr.missingIngredients.map((ing) => ({
      name: ing.name,
      quantity: ing.amount,
      estimatedPrice: 3.99,
      fromRecipeId: sr.recipe.id,
    }));
    await fetch("/api/carts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `For: ${sr.recipe.name}`,
        items,
      }),
    });
    showFeedback(`Cart created for ${sr.recipe.name}`);
    fetchData();
  }

  async function toggleItem(cartId: string, itemId: string) {
    await fetch(`/api/carts/${cartId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toggleItemId: itemId }),
    });
    fetchData();
  }

  async function removeItem(cartId: string, itemId: string) {
    await fetch(`/api/carts/${cartId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removeItemId: itemId }),
    });
    fetchData();
  }

  async function addItemToCart(cartId: string) {
    if (!newItemName.trim()) return;
    await fetch(`/api/carts/${cartId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addItem: {
          name: newItemName,
          category: newItemCategory,
          quantity: newItemQty || "1",
          estimatedPrice: parseFloat(newItemPrice) || 0,
        },
      }),
    });
    setNewItemName("");
    setNewItemQty("");
    setNewItemPrice("");
    setAddingTo(null);
    fetchData();
  }

  async function deleteCart(cartId: string) {
    await fetch(`/api/carts/${cartId}`, { method: "DELETE" });
    fetchData();
  }

  function showFeedback(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2000);
  }

  const recipesWithMissing = recipes.filter((sr) => sr.missingIngredients.length > 0);

  if (loading) {
    return (
      <div className="max-w-4xl flex items-center justify-center py-20">
        <div className="inline-block w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        {/* Instacart logo */}
        <div className="flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="#43B02A"/>
            <path d="M16 6C10.48 6 6 10.48 6 16s4.48 10 10 10 10-4.48 10-10S21.52 6 16 6zm-2 15l-5-5 1.41-1.41L14 18.17l7.59-7.59L23 12l-9 9z" fill="white"/>
          </svg>
          <div>
            <h2 className="text-2xl font-bold">Instacart Lists</h2>
            <p className="text-xs text-muted">Plan shopping carts for missing ingredients</p>
          </div>
        </div>
        <div className="ml-auto">
          {creating ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={newCartName}
                onChange={(e) => setNewCartName(e.target.value)}
                placeholder="Cart name..."
                className="bg-white/75 dark:bg-neutral-900/70 border border-slate-300/70 dark:border-neutral-700 rounded-lg px-3 text-foreground py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && createCart()}
              />
              <button
                onClick={createCart}
                className="bg-white text-black px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-white/90 transition cursor-pointer"
              >
                Create
              </button>
              <button
                onClick={() => setCreating(false)}
                className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 hover:bg-white/50 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/90 transition cursor-pointer"
            >
              + New Cart
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="bg-safe/5 border border-green-200 rounded-lg p-3 text-sm text-green-800 mb-4 animate-pulse">
          {feedback}
        </div>
      )}

      {/* Quick-create from recipes with missing ingredients */}
      {recipesWithMissing.length > 0 && (
        <div className="mb-8">
          <h3 className="font-semibold mb-3 text-sm text-muted uppercase tracking-wide">Quick Cart from Recipes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recipesWithMissing.slice(0, 4).map((sr) => (
              <div
                key={sr.recipe.id}
                className="bg-card border border-card-border rounded-2xl p-4 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-medium text-sm">{sr.recipe.name}</h4>
                  <p className="text-xs text-muted mt-1">
                    Missing: {sr.missingIngredients.map((i) => i.name).join(", ")}
                  </p>
                  <p className="text-xs text-muted">
                    ~${(sr.missingIngredients.length * 3.99).toFixed(2)} estimated
                  </p>
                </div>
                <button
                  onClick={() => createCartFromRecipe(sr)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-safe/10 text-safe hover:bg-safe/20 transition cursor-pointer flex-shrink-0 ml-3"
                >
                  Create Cart
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing carts */}
      {carts.length === 0 ? (
        <div className="text-center py-12 panel flex flex-col items-center">
          <div className="bg-card border border-card-border rounded-xl px-3 py-1.5 mb-2 text-xs text-muted">Need groceries?</div>
          <div className="mb-3 text-slate-400 dark:text-slate-500"><FridgeMascot size={40} waving /></div>
          <p className="text-muted mb-2">No shopping carts yet</p>
          <p className="text-xs text-muted">Create one above or build a cart from a recipe with missing ingredients.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {carts.map((cart) => {
            const total = cart.items.reduce((sum, i) => sum + i.estimatedPrice, 0);
            const checkedCount = cart.items.filter((i) => i.checked).length;

            return (
              <div key={cart.id} className="bg-card border border-card-border rounded-2xl overflow-hidden">
                {/* Cart header */}
                <div className="p-4 border-b border-slate-300/60 flex items-center justify-between bg-white/50">
                  <div className="flex items-center gap-3">
                    <ShoppingCartIcon className="w-5 h-5 text-slate-700" strokeWidth={1.75} />
                    <div>
                      <h3 className="font-semibold">{cart.name}</h3>
                      <p className="text-xs text-muted">
                        {cart.items.length} item{cart.items.length !== 1 ? "s" : ""} · ~${total.toFixed(2)} estimated
                        {checkedCount > 0 && ` · ${checkedCount} checked off`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAddingTo(addingTo === cart.id ? null : cart.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-safe/10 text-safe hover:bg-safe/20 transition cursor-pointer"
                    >
                      + Add Item
                    </button>
                    <button
                      onClick={() => deleteCart(cart.id)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 transition cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Add item inline form */}
                {addingTo === cart.id && (
                  <div className="p-4 border-b border-slate-300/60 bg-safe/5">
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1">Item</label>
                        <input
                          type="text"
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          placeholder="e.g., Soy Sauce"
                          className="w-full bg-white/75 dark:bg-neutral-900/70 border border-slate-300/70 dark:border-neutral-700 rounded-lg px-3 text-foreground py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                          autoFocus
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-xs font-medium mb-1">Qty</label>
                        <input
                          type="text"
                          value={newItemQty}
                          onChange={(e) => setNewItemQty(e.target.value)}
                          placeholder="1"
                          className="w-full bg-white/75 dark:bg-neutral-900/70 border border-slate-300/70 dark:border-neutral-700 rounded-lg px-3 text-foreground py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="w-24">
                        <label className="block text-xs font-medium mb-1">Price</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newItemPrice}
                          onChange={(e) => setNewItemPrice(e.target.value)}
                          placeholder="3.99"
                          className="w-full bg-white/75 dark:bg-neutral-900/70 border border-slate-300/70 dark:border-neutral-700 rounded-lg px-3 text-foreground py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      <div className="w-28">
                        <label className="block text-xs font-medium mb-1">Category</label>
                        <select
                          value={newItemCategory}
                          onChange={(e) => setNewItemCategory(e.target.value as FoodCategory)}
                          className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="protein">Protein</option>
                          <option value="dairy">Dairy</option>
                          <option value="produce">Produce</option>
                          <option value="grain">Grain</option>
                          <option value="condiment">Condiment</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <button
                        onClick={() => addItemToCart(cart.id)}
                        className="bg-white text-black px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-white/90 transition cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* Cart items */}
                <div className="divide-y divide-gray-100">
                  {cart.items.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted">
                      No items yet — add some above
                    </div>
                  ) : (
                    cart.items.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 px-4 flex items-center gap-3 ${item.checked ? "bg-white/50 opacity-60" : ""}`}
                      >
                        <button
                          onClick={() => toggleItem(cart.id, item.id)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition ${
                            item.checked
                              ? "bg-safe/50 border-green-500 text-white"
                              : "border-gray-300 hover:border-green-400"
                          }`}
                        >
                          {item.checked && (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                        <div className="flex-1">
                          <span className={`text-sm ${item.checked ? "line-through text-muted" : "font-medium"}`}>
                            {item.name}
                          </span>
                          <span className="text-xs text-muted ml-2">{item.quantity}</span>
                        </div>
                        <span className="text-sm text-muted">${item.estimatedPrice.toFixed(2)}</span>
                        <button
                          onClick={() => removeItem(cart.id, item.id)}
                          className="text-gray-400 hover:text-red-500 transition cursor-pointer text-sm"
                          title="Remove"
                        >
                          ×
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Cart footer */}
                {cart.items.length > 0 && (
                  <div className="p-3 px-4 border-t border-slate-300/60 bg-white/50 flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      Total: ${total.toFixed(2)}
                    </span>
                    <a
                      href="https://www.instacart.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-4 py-1.5 rounded-lg bg-white text-black hover:bg-white/90 transition cursor-pointer font-medium"
                    >
                      Open Instacart
                    </a>
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
