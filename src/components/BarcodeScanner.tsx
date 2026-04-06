"use client";

import { useEffect, useRef } from "react";

type Props = {
  onDetected: (code: string) => void;
  scanning: boolean;
};

export default function BarcodeScanner({ onDetected, scanning }: Props) {
  const scannerRef = useRef<unknown>(null);
  const detectedRef = useRef(false);
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;

  useEffect(() => {
    if (!scanning) {
      // Stop scanner if it was running
      if (scannerRef.current) {
        (scannerRef.current as { stop: () => Promise<void> }).stop().catch(() => {});
        scannerRef.current = null;
      }
      return;
    }

    let mounted = true;
    detectedRef.current = false;

    // Small delay to ensure the DOM element exists
    const timer = setTimeout(async () => {
      if (!mounted) return;

      const el = document.getElementById("barcode-scanner");
      if (!el) return;

      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        // Clear any previous scanner content
        el.innerHTML = "";

        const scanner = new Html5Qrcode("barcode-scanner");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 260, height: 140 },
            aspectRatio: 1.5,
          },
          (decodedText) => {
            if (!detectedRef.current && mounted) {
              detectedRef.current = true;
              if (navigator.vibrate) navigator.vibrate(100);

              // Stop scanner first, then notify
              scanner.stop().catch(() => {}).finally(() => {
                if (mounted) onDetectedRef.current(decodedText);
              });
            }
          },
          () => {} // ignore scan failures
        );
      } catch (err) {
        console.error("Barcode scanner init error:", err);
      }
    }, 300);

    return () => {
      mounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        (scannerRef.current as { stop: () => Promise<void> }).stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [scanning]);

  return null;
}
