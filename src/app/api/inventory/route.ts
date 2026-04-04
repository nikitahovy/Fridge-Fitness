import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { v4 as uuid } from "uuid";
import { InventoryItem } from "@/lib/types";
import { inventoryCreateSchema, inventoryPatchSchema } from "@/lib/validation";
import { computeAllItemRisks } from "@/lib/shelf-life";

export async function GET() {
  try {
    const withRisk = computeAllItemRisks(store.inventory);
    return NextResponse.json(withRisk);
  } catch {
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = inventoryCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const item: InventoryItem = {
      id: uuid(),
      name: data.name,
      category: data.category,
      location: data.location,
      quantity: data.quantity,
      purchasePrice: data.purchasePrice,
      purchaseDate: data.purchaseDate || new Date().toISOString().split("T")[0],
      bestByDate: data.bestByDate,
      openedAt: data.openedAt,
      status: "active",
      nutritionTags: data.nutritionTags,
    };
    store.inventory.push(item);
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = inventoryPatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { id, ...updates } = parsed.data;
    const item = store.inventory.find((i) => i.id === id);
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Track waste/savings before updating
    if (updates.status === "consumed") {
      store.savedValue += item.purchasePrice;
    } else if (updates.status === "discarded") {
      store.wastedValue += item.purchasePrice;
    }

    // Whitelist: only apply validated fields
    if (updates.name !== undefined) item.name = updates.name;
    if (updates.status !== undefined) item.status = updates.status;
    if (updates.location !== undefined) item.location = updates.location;
    if (updates.openedAt !== undefined) item.openedAt = updates.openedAt;

    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}
