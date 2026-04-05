import { NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/utils/supabase/api";
import { computeItemRisk } from "@/lib/shelf-life";
import { rankEatFirstQueue } from "@/lib/scoring";
import { recoveryPresets } from "@/lib/seed-data";
import { InventoryItem, RecoveryPreset } from "@/lib/types";

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: items } = await supabase
      .from("inventory_items")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "frozen"]);

    if (!items || items.length === 0) return NextResponse.json([]);

    // Map DB rows to InventoryItem type
    const mapped: InventoryItem[] = items.map((row) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      location: row.location,
      quantity: row.quantity || "1",
      purchasePrice: Number(row.purchase_price) || 0,
      purchaseDate: row.purchase_date || new Date().toISOString().split("T")[0],
      bestByDate: row.best_by_date,
      openedAt: row.opened_at,
      status: row.status,
      nutritionTags: row.nutrition_tags || [],
    }));

    const withRisk = mapped.filter((i) => i.status === "active" || i.status === "frozen").map(computeItemRisk);

    // Get user's recovery preset
    const { data: recoveryRow } = await supabase
      .from("recovery_state")
      .select("preset")
      .eq("user_id", user.id)
      .single();

    const preset = (recoveryRow?.preset || "post-strength") as RecoveryPreset;
    const recovery = recoveryPresets[preset];

    const ranked = rankEatFirstQueue(withRisk, recovery);
    return NextResponse.json(ranked);
  } catch {
    return NextResponse.json({ error: "Failed to fetch eat-first queue" }, { status: 500 });
  }
}
