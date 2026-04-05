import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/utils/supabase/api";

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    const updates: Record<string, unknown> = {};

    if (typeof body.displayName === "string") updates.display_name = body.displayName.slice(0, 100);
    if (typeof body.householdSize === "number") updates.household_size = Math.min(Math.max(body.householdSize, 1), 20);
    if (typeof body.fitnessGoal === "string") updates.fitness_goal = body.fitnessGoal.slice(0, 50);
    if (Array.isArray(body.dietaryPreferences)) updates.dietary_preferences = body.dietaryPreferences.slice(0, 20);

    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
