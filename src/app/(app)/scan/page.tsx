"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { playScanFeedback } from "@/lib/scan-feedback";

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const detectedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    let animationId: number;

    async function startScanning() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
        });

        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Check if native BarcodeDetector is available
        if ("BarcodeDetector" in window) {
          const detector = new (window as unknown as { BarcodeDetector: new (opts: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector({
            formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"]
          });

          const scan = async () => {
            if (!mounted || detectedRef.current || !videoRef.current) return;
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0 && !detectedRef.current) {
                detectedRef.current = true;
                playScanFeedback();
                cleanup();
                router.replace(`/add-item?barcode=${encodeURIComponent(barcodes[0].rawValue)}`);
                return;
              }
            } catch { /* ignore detection errors */ }
            if (mounted) animationId = requestAnimationFrame(scan);
          };
          animationId = requestAnimationFrame(scan);
        } else {
          // Fallback: use canvas + send frames to Groq periodically
          let lastScan = 0;
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d")!;

          const scan = async () => {
            if (!mounted || detectedRef.current || !videoRef.current) return;
            const now = Date.now();
            if (now - lastScan > 2000 && videoRef.current.readyState >= 2) {
              lastScan = now;
              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;
              ctx.drawImage(videoRef.current, 0, 0);
              const dataUrl = canvas.toDataURL("image/jpeg", 0.7);

              try {
                const res = await fetch("/api/read-barcode", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ imageDataUrl: dataUrl }),
                });
                const data = await res.json();
                if (data.code && !detectedRef.current) {
                  detectedRef.current = true;
                  playScanFeedback();
                  cleanup();
                  router.replace(`/add-item?barcode=${encodeURIComponent(data.code)}`);
                  return;
                }
              } catch { /* ignore */ }
            }
            if (mounted) animationId = requestAnimationFrame(scan);
          };
          animationId = requestAnimationFrame(scan);
        }
      } catch {
        if (mounted) setError("Camera access denied. Please allow camera permissions.");
      }
    }

    function cleanup() {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      if (animationId) cancelAnimationFrame(animationId);
    }

    startScanning();

    return () => {
      mounted = false;
      cleanup();
    };
  }, [router]);

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <p className="font-pixel text-[10px] text-muted uppercase tracking-[0.2em] mb-2">// SCAN BARCODE</p>
        <h2 className="text-display text-3xl">Point at<br/>Barcode</h2>
      </div>

      {error ? (
        <div className="bg-rose-100 dark:bg-rose-500/10 border border-red-500/20 rounded-2xl p-5 text-center">
          <p className="text-sm text-danger mb-4">{error}</p>
          <button onClick={() => router.back()} className="btn btn-primary">GO BACK</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-black" style={{ minHeight: 300 }}>
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            {/* Scanning overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-32 border-2 border-white/40 rounded-xl relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-lg" />
                {/* Scanning line animation */}
                <div className="absolute left-2 right-2 h-0.5 bg-danger/80 animate-pulse top-1/2" />
              </div>
            </div>
          </div>
          <p className="font-pixel text-[10px] text-muted text-center">Hold steady — beeps when detected</p>
          <button onClick={() => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); router.back(); }} className="btn w-full">CANCEL</button>
        </div>
      )}
    </div>
  );
}
