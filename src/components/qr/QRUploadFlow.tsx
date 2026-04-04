"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { UploadSession } from "@/lib/types";

export default function QRUploadFlow() {
  const router = useRouter();
  const [session, setSession] = useState<UploadSession | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "waiting" | "uploaded" | "processing" | "done">("idle");
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const startSession = useCallback(async () => {
    const res = await fetch("/api/sessions", { method: "POST" });
    const sess: UploadSession = await res.json();
    setSession(sess);
    setStatus("waiting");

    // Generate QR code with LAN-accessible URL
    const baseUrl = window.location.origin;
    const uploadUrl = `${baseUrl}/upload/${sess.id}`;
    const dataUrl = await QRCode.toDataURL(uploadUrl, {
      width: 256,
      margin: 2,
      color: { dark: "#059669", light: "#ffffff" },
    });
    setQrDataUrl(dataUrl);
  }, []);

  // Poll for upload completion
  useEffect(() => {
    if (!session || status !== "waiting") return;

    const interval = setInterval(async () => {
      const res = await fetch(`/api/sessions/${session.id}`);
      const data: UploadSession = await res.json();
      if (data.status === "uploaded") {
        setStatus("processing");
        setUploadedImageUrl(data.imageUrl);
        clearInterval(interval);

        // Simulate "analyzing" delay
        setTimeout(() => setStatus("done"), 2000);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [session, status]);

  if (status === "idle") {
    return (
      <div className="bg-card border border-card-border rounded-2xl p-6 text-center">
        <div className="text-5xl mb-4">📱</div>
        <h3 className="font-semibold text-lg mb-2">Add Items via Phone</h3>
        <p className="text-sm text-muted mb-4">
          Scan a QR code with your phone to take a photo of your receipt or fridge.
          The image will appear here automatically.
        </p>
        <button onClick={startSession} className="btn btn-primary btn-lg">
          GENERATE QR CODE
        </button>
      </div>
    );
  }

  if (status === "waiting") {
    return (
      <div className="bg-card border border-card-border rounded-2xl p-6 text-center">
        <h3 className="font-semibold text-lg mb-4">Scan with Your Phone</h3>
        {qrDataUrl && (
          <img src={qrDataUrl} alt="QR Code" className="w-64 h-64 mx-auto mb-4" />
        )}
        <p className="text-sm text-muted mb-2">
          Open your phone camera and point it at this QR code.
        </p>
        <p className="text-xs text-muted">
          Waiting for upload...
        </p>
        <div className="mt-4">
          <div className="inline-block w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (status === "processing") {
    return (
      <div className="bg-card border border-card-border rounded-2xl p-6 text-center">
        <h3 className="font-semibold text-lg mb-4">Analyzing Photo...</h3>
        {uploadedImageUrl && (
          <img
            src={uploadedImageUrl}
            alt="Uploaded"
            className="w-full max-w-sm mx-auto rounded-lg mb-4"
          />
        )}
        <div className="inline-block w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted mt-2">Identifying items in your photo...</p>
      </div>
    );
  }

  // status === "done"
  const mockExtracted = [
    { name: "Avocados", category: "produce", price: 3.49 },
    { name: "Chicken Thighs", category: "protein", price: 7.99 },
    { name: "Whole Wheat Bread", category: "grain", price: 4.29 },
    { name: "Tomatoes", category: "produce", price: 2.99 },
  ];

  return (
    <div className="bg-card border border-card-border rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">✅</span>
        <h3 className="font-semibold text-lg">Items Detected (MVP)</h3>
      </div>

      {uploadedImageUrl && (
        <img
          src={uploadedImageUrl}
          alt="Uploaded"
          className="w-full max-w-xs rounded-lg mb-4"
        />
      )}

      <p className="text-sm text-muted mb-4">
        These items were &quot;detected&quot; from your photo. In production, this would use OCR/vision AI.
      </p>

      <div className="space-y-3 mb-4">
        {mockExtracted.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <p className="font-medium text-sm">{item.name}</p>
              <p className="text-xs text-muted capitalize">{item.category}</p>
            </div>
            <span className="font-medium text-sm">${item.price.toFixed(2)}</span>
          </div>
        ))}
      </div>

      {added ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-green-800 font-medium mb-3">4 items added to inventory!</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push("/inventory")}
              className="text-sm px-4 py-2 rounded-lg bg-white text-black hover:bg-white/90 transition cursor-pointer"
            >
              View Inventory
            </button>
            <button
              onClick={() => {
                setStatus("idle");
                setSession(null);
                setAdded(false);
              }}
              className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition cursor-pointer"
            >
              Scan Another
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={async () => {
              for (const item of mockExtracted) {
                await fetch("/api/inventory", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: item.name,
                    category: item.category,
                    purchasePrice: item.price,
                  }),
                });
              }
              setAdded(true);
            }}
            className="btn btn-primary btn-lg flex-1"
          >
            Add All to Inventory
          </button>
          <button
            onClick={() => {
              setStatus("idle");
              setSession(null);
            }}
            className="px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
