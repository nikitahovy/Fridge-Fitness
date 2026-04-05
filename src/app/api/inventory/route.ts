import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/utils/supabase/api";
import { mapInventoryRow } from "@/utils/supabase/mappers";
import { inventoryCreateSchema, inventoryPatchSchema } from "@/lib/validation";
import { computeItemRisk } from "@/lib/shelf-life";

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("inventory_items")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "frozen"])
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Map to camelCase + compute risk scores
    const mapped = (data || []).map(mapInventoryRow);
    const withRisk = mapped.map(computeItemRisk);

    return NextResponse.json(withRisk);
  } catch {
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = inventoryCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const d = parsed.data;
    const { data, error } = await supabase
      .from("inventory_items")
      .insert({
        user_id: user.id,
        name: d.name,
        category: d.category,
        location: d.location,
        quantity: d.quantity,
        purchase_price: d.purchasePrice,
        purchase_date: d.purchaseDate || new Date().toISOString().split("T")[0],
        best_by_date: d.bestByDate,
        opened_at: d.openedAt,
        nutrition_tags: d.nutritionTags,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(mapInventoryRow(data), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = inventoryPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { id, ...updates } = parsed.data;

    // Get current item for event tracking
    const { data: item } = await supabase
      .from("inventory_items")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updateObj: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) updateObj.name = updates.name;
    if (updates.status !== undefined) updateObj.status = updates.status;
    if (updates.location !== undefined) updateObj.location = updates.location;
    if (updates.openedAt !== undefined) updateObj.opened_at = updates.openedAt;

    const { data, error } = await supabase
      .from("inventory_items")
      .update(updateObj)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    // Track consumed/discarded events
    if (updates.status === "consumed" || updates.status === "discarded") {
      await supabase.from("food_events").insert({
        user_id: user.id,
        inventory_item_id: id,
        event_type: updates.status,
        item_name: item.name,
        dollar_value: item.purchase_price || 0,
      });
    }

    return NextResponse.json(mapInventoryRow(data));
  } catch {
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}
