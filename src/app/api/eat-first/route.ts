import { NextResponse } from "next/server";
import { store, getRecoveryContext } from "@/lib/store";
import { computeAllItemRisks } from "@/lib/shelf-life";
import { rankEatFirstQueue } from "@/lib/scoring";

export async function GET() {
  const itemsWithRisk = computeAllItemRisks(store.inventory);
  const recovery = getRecoveryContext();
  const ranked = rankEatFirstQueue(itemsWithRisk, recovery);
  return NextResponse.json(ranked);
}
