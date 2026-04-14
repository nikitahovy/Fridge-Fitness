import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/utils/supabase/api";
import { checkRateLimit, getRateLimitId } from "@/lib/rate-limit";
import { profilePatchSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const limited = checkRateLimit(getRateLimitId(req, user.id), "profile");
    if (limited) return limited;

    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();

    return NextResponse.json({
      email: user.email,
      displayName: data?.display_name || "",
      householdSize: data?.household_size || 1,
      fitnessGoal: data?.fitness_goal || "maintenance",
      dietaryPreferences: data?.dietary_preferences || [],
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = profilePatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const d = parsed.data;
    const updates: Record<string, unknown> = {};

    if (d.displayName !== undefined) updates.display_name = d.displayName;
    if (d.householdSize !== undefined) updates.household_size = d.householdSize;
    if (d.fitnessGoal !== undefined) updates.fitness_goal = d.fitnessGoal;
    if (d.dietaryPreferences !== undefined) updates.dietary_preferences = d.dietaryPreferences;

    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
