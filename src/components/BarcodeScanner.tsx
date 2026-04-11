"use client";

import Link from "next/link";
import { Camera } from "lucide-react";

export default function BarcodeScanner() {
  return (
    <Link href="/scan" className="block">
      <div className="border-2 border-dashed border-slate-300/60 rounded-2xl p-8 text-center hover:border-slate-400 transition cursor-pointer">
        <Camera className="w-8 h-8 mx-auto mb-2 text-slate-700" strokeWidth={1.75} />
        <p className="font-bold text-sm mb-1">Tap to scan barcode</p>
        <p className="text-[10px] text-muted">Opens camera to scan UPC/EAN barcodes in real-time</p>
      </div>
    </Link>
  );
}
