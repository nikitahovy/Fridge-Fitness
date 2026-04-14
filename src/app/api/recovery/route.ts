import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/utils/supabase/api";
import { recoveryPresetSchema } from "@/lib/validation";
import { recoveryPresets } from "@/lib/seed-data";
import { RecoveryPreset } from "@/lib/types";
import { checkRateLimit, getRateLimitId } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const limited = checkRateLimit(getRateLimitId(req, user.id), "recovery");
    if (limited) return limited;

    const { data } = await supabase
      .from("recovery_state")
      .select("preset")
      .eq("user_id", user.id)
      .single();

    const preset = (data?.preset || "post-strength") as RecoveryPreset;
    return NextResponse.json({ preset, context: recoveryPresets[preset] });
  } catch {
    return NextResponse.json({ error: "Failed to fetch recovery" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = recoveryPresetSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid preset" }, { status: 400 });

    const { error } = await supabase
      .from("recovery_state")
      .upsert({ user_id: user.id, preset: parsed.data.preset, updated_at: new Date().toISOString() });

    if (error) throw error;

    const preset = parsed.data.preset as RecoveryPreset;
    return NextResponse.json({ preset, context: recoveryPresets[preset] });
  } catch {
    return NextResponse.json({ error: "Failed to update recovery" }, { status: 500 });
  }
}
