"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FoodCategory, StorageLocation } from "@/lib/types";
import QRUploadFlow from "@/components/qr/QRUploadFlow";
import BarcodeScanner from "@/components/BarcodeScanner";
import RunningFridge from "@/components/loading/RunningFridge";
import { Camera } from "lucide-react";

export default function AddItemWrapper() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto py-20"><p className="font-pixel text-muted text-sm">LOADING...</p></div>}>
      <AddItemPage />
    </Suspense>
  );
}

type DetectedItem = {
  name: string;
  category: string;
  estimatedPrice: number;
  quantity: string;
  selected: boolean;
  bestByDate: string;
};

function AddItemPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"manual" | "qr" | "camera" | "barcode">("manual");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [barcodeLoading, setBarcodeLoading] = useState(false);
  const [barcodeResult, setBarcodeResult] = useState<{name: string; brand: string; category: string; quantity: string; imageUrl: string | null} | null>(null);
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<FoodCategory>("other");
  const [location, setLocation] = useState<StorageLocation>("fridge");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [bestBy, setBestBy] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cameraPreview, setCameraPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[] | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [addingItems, setAddingItems] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle barcode returned from /scan page
  useEffect(() => {
    const code = searchParams.get("barcode");
    if (code && code.length >= 4) {
      setMode("barcode");
      setBarcodeInput(code);
      (async () => {
        setBarcodeLoading(true);
        setBarcodeError(null);
        try {
          const res = await fetch(`/api/barcode?code=${code}`);
          const data = await res.json();
          if (res.ok) { setBarcodeResult(data); } else { setBarcodeError(data.error || "Product not found"); }
        } catch { setBarcodeError("Lookup failed"); }
        setBarcodeLoading(false);
      })();
      // Clean URL
      router.replace("/add-item", { scroll: false });
    }
  }, [searchParams, router]);

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
    setAnalyzeError(null);
    setDetectedItems(null);
    const reader = new FileReader();
    reader.onload = () => setCameraPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleAnalyze() {
    if (!cameraPreview) return;
    setAnalyzing(true);
    setAnalyzeError(null);

    try {
      const res = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: cameraPreview }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAnalyzeError(data.error || "Analysis failed");
        setAnalyzing(false);
        return;
      }

      if (data.items && data.items.length > 0) {
        setDetectedItems(data.items.map((item: DetectedItem) => ({ ...item, selected: true, bestByDate: "" })));
      } else {
        setAnalyzeError("No food items detected. Try a clearer photo.");
      }
    } catch {
      setAnalyzeError("Failed to connect to vision API");
    }

    setAnalyzing(false);
  }

  async function handleAddDetectedItems() {
    if (!detectedItems) return;
    setAddingItems(true);

    const selected = detectedItems.filter((item) => item.selected);
    for (const item of selected) {
      await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.name,
          category: item.category,
          location,
          quantity: item.quantity,
          purchasePrice: item.estimatedPrice,
          bestByDate: item.bestByDate || null,
        }),
      });
    }

    setAddingItems(false);
    setDetectedItems(null);
    setCameraPreview(null);
    setSaved(true);
  }

  function toggleItem(index: number) {
    if (!detectedItems) return;
    setDetectedItems(detectedItems.map((item, i) =>
      i === index ? { ...item, selected: !item.selected } : item
    ));
  }

  function resetCamera() {
    setCameraPreview(null);
    setDetectedItems(null);
    setAnalyzeError(null);
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
      <div className="flex gap-1 mb-6 bg-card border border-card-border rounded-xl p-1 w-fit overflow-x-auto">
        {[
          { key: "manual" as const, label: "MANUAL", href: null },
          { key: "camera" as const, label: "CAMERA", href: null },
          { key: "barcode" as const, label: "BARCODE", href: "/scan" },
          { key: "qr" as const, label: "QR SCAN", href: null },
        ].map((m) => (
          m.href ? (
            <Link key={m.key} href={m.href}
              className={`font-pixel text-[10px] px-4 py-2 rounded-lg transition-all cursor-pointer ${
                mode === m.key ? "bg-white text-black font-bold" : "text-muted hover:text-foreground"
              }`}>{m.label}</Link>
          ) : (
            <button key={m.key} onClick={() => { setMode(m.key); setSaved(false); }}
              className={`font-pixel text-[10px] px-4 py-2 rounded-lg transition-all cursor-pointer ${
                mode === m.key ? "bg-white text-black font-bold" : "text-muted hover:text-foreground"
              }`}>{m.label}</button>
          )
        ))}
      </div>

      {saved && (
        <div className="bg-gradient-to-r from-emerald-200/50 to-emerald-100/20 border border-emerald-500/20 rounded-2xl p-4 mb-5">
          <p className="text-sm">Items added to inventory!{" "}
            <button onClick={() => setSaved(false)} className="underline cursor-pointer">Add more</button>
            {" · "}
            <button onClick={() => router.push("/inventory")} className="underline cursor-pointer">View inventory</button>
          </p>
        </div>
      )}

      {/* ── MANUAL ── */}
      {mode === "manual" && (
        <form onSubmit={handleSubmit} className="bg-card border border-card-border rounded-2xl p-5 md:p-6 space-y-4">
          <div>
            <label className="block text-xs font-pixel text-muted uppercase mb-1.5">Item Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full bg-white/75 dark:bg-neutral-900/70 border border-slate-300/70 dark:border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-sky-400 transition" placeholder="e.g., Chicken Breast" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-pixel text-muted uppercase mb-1.5">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as FoodCategory)}
                className="w-full bg-white/75 dark:bg-neutral-900/70 border border-slate-300/70 dark:border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-sky-400 transition">
                <option value="protein">Protein</option><option value="dairy">Dairy</option><option value="produce">Produce</option>
                <option value="grain">Grain</option><option value="snack">Snack</option><option value="beverage">Beverage</option>
                <option value="condiment">Condiment</option><option value="frozen">Frozen</option><option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-pixel text-muted uppercase mb-1.5">Location</label>
              <select value={location} onChange={(e) => setLocation(e.target.value as StorageLocation)}
                className="w-full bg-white/75 dark:bg-neutral-900/70 border border-slate-300/70 dark:border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-sky-400 transition">
                <option value="fridge">Fridge</option><option value="freezer">Freezer</option><option value="pantry">Pantry</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-pixel text-muted uppercase mb-1.5">Quantity</label>
              <input type="text" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-white/75 dark:bg-neutral-900/70 border border-slate-300/70 dark:border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-sky-400 transition" placeholder="e.g., 2 lbs" />
            </div>
            <div>
              <label className="block text-xs font-pixel text-muted uppercase mb-1.5">Price ($)</label>
              <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-white/75 dark:bg-neutral-900/70 border border-slate-300/70 dark:border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-sky-400 transition" placeholder="e.g., 8.99" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-pixel text-muted uppercase mb-1.5">Best By Date (optional)</label>
            <input type="date" value={bestBy} onChange={(e) => setBestBy(e.target.value)}
              className="w-full bg-white/75 dark:bg-neutral-900/70 border border-slate-300/70 dark:border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-sky-400 transition" />
          </div>
          <button type="submit" disabled={saving || !name} className="btn btn-primary btn-lg w-full disabled:opacity-50">
            {saving ? "ADDING..." : "ADD TO INVENTORY"}
          </button>
        </form>
      )}

      {/* ── CAMERA ── */}
      {mode === "camera" && (
        <div className="bg-card border border-card-border rounded-2xl p-5 md:p-6">
          <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-4">// SNAP A PHOTO</p>

          {/* Storage location selector */}
          <div className="mb-4">
            <label className="block text-xs font-pixel text-muted uppercase mb-1.5">Add items to</label>
            <div className="flex gap-1 bg-white/60 rounded-lg p-1 w-fit">
              {(["fridge", "freezer", "pantry"] as StorageLocation[]).map((loc) => (
                <button key={loc} onClick={() => setLocation(loc)}
                  className={`font-pixel text-[10px] px-3 py-1.5 rounded-md transition-all cursor-pointer capitalize ${
                    location === loc ? "bg-white text-black font-bold" : "text-muted hover:text-foreground"
                  }`}>{loc}</button>
              ))}
            </div>
          </div>

          {/* Step 1: Capture */}
          {!cameraPreview && !detectedItems && (
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-slate-300/60 rounded-2xl p-12 text-center hover:border-slate-400 transition">
                <Camera className="w-10 h-10 mx-auto mb-3 text-slate-700" strokeWidth={1.75} />
                <p className="font-bold text-sm mb-1">Tap to take a photo</p>
                <p className="text-xs text-muted">Capture your receipt, fridge, or grocery items</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={handleCameraCapture} className="hidden" />
            </label>
          )}

          {/* Step 2: Preview + Analyze */}
          {cameraPreview && !detectedItems && (
            <div className="space-y-4">
              <img src={cameraPreview} alt="Captured" className="w-full rounded-xl max-h-72 object-cover" />

              {analyzing && <RunningFridge />}

              {analyzeError && (
                <div className="bg-gradient-to-r from-rose-200/40 to-rose-100/15 border border-red-500/20 rounded-xl p-3 text-sm text-danger">
                  {analyzeError}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={handleAnalyze} disabled={analyzing} className="btn btn-primary btn-lg flex-1 disabled:opacity-50">
                  {analyzing ? "ANALYZING WITH AI..." : "DETECT ITEMS"}
                </button>
                <button onClick={() => { resetCamera(); fileInputRef.current?.click(); }} disabled={analyzing} className="btn btn-lg disabled:opacity-50">
                  RETAKE
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Review detected items */}
          {detectedItems && (
            <div className="space-y-4">
              {cameraPreview && (
                <img src={cameraPreview} alt="Captured" className="w-full rounded-xl max-h-48 object-cover opacity-60" />
              )}

              <div className="flex items-center justify-between">
                <p className="font-pixel text-[10px] text-muted uppercase tracking-wider">
                  {detectedItems.length} ITEM{detectedItems.length !== 1 ? "S" : ""} DETECTED
                </p>
                <button onClick={() => {
                  setDetectedItems(detectedItems.map((i) => ({ ...i, selected: !detectedItems.every((x) => x.selected) })));
                }} className="font-pixel text-[10px] text-muted hover:text-foreground cursor-pointer underline underline-offset-2">
                  {detectedItems.every((i) => i.selected) ? "DESELECT ALL" : "SELECT ALL"}
                </button>
              </div>

              <div className="space-y-2">
                {detectedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl border transition-all ${
                      item.selected
                        ? "bg-gradient-to-r from-emerald-200/40 to-emerald-100/10 border-emerald-500/20"
                        : "bg-white/50 border-slate-300/50 opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => toggleItem(idx)}>
                      {/* Checkbox */}
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition ${
                        item.selected ? "bg-safe/20 border-safe" : "border-slate-300/60"
                      }`}>
                        {item.selected && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-safe"/>
                          </svg>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm">{item.name}</p>
                        <p className="text-xs text-muted">{item.quantity} · <span className="capitalize">{item.category}</span></p>
                      </div>

                      <span className="font-pixel text-sm text-muted">${item.estimatedPrice.toFixed(2)}</span>
                    </div>

                    {/* Price + Expiration — only show when selected */}
                    {item.selected && (
                      <div className="px-3 pb-3 pl-11 flex flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                          <label className="font-pixel text-[9px] text-muted uppercase whitespace-nowrap">PRICE $</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.estimatedPrice || ""}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              setDetectedItems((prev) =>
                                prev!.map((it, i) => i === idx ? { ...it, estimatedPrice: parseFloat(e.target.value) || 0 } : it)
                              );
                            }}
                            className="bg-white/75 dark:bg-neutral-900/70 border border-slate-300/70 dark:border-neutral-700 rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-sky-400 transition w-20"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="font-pixel text-[9px] text-muted uppercase whitespace-nowrap">EXPIRES</label>
                          <input
                            type="date"
                            value={item.bestByDate}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              setDetectedItems((prev) =>
                                prev!.map((it, i) => i === idx ? { ...it, bestByDate: e.target.value } : it)
                              );
                            }}
                            className="bg-white/75 dark:bg-neutral-900/70 border border-slate-300/70 dark:border-neutral-700 rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-sky-400 transition w-36"
                          />
                          {!item.bestByDate && (
                            <span className="text-[10px] text-muted italic">optional</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={handleAddDetectedItems}
                  disabled={addingItems || !detectedItems.some((i) => i.selected)}
                  className="btn btn-primary btn-lg flex-1 disabled:opacity-50"
                >
                  {addingItems ? "ADDING..." : `ADD ${detectedItems.filter((i) => i.selected).length} ITEM${detectedItems.filter((i) => i.selected).length !== 1 ? "S" : ""} TO ${location.toUpperCase()}`}
                </button>
                <button onClick={resetCamera} className="btn btn-lg">CANCEL</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── QR ── */}
      {/* ── BARCODE ── */}
      {mode === "barcode" && (
        <div className="bg-card border border-card-border rounded-2xl p-5 md:p-6">
          <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-4">// SCAN BARCODE</p>

          {/* Barcode scanner link + manual entry */}
          {!barcodeResult && (
            <div className="space-y-4">
              {!barcodeLoading && <BarcodeScanner />}

              {barcodeLoading && (
                <div className="flex items-center justify-center gap-2 py-8">
                  <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
                  <span className="font-pixel text-[10px] text-muted">LOOKING UP PRODUCT...</span>
                </div>
              )}

              {/* Manual fallback */}
              <div className="flex gap-2">
                <input type="text" inputMode="numeric" value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="Or type barcode number..."
                  className="flex-1 bg-white/75 dark:bg-neutral-900/70 border border-slate-300/70 dark:border-neutral-700 rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:border-sky-400 transition" />
                <button onClick={async () => {
                  if (barcodeInput.length < 4) return;
                  setBarcodeLoading(true); setBarcodeError(null); setBarcodeResult(null);
                  try {
                    const res = await fetch(`/api/barcode?code=${barcodeInput}`);
                    const data = await res.json();
                    if (res.ok) { setBarcodeResult(data); } else { setBarcodeError(data.error); }
                  } catch { setBarcodeError("Lookup failed"); }
                  setBarcodeLoading(false);
                }} disabled={barcodeLoading || barcodeInput.length < 4} className="btn btn-primary !text-[9px] disabled:opacity-50">
                  {barcodeLoading ? "..." : "LOOKUP"}
                </button>
              </div>
            </div>
          )}

          {barcodeError && (
            <div className="bg-gradient-to-r from-rose-200/40 to-rose-100/15 border border-red-500/20 rounded-xl p-3 text-sm text-danger mb-4">
              {barcodeError}
              <button onClick={() => { setBarcodeError(null); setBarcodeResult(null); }} className="ml-2 underline text-xs">Try again</button>
            </div>
          )}

          {barcodeResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-emerald-200/40 to-emerald-100/10 border border-emerald-500/20 rounded-xl">
                {barcodeResult.imageUrl && (
                  <img src={barcodeResult.imageUrl} alt={barcodeResult.name} className="w-14 h-14 rounded-lg object-cover bg-white" />
                )}
                <div className="flex-1">
                  <p className="font-bold text-sm">{barcodeResult.name}</p>
                  <p className="text-xs text-muted">{barcodeResult.brand} · {barcodeResult.quantity} · <span className="capitalize">{barcodeResult.category}</span></p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-pixel text-[8px] text-muted uppercase">Price $</label>
                  <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-white/75 dark:bg-neutral-900/70 border border-slate-300/70 dark:border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-sky-400" placeholder="0.00" />
                </div>
                <div>
                  <label className="font-pixel text-[8px] text-muted uppercase">Expires</label>
                  <input type="date" value={bestBy} onChange={(e) => setBestBy(e.target.value)}
                    className="w-full bg-white/75 dark:bg-neutral-900/70 border border-slate-300/70 dark:border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-sky-400" />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    setSaving(true);
                    await fetch("/api/inventory", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        name: barcodeResult.name,
                        category: barcodeResult.category,
                        location,
                        quantity: barcodeResult.quantity,
                        purchasePrice: parseFloat(price) || 0,
                        bestByDate: bestBy || null,
                      }),
                    });
                    setSaving(false);
                    setSaved(true);
                    setBarcodeResult(null);
                    setBarcodeInput("");
                    setPrice("");
                    setBestBy("");
                  }}
                  disabled={saving}
                  className="btn btn-primary btn-lg flex-1 disabled:opacity-50"
                >
                  {saving ? "ADDING..." : "ADD TO INVENTORY"}
                </button>
                <button onClick={() => { setBarcodeResult(null); setBarcodeInput(""); setBarcodeError(null); }} className="btn btn-lg">SCAN AGAIN</button>
              </div>
            </div>
          )}

          {!barcodeResult && !barcodeError && !barcodeLoading && (
            <p className="text-xs text-muted text-center">Type or scan a barcode number (UPC/EAN). Powered by Open Food Facts — free and open source.</p>
          )}
        </div>
      )}

      {/* ── QR ── */}
      {mode === "qr" && <QRUploadFlow />}
    </div>
  );
}
