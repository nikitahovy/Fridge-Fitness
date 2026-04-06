"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function ScanPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<unknown>(null);
  const detectedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        const el = document.getElementById("scanner-view");
        if (!el || !mounted) return;

        const scanner = new Html5Qrcode("scanner-view");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 280, height: 150 }, aspectRatio: 1.5 },
          (decodedText) => {
            if (!detectedRef.current && mounted) {
              detectedRef.current = true;
              if (navigator.vibrate) navigator.vibrate(100);
              scanner.stop().catch(() => {});
              // Navigate back to add-item with the barcode
              router.replace(`/add-item?barcode=${encodeURIComponent(decodedText)}`);
            }
          },
          () => {}
        );
      } catch (err) {
        if (mounted) setError("Camera access denied or not available");
        console.error(err);
      }
    })();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        (scannerRef.current as { stop: () => Promise<void> }).stop().catch(() => {});
      }
    };
  }, [router]);

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-2">// SCAN BARCODE</p>
        <h2 className="text-display text-3xl">Point at<br/>Barcode</h2>
      </div>

      {error ? (
        <div className="bg-gradient-to-r from-red-950/40 to-red-900/15 border border-red-500/20 rounded-2xl p-5 text-center">
          <p className="text-sm text-danger mb-4">{error}</p>
          <button onClick={() => router.back()} className="btn btn-primary">GO BACK</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div id="scanner-view" className="w-full rounded-2xl overflow-hidden bg-black/50" style={{ minHeight: 300 }} />
          <p className="font-pixel text-[10px] text-muted text-center">Hold steady — it&apos;ll vibrate when detected</p>
          <button onClick={() => router.back()} className="btn w-full">CANCEL</button>
        </div>
      )}
    </div>
  );
}
