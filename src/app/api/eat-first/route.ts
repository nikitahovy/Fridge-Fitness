import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/utils/supabase/api";
import { mapInventoryRow } from "@/utils/supabase/mappers";
import { computeItemRisk } from "@/lib/shelf-life";
import { rankEatFirstQueue } from "@/lib/scoring";
import { recoveryPresets } from "@/lib/seed-data";
import { RecoveryPreset } from "@/lib/types";
import { checkRateLimit, getRateLimitId } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const limited = checkRateLimit(getRateLimitId(req, user.id), "eat-first");
    if (limited) return limited;

    const { data: items } = await supabase
      .from("inventory_items")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "frozen"]);

    if (!items || items.length === 0) return NextResponse.json([]);

    const mapped = items.map(mapInventoryRow);
    const withRisk = mapped.map(computeItemRisk);

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
