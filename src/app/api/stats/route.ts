import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/utils/supabase/api";
import { checkRateLimit, getRateLimitId } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const limited = checkRateLimit(getRateLimitId(req, user.id), "stats");
    if (limited) return limited;

    const { data: events } = await supabase
      .from("food_events")
      .select("*")
      .eq("user_id", user.id)
      .order("occurred_at", { ascending: true });

    const allEvents = events || [];
    const consumed = allEvents.filter((e) => e.event_type === "consumed");
    const discarded = allEvents.filter((e) => e.event_type === "discarded");

    // Group by month for chart
    const monthlyMap: Record<string, { saved: number; wasted: number }> = {};
    for (const e of allEvents) {
      const date = new Date(e.occurred_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyMap[key]) monthlyMap[key] = { saved: 0, wasted: 0 };
      const val = Number(e.dollar_value || 0);
      if (e.event_type === "consumed") monthlyMap[key].saved += val;
      if (e.event_type === "discarded") monthlyMap[key].wasted += val;
    }

    // Convert to sorted array with month labels
    const monthly = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, vals]) => {
        const [year, month] = key.split("-");
        const date = new Date(Number(year), Number(month) - 1);
        return {
          month: date.toLocaleString("en", { month: "short" }),
          year: Number(year),
          saved: vals.saved,
          wasted: vals.wasted,
        };
      });

    return NextResponse.json({
      wastedValue: discarded.reduce((sum, e) => sum + Number(e.dollar_value || 0), 0),
      savedValue: consumed.reduce((sum, e) => sum + Number(e.dollar_value || 0), 0),
      itemsConsumed: consumed.length,
      itemsDiscarded: discarded.length,
      discardedItems: discarded.map((e) => ({ name: e.item_name, price: Number(e.dollar_value || 0) })),
      monthly,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
