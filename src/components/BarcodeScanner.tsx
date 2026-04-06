"use client";

import Link from "next/link";

export default function BarcodeScanner() {
  return (
    <Link href="/scan" className="block">
      <div className="border-2 border-dashed border-white/20 rounded-2xl p-8 text-center hover:border-white/40 transition cursor-pointer">
        <div className="text-3xl mb-2">📷</div>
        <p className="font-bold text-sm mb-1">Tap to scan barcode</p>
        <p className="text-[10px] text-muted">Opens camera to scan UPC/EAN barcodes in real-time</p>
      </div>
    </Link>
  );
}
