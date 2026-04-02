import { NextRequest, NextResponse } from "next/server";
import { getRecoveryContext, setRecoveryPreset, store } from "@/lib/store";
import { RecoveryPreset } from "@/lib/types";

export async function GET() {
  return NextResponse.json({
    preset: store.currentRecoveryPreset,
    context: getRecoveryContext(),
  });
}

export async function POST(req: NextRequest) {
  const { preset } = await req.json();
  if (!["post-strength", "low-recovery", "cardio-day"].includes(preset)) {
    return NextResponse.json({ error: "Invalid preset" }, { status: 400 });
  }
  setRecoveryPreset(preset as RecoveryPreset);
  return NextResponse.json({
    preset: store.currentRecoveryPreset,
    context: getRecoveryContext(),
  });
}
