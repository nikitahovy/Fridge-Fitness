"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FoodCategory, StorageLocation } from "@/lib/types";
import QRUploadFlow from "@/components/qr/QRUploadFlow";

export default function AddItemPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"manual" | "qr" | "camera">("manual");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<FoodCategory>("other");
  const [location, setLocation] = useState<StorageLocation>("fridge");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [bestBy, setBestBy] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cameraPreview, setCameraPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category, location, quantity: quantity || "1", purchasePrice: parseFloat(price) || 0, bestByDate: bestBy || null }),
    });
    setSaving(false);
    setSaved(true);
    setName(""); setQuantity(""); setPrice(""); setBestBy("");
  }

  function handleCameraCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCameraPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleCameraUpload() {
    setUploading(true);
    // Simulate processing
    await new Promise((r) => setTimeout(r, 2000));
    // Add mock items
    const mockItems = [
      { name: "Avocados", category: "produce", purchasePrice: 3.49 },
      { name: "Chicken Thighs", category: "protein", purchasePrice: 7.99 },
      { name: "Tomatoes", category: "produce", purchasePrice: 2.99 },
    ];
    for (const item of mockItems) {
      await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
    }
    setUploading(false);
    setCameraPreview(null);
    setSaved(true);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-2">// ADD ITEM</p>
          <h2 className="text-display text-3xl md:text-4xl">Stock Up</h2>
        </div>
        <Link href="/inventory" className="btn text-[9px]">Inventory →</Link>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6 bg-card border border-card-border rounded-xl p-1 w-fit">
        {[
          { key: "manual" as const, label: "MANUAL" },
          { key: "camera" as const, label: "📷 CAMERA" },
          { key: "qr" as const, label: "QR SCAN" },
        ].map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={`font-pixel text-[10px] px-4 py-2 rounded-lg transition-all cursor-pointer ${
              mode === m.key
                ? "bg-white text-black font-bold"
                : "text-muted hover:text-foreground"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {saved && (
        <div className="bg-gradient-to-r from-emerald-950/50 to-emerald-900/20 border border-emerald-500/20 rounded-2xl p-4 mb-5">
          <p className="text-sm">Items added to inventory!{" "}
            <button onClick={() => setSaved(false)} className="underline cursor-pointer">Add more</button>
            {" · "}
            <button onClick={() => router.push("/inventory")} className="underline cursor-pointer">View inventory</button>
          </p>
        </div>
      )}

      {mode === "manual" && (
        <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-2xl p-5 md:p-6 space-y-4">
          <div>
            <label className="block text-xs font-pixel text-muted uppercase mb-1.5">Item Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-white/30 transition" placeholder="e.g., Chicken Breast" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-pixel text-muted uppercase mb-1.5">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as FoodCategory)}
                className="w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-white/30 transition">
                <option value="protein">Protein</option><option value="dairy">Dairy</option><option value="produce">Produce</option>
                <option value="grain">Grain</option><option value="snack">Snack</option><option value="beverage">Beverage</option>
                <option value="condiment">Condiment</option><option value="frozen">Frozen</option><option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-pixel text-muted uppercase mb-1.5">Location</label>
              <select value={location} onChange={(e) => setLocation(e.target.value as StorageLocation)}
                className="w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-white/30 transition">
                <option value="fridge">Fridge</option><option value="freezer">Freezer</option><option value="pantry">Pantry</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-pixel text-muted uppercase mb-1.5">Quantity</label>
              <input type="text" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-white/30 transition" placeholder="e.g., 2 lbs" />
            </div>
            <div>
              <label className="block text-xs font-pixel text-muted uppercase mb-1.5">Price ($)</label>
              <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-white/30 transition" placeholder="e.g., 8.99" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-pixel text-muted uppercase mb-1.5">Best By Date (optional)</label>
            <input type="date" value={bestBy} onChange={(e) => setBestBy(e.target.value)}
              className="w-full bg-white/[0.06] border border-white/[0.1] rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-white/30 transition" />
          </div>
          <button type="submit" disabled={saving || !name} className="btn btn-primary btn-lg w-full disabled:opacity-50">
            {saving ? "ADDING..." : "ADD TO INVENTORY"}
          </button>
        </form>
      )}

      {mode === "camera" && (
        <div className="bg-card border border-card-border rounded-2xl p-5 md:p-6">
          <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-4">// SNAP A PHOTO</p>
          {!cameraPreview ? (
            <div>
              <label className="block cursor-pointer">
                <div className="border-2 border-dashed border-white/20 rounded-2xl p-12 text-center hover:border-white/40 transition">
                  <div className="text-4xl mb-3">📸</div>
                  <p className="font-bold text-sm mb-1">Tap to take a photo</p>
                  <p className="text-xs text-muted">Capture your receipt or fridge contents</p>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleCameraCapture} className="hidden" />
              </label>
            </div>
          ) : (
            <div className="space-y-4">
              <img src={cameraPreview} alt="Captured" className="w-full rounded-xl max-h-64 object-cover" />
              <div className="flex gap-3">
                <button onClick={handleCameraUpload} disabled={uploading} className="btn btn-primary btn-lg flex-1 disabled:opacity-50">
                  {uploading ? "ANALYZING..." : "DETECT ITEMS"}
                </button>
                <button onClick={() => { setCameraPreview(null); fileInputRef.current?.click(); }} className="btn btn-lg">
                  RETAKE
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === "qr" && <QRUploadFlow />}
    </div>
  );
}
