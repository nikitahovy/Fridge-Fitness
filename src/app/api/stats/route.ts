import { NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/utils/supabase/api";

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: events } = await supabase
      .from("food_events")
      .select("*")
      .eq("user_id", user.id);

    const consumed = (events || []).filter((e) => e.event_type === "consumed");
    const discarded = (events || []).filter((e) => e.event_type === "discarded");

    return NextResponse.json({
      wastedValue: discarded.reduce((sum, e) => sum + Number(e.dollar_value || 0), 0),
      savedValue: consumed.reduce((sum, e) => sum + Number(e.dollar_value || 0), 0),
      itemsConsumed: consumed.length,
      itemsDiscarded: discarded.length,
      discardedItems: discarded.map((e) => ({ name: e.item_name, price: Number(e.dollar_value || 0) })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
