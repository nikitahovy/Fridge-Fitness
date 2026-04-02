import { NextResponse } from "next/server";
import { store, getRecoveryContext } from "@/lib/store";
import { computeAllItemRisks } from "@/lib/shelf-life";
import { rankRecipes } from "@/lib/scoring";

export async function GET() {
  const itemsWithRisk = computeAllItemRisks(store.inventory);
  const recovery = getRecoveryContext();
  const scored = rankRecipes(store.recipes, itemsWithRisk, recovery);
  return NextResponse.json(scored);
}
