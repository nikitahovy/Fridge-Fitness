"use client";

import { useEffect, useRef } from "react";

type Props = {
  onDetected: (code: string) => void;
  scanning: boolean;
};

export default function BarcodeScanner({ onDetected, scanning }: Props) {
  const scannerRef = useRef<unknown>(null);
  const detectedRef = useRef(false);

  useEffect(() => {
    if (!scanning) return;

    let mounted = true;
    detectedRef.current = false;

    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const scanner = new Html5Qrcode("barcode-scanner");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 280, height: 150 },
            aspectRatio: 1.5,
          },
          (decodedText) => {
            if (!detectedRef.current && mounted) {
              detectedRef.current = true;
              // Vibrate if supported
              if (navigator.vibrate) navigator.vibrate(100);
              onDetected(decodedText);
              scanner.stop().catch(() => {});
            }
          },
          () => {} // ignore scan failures
        );
      } catch (err) {
        console.error("Barcode scanner error:", err);
      }
    })();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        (scannerRef.current as { stop: () => Promise<void> }).stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [scanning, onDetected]);

  return null; // renders into #barcode-scanner div
}
