"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Camera, ArrowRight } from "lucide-react";

type Nutriments = { sugar: number; salt: number; saturatedFat: number; calories: number; fiber: number; protein: number; carbs?: number; fat?: number };

type HealthData = {
  product: { name: string; brand: string; imageUrl: string | null; quantity: string; servingSize: string | null; barcode: string };
  type: "food" | "skincare";
  score: number;
  grade: string;
  gradeColor: string;
  nutritionScore?: number;
  additivePenalty?: number;
  badPenalty?: number;
  goodCount?: number;
  organicBonus: number;
  isOrganic: boolean;
  hasHighRisk: boolean;
  highRiskCount: number;
  trafficLights?: { sugar: string; salt: string; saturatedFat: string; calories: string };
  additives: { code: string; name: string; risk: string; concern?: string }[];
  nutriments?: Nutriments;
  perServing: Nutriments | null;
  total: Nutriments | null;
  dataCompleteness: { hasProtein: boolean; hasCarbs: boolean; hasFat: boolean; hasFiber: boolean; hasCalories: boolean } | null;
  totalSize: string | null;
  ingredientCount?: number;
};

function HealthScoreContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [viewMode, setViewMode] = useState<"serving" | "total">("serving");

  const barcode = searchParams.get("barcode");

  useEffect(() => {
    if (!barcode) { setLoading(false); return; }
    (async () => {
      try {
        const res = await fetch(`/api/health-score?code=${barcode}`);
        const d = await res.json();
        if (res.ok) { setData(d); } else { setError(d.error || "Product not found"); }
      } catch { setError("Failed to analyze"); }
      setLoading(false);
    })();
  }, [barcode]);

  async function lookupManual() {
    if (manualCode.length < 4) return;
    setLoading(true); setError(null); setData(null);
    try {
      const res = await fetch(`/api/health-score?code=${manualCode}`);
      const d = await res.json();
      if (res.ok) { setData(d); } else { setError(d.error || "Product not found"); }
    } catch { setError("Failed to analyze"); }
    setLoading(false);
  }

  const tlColor = (level: string) => level === "high" ? "text-danger" : level === "moderate" ? "text-yellow-400" : "text-safe";
  const tlBg = (level: string) => level === "high" ? "from-rose-200/50 to-rose-100/15 border-red-500/15" : level === "moderate" ? "from-amber-200/30 to-card border-yellow-500/15" : "from-emerald-200/40 to-emerald-100/10 border-emerald-500/15";
  const riskColor = (risk: string) => risk === "high" ? "bg-danger/15 text-danger border-danger/20" : risk === "moderate" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" : risk === "low" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-white/60 text-muted border-white/10";

  if (loading) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="mb-8"><div className="animate-pulse bg-slate-300/60 rounded-lg w-24 h-3 mb-3" /><div className="animate-pulse bg-slate-300/60 rounded-lg w-48 h-10" /></div>
        <div className="animate-pulse bg-slate-300/60 rounded-2xl h-64" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-2">// HEALTH SCORE</p>
        <h2 className="text-display text-3xl md:text-4xl">How<br/>Healthy?</h2>
      </div>

      {/* No barcode — show scan + manual entry */}
      {!barcode && !data && (
        <div className="space-y-4">
          <Link
            href="/health-scan"
            className="block rounded-2xl p-6 transition-all duration-200 group
              bg-gradient-to-br from-sky-400 via-sky-500 to-sky-600
              dark:from-sky-600 dark:via-sky-700 dark:to-sky-800
              border border-sky-300/70 dark:border-sky-500/40
              shadow-[0_8px_24px_rgba(56,128,200,0.35),inset_0_1px_0_rgba(255,255,255,0.4)]
              dark:shadow-[0_8px_24px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)]
              hover:shadow-[0_12px_32px_rgba(56,128,200,0.45),inset_0_1px_0_rgba(255,255,255,0.5)]
              hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/25 dark:bg-white/15 border border-white/40 flex items-center justify-center flex-shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
                <Camera className="w-7 h-7 text-white" strokeWidth={2.25} />
              </div>
              <div className="flex-1">
                <p className="font-pixel text-[9px] text-white/80 uppercase tracking-[0.2em] mb-1">// TAP TO SCAN</p>
                <p className="text-display text-xl text-white leading-tight">Scan Food or Skincare</p>
                <p className="text-xs text-white/85 mt-1">Instant 0-100 health score</p>
              </div>
              <ArrowRight className="w-6 h-6 text-white flex-shrink-0 transition-transform group-hover:translate-x-1" strokeWidth={2.25} />
            </div>
          </Link>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-card-border rounded-2xl p-4">
              <p className="font-pixel text-[9px] text-muted uppercase tracking-wider mb-2">// FOOD &amp; DRINKS</p>
              <p className="text-xs text-muted leading-relaxed">Nutrition quality, sugar / salt / fat, and 300+ E-number additives flagged by risk level.</p>
            </div>
            <div className="bg-card border border-card-border rounded-2xl p-4">
              <p className="font-pixel text-[9px] text-muted uppercase tracking-wider mb-2">// SKINCARE &amp; COSMETICS</p>
              <p className="text-xs text-muted leading-relaxed">Parabens, SLS, phthalates, oxybenzone &amp; 40+ ingredients screened. Powered by Open Beauty Facts.</p>
            </div>
          </div>

          <div className="flex gap-2">
            <input type="text" inputMode="numeric" value={manualCode} onChange={(e) => setManualCode(e.target.value.replace(/\D/g, ""))}
              placeholder="Or type barcode number..."
              className="flex-1 bg-white/75 dark:bg-neutral-900/70 border border-slate-300/70 dark:border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-sky-400 transition" />
            <button onClick={lookupManual} disabled={manualCode.length < 4} className="btn btn-primary disabled:opacity-50">ANALYZE</button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-gradient-to-r from-rose-200/40 to-rose-100/15 border border-red-500/20 rounded-2xl p-4 mb-4">
          <p className="text-sm text-danger">{error}</p>
          <Link href="/health-scan" className="btn btn-primary mt-3 inline-block">SCAN AGAIN</Link>
        </div>
      )}

      {data && (
        <div className="space-y-5">
          {/* Product info */}
          <div className="glass rounded-2xl p-5 flex items-center gap-4">
            {data.product.imageUrl && (
              <img src={data.product.imageUrl} alt={data.product.name} className="w-16 h-16 rounded-xl object-cover bg-white flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate">{data.product.name}</p>
              <p className="text-xs text-muted">{data.product.brand} · {data.product.quantity}</p>
            </div>
          </div>

          {/* Score circle */}
          <div className="glass rounded-2xl p-6 text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                <circle cx="60" cy="60" r="52" fill="none"
                  stroke={data.gradeColor} strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={`${data.score * 3.267} 326.7`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-display text-4xl" style={{ color: data.gradeColor }}>{data.score}</span>
                <span className="font-pixel text-[9px] text-muted uppercase">/100</span>
              </div>
            </div>
            <p className="text-display text-xl" style={{ color: data.gradeColor }}>{data.grade}</p>
            <p className="font-pixel text-[9px] text-muted mt-1 uppercase">{data.type === "skincare" ? "SKINCARE / COSMETIC" : "FOOD / BEVERAGE"}</p>
            {data.isOrganic && <p className="font-pixel text-[9px] text-safe mt-1">ORGANIC +{data.organicBonus} BONUS</p>}
            {data.hasHighRisk && (
              <p className="font-pixel text-[9px] text-danger mt-1">
                SCORE CAPPED — {data.highRiskCount} HIGH-RISK {data.type === "skincare" ? "INGREDIENT" : "ADDITIVE"}{data.highRiskCount > 1 ? "S" : ""}
              </p>
            )}
          </div>

          {/* Score breakdown */}
          <div className="bg-card border border-card-border rounded-2xl p-5">
            <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-4">// BREAKDOWN</p>
            <div className="space-y-3">
              {data.type === "food" && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Nutrition Quality</span>
                  <span className="font-pixel text-sm text-safe">+{data.nutritionScore}</span>
                </div>
              )}
              {data.type === "skincare" && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Good Ingredients</span>
                  <span className="font-pixel text-sm text-safe">+{data.goodCount || 0} found</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm">{data.type === "skincare" ? "Harmful Ingredients" : "Additives Penalty"}</span>
                <span className="font-pixel text-sm text-danger">{(data.badPenalty || data.additivePenalty || 0) > 0 ? `-${data.badPenalty || data.additivePenalty}` : "0"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Organic Bonus</span>
                <span className="font-pixel text-sm text-safe">+{data.organicBonus}</span>
              </div>
            </div>
          </div>

          {/* Per Serving / Total toggle — food only */}
          {data.type === "food" && data.perServing && data.total && (() => {
            const hasServing = data.perServing.calories > 0 || data.perServing.sugar > 0;
            const n = viewMode === "total" ? data.total : (hasServing ? data.perServing : data.total);
            const label = viewMode === "total"
              ? (data.totalSize || data.product.quantity || "total")
              : (data.product.servingSize || "serving");

            return (
              <>
                <div className="flex gap-1 bg-card border border-card-border rounded-xl p-1 w-fit mx-auto">
                  <button onClick={() => setViewMode("serving")}
                    className={`font-pixel text-[10px] px-4 py-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "serving" ? "bg-white text-black font-bold" : "text-muted"}`}>
                    PER SERVING
                  </button>
                  <button onClick={() => setViewMode("total")}
                    className={`font-pixel text-[10px] px-4 py-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "total" ? "bg-white text-black font-bold" : "text-muted"}`}>
                    TOTAL
                  </button>
                </div>

                {/* Traffic lights */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Sugar", value: `${n.sugar.toFixed(1)}g`, level: data.trafficLights!.sugar },
                    { label: "Salt", value: `${n.salt.toFixed(1)}g`, level: data.trafficLights!.salt },
                    { label: "Sat. Fat", value: `${n.saturatedFat.toFixed(1)}g`, level: data.trafficLights!.saturatedFat },
                    { label: "Calories", value: `${n.calories.toFixed(0)} kcal`, level: data.trafficLights!.calories },
                  ].map((item) => (
                    <div key={item.label} className={`bg-gradient-to-br ${tlBg(item.level)} border rounded-2xl p-3`}>
                      <p className={`text-display text-lg ${tlColor(item.level)}`}>{item.value}</p>
                      <p className="font-pixel text-[8px] text-muted uppercase mt-0.5">{item.label} /{label}</p>
                    </div>
                  ))}
                </div>

                {/* Macros */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-emerald-200/40 to-emerald-100/10 border border-emerald-500/15 rounded-2xl p-3">
                    <p className="text-display text-lg text-safe">{n.protein.toFixed(1)}g</p>
                    <p className="font-pixel text-[8px] text-muted uppercase mt-0.5">Protein /{label}</p>
                  </div>
                  <div className="bg-gradient-to-br from-sky-200/40 to-sky-100/10 border border-sky-500/15 rounded-2xl p-3">
                    <p className="text-display text-lg text-sky-600 dark:text-sky-400">{(n.carbs ?? 0).toFixed(1)}g</p>
                    <p className="font-pixel text-[8px] text-muted uppercase mt-0.5">Carbs /{label}</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-200/40 to-amber-100/10 border border-amber-500/15 rounded-2xl p-3">
                    <p className="text-display text-lg text-amber-600 dark:text-amber-400">{(n.fat ?? 0).toFixed(1)}g</p>
                    <p className="font-pixel text-[8px] text-muted uppercase mt-0.5">Fat /{label}</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-200/40 to-emerald-100/10 border border-emerald-500/15 rounded-2xl p-3">
                    <p className="text-display text-lg text-safe">{n.fiber.toFixed(1)}g</p>
                    <p className="font-pixel text-[8px] text-muted uppercase mt-0.5">Fiber /{label}</p>
                  </div>
                </div>

                {/* Incomplete data warning */}
                {data.dataCompleteness && (!data.dataCompleteness.hasProtein || !data.dataCompleteness.hasCarbs || !data.dataCompleteness.hasFat) && (
                  <div className="bg-amber-100/50 dark:bg-amber-900/20 border border-amber-400/30 rounded-xl px-3 py-2 text-[11px] text-amber-700 dark:text-amber-300">
                    Some nutrition data may be incomplete or missing from the database for this product.
                  </div>
                )}
              </>
            );
          })()}

          {/* Ingredients / Additives */}
          {data.additives.length > 0 && (
            <div className="bg-card border border-card-border rounded-2xl p-5">
              <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-3">
                // {data.type === "skincare" ? "INGREDIENTS ANALYSIS" : "ADDITIVES"} ({data.additives.length})
              </p>
              <div className="space-y-2">
                {data.additives.map((a) => (
                  <div key={a.code} className={`text-[11px] px-3 py-2 rounded-xl border ${riskColor(a.risk)} flex items-center justify-between gap-2`}>
                    <div>
                      <span className="font-bold">{a.name}</span>
                      {a.concern && <span className="text-[9px] text-muted ml-2">— {a.concern}</span>}
                    </div>
                    <span className="font-pixel text-[8px] uppercase flex-shrink-0">{a.risk}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Link href="/health-scan" className="btn btn-primary btn-lg flex-1">SCAN ANOTHER</Link>
            <Link href={`/add-item?barcode=${data.product.barcode}`} className="btn btn-lg flex-1">ADD TO INVENTORY</Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HealthScorePage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto py-20"><p className="font-pixel text-muted text-sm">LOADING...</p></div>}>
      <HealthScoreContent />
    </Suspense>
  );
}
