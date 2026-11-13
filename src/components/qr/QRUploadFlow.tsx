"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { UploadSession } from "@/lib/types";

type DetectedItem = {
  name: string;
  category: string;
  estimatedPrice: number;
  quantity: string;
  selected: boolean;
};

export default function QRUploadFlow() {
  const router = useRouter();
  const [session, setSession] = useState<UploadSession | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "waiting" | "analyzing" | "done" | "error">("idle");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [detectedItems, setDetectedItems] = useState<DetectedItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const startSession = useCallback(async () => {
    const res = await fetch("/api/sessions", { method: "POST" });
    const sess: UploadSession = await res.json();
    setSession(sess);
    setStatus("waiting");

    const baseUrl = window.location.origin;
    const uploadUrl = `${baseUrl}/upload/${sess.id}`;
    const dataUrl = await QRCode.toDataURL(uploadUrl, {
      width: 256,
      margin: 2,
      color: { dark: "#ffffff", light: "#00000000" },
    });
    setQrDataUrl(dataUrl);
  }, []);

  // Poll for upload, then analyze
  useEffect(() => {
    if (!session || status !== "waiting") return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/sessions/${session.id}`);
      const data: UploadSession = await res.json();
      if (data.status === "uploaded" && data.imageUrl) {
        setUploadedImageUrl(data.imageUrl);
        setStatus("analyzing");
        clearInterval(interval);

        // Analyze with AI
        try {
          const analyzeRes = await fetch("/api/analyze-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageDataUrl: data.imageUrl }),
          });
          const analyzeData = await analyzeRes.json();

          if (analyzeRes.ok && analyzeData.items?.length > 0) {
            setDetectedItems(analyzeData.items.map((item: DetectedItem) => ({ ...item, selected: true })));
            setStatus("done");
          } else {
            setErrorMsg(analyzeData.error || "No food items detected. Try a clearer photo.");
            setStatus("error");
          }
        } catch {
          setErrorMsg("Failed to analyze image");
          setStatus("error");
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [session, status]);

  function toggleItem(idx: number) {
    setDetectedItems((prev) => prev.map((item, i) => i === idx ? { ...item, selected: !item.selected } : item));
  }

  function reset() {
    setStatus("idle");
    setSession(null);
    setDetectedItems([]);
    setUploadedImageUrl(null);
    setErrorMsg(null);
    setAdded(false);
  }

  if (status === "idle") {
    return (
      <div className="bg-card border border-card-border rounded-2xl p-6 text-center">
        <div className="text-5xl mb-4">📱</div>
        <h3 className="font-semibold text-lg mb-2">Add Items via Phone</h3>
        <p className="text-sm text-muted mb-4">
          Scan a QR code with your phone to take a photo. AI will detect the items automatically.
        </p>
        <button onClick={startSession} className="btn btn-primary btn-lg">GENERATE QR CODE</button>
      </div>
    );
  }

  if (status === "waiting") {
    return (
      <div className="bg-card border border-card-border rounded-2xl p-6 text-center">
        <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-4">// SCAN WITH PHONE</p>
        {qrDataUrl && <img src={qrDataUrl} alt="QR Code" className="w-56 h-56 mx-auto mb-4" />}
        <p className="text-sm text-muted mb-2">Open your phone camera and point it at this QR code.</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
          <span className="font-pixel text-[10px] text-muted">WAITING FOR UPLOAD...</span>
        </div>
        <button onClick={reset} className="btn mt-4 text-[9px]">CANCEL</button>
      </div>
    );
  }

  if (status === "analyzing") {
    return (
      <div className="bg-card border border-card-border rounded-2xl p-6 text-center">
        <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-4">// ANALYZING</p>
        {uploadedImageUrl && (
          <img src={uploadedImageUrl} alt="Uploaded" className="w-full max-w-sm mx-auto rounded-xl mb-4 opacity-70" />
        )}
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
          <span className="font-pixel text-[10px] text-muted">AI IS IDENTIFYING ITEMS...</span>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="bg-card border border-card-border rounded-2xl p-6 text-center">
        <p className="font-pixel text-[10px] text-danger uppercase tracking-[0.2em] mb-4">// ERROR</p>
        {uploadedImageUrl && (
          <img src={uploadedImageUrl} alt="Uploaded" className="w-full max-w-xs mx-auto rounded-xl mb-4 opacity-50" />
        )}
        <p className="text-sm text-muted mb-4">{errorMsg}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn btn-primary btn-lg">TRY AGAIN</button>
        </div>
      </div>
    );
  }

  // status === "done"
  const selectedCount = detectedItems.filter((i) => i.selected).length;

  return (
    <div className="bg-card border border-card-border rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em]">
          // {detectedItems.length} ITEM{detectedItems.length !== 1 ? "S" : ""} DETECTED
        </p>
        <button onClick={() => {
          setDetectedItems((prev) => prev.map((i) => ({ ...i, selected: !prev.every((x) => x.selected) })));
        }} className="font-pixel text-[10px] text-muted hover:text-foreground cursor-pointer underline underline-offset-2">
          {detectedItems.every((i) => i.selected) ? "DESELECT ALL" : "SELECT ALL"}
        </button>
      </div>

      {uploadedImageUrl && (
        <img src={uploadedImageUrl} alt="Uploaded" className="w-full max-w-xs rounded-xl mb-4 opacity-60" />
      )}

      <div className="space-y-2 mb-4">
        {detectedItems.map((item, idx) => (
          <div key={idx} onClick={() => toggleItem(idx)}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
              item.selected
                ? "bg-emerald-100 dark:bg-emerald-500/10 border-emerald-500/20"
                : "bg-white/50 border-slate-300/50 opacity-50"
            }`}>
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
            <span className="font-pixel text-sm">${item.estimatedPrice.toFixed(2)}</span>
          </div>
        ))}
      </div>

      {added ? (
        <div className="bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
          <p className="font-bold text-sm mb-3">Items added to inventory!</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => router.push("/inventory")} className="btn btn-primary">VIEW INVENTORY</button>
            <button onClick={reset} className="btn">SCAN ANOTHER</button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={async () => {
              setAdding(true);
              for (const item of detectedItems.filter((i) => i.selected)) {
                await fetch("/api/inventory", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: item.name,
                    category: item.category,
                    quantity: item.quantity,
                    purchasePrice: item.estimatedPrice,
                  }),
                });
              }
              setAdding(false);
              setAdded(true);
            }}
            disabled={adding || selectedCount === 0}
            className="btn btn-primary btn-lg flex-1 disabled:opacity-50"
          >
            {adding ? "ADDING..." : `ADD ${selectedCount} ITEM${selectedCount !== 1 ? "S" : ""}`}
          </button>
          <button onClick={reset} className="btn btn-lg">CANCEL</button>
        </div>
      )}
    </div>
  );
}
