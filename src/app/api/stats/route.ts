import { NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  const consumed = store.inventory.filter((i) => i.status === "consumed");
  const discarded = store.inventory.filter((i) => i.status === "discarded");

  return NextResponse.json({
    wastedValue: store.wastedValue,
    savedValue: store.savedValue,
    itemsConsumed: consumed.length,
    itemsDiscarded: discarded.length,
    discardedItems: discarded.map((i) => ({
      name: i.name,
      price: i.purchasePrice,
    })),
  });
}
