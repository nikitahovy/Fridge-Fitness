"use client";

// Barcode scanning via photo capture — no live camera library needed
// User takes a photo of the barcode, we send it to Groq to read the number

import { useState, useRef } from "react";

type Props = {
  onDetected: (code: string) => void;
};

export default function BarcodeScanner({ onDetected }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      setReading(true);

      try {
        // Use Groq to read the barcode number from the image
        const res = await fetch("/api/read-barcode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageDataUrl: dataUrl }),
        });
        const data = await res.json();

        if (data.code) {
          if (navigator.vibrate) navigator.vibrate(100);
          onDetected(data.code);
        } else {
          setError(data.error || "Couldn't read barcode. Try a clearer photo.");
        }
      } catch {
        setError("Failed to read barcode");
      }
      setReading(false);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-3">
      {!preview ? (
        <label className="block cursor-pointer">
          <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-white/40 transition">
            <div className="text-3xl mb-2">📷</div>
            <p className="font-bold text-sm mb-1">Tap to scan barcode</p>
            <p className="text-[10px] text-muted">Point your camera at the barcode on the product</p>
          </div>
          <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleCapture} className="hidden" />
        </label>
      ) : (
        <div>
          <img src={preview} alt="Barcode" className="w-full rounded-xl max-h-48 object-cover" />
          {reading && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
              <span className="font-pixel text-[10px] text-muted">READING BARCODE...</span>
            </div>
          )}
          {error && (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-danger text-center">{error}</p>
              <button onClick={() => { setPreview(null); setError(null); inputRef.current?.click(); }}
                className="btn btn-primary w-full !text-[10px]">RETAKE PHOTO</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
