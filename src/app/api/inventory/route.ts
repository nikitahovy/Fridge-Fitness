import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { v4 as uuid } from "uuid";
import { InventoryItem } from "@/lib/types";
import { computeAllItemRisks } from "@/lib/shelf-life";

export async function GET() {
  // Return all active+frozen items with risk data
  const withRisk = computeAllItemRisks(store.inventory);
  return NextResponse.json(withRisk);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const item: InventoryItem = {
    id: uuid(),
    name: body.name,
    category: body.category || "other",
    location: body.location || "fridge",
    quantity: body.quantity || "1",
    purchasePrice: body.purchasePrice || 0,
    purchaseDate: body.purchaseDate || new Date().toISOString().split("T")[0],
    bestByDate: body.bestByDate || null,
    openedAt: body.openedAt || null,
    status: "active",
    nutritionTags: body.nutritionTags || [],
  };
  store.inventory.push(item);
  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { id, ...updates } = await req.json();
  const item = store.inventory.find((i) => i.id === id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Track waste/savings
  if (updates.status === "consumed") {
    store.savedValue += item.purchasePrice;
  } else if (updates.status === "discarded") {
    store.wastedValue += item.purchasePrice;
  }

  Object.assign(item, updates);
  return NextResponse.json(item);
}
