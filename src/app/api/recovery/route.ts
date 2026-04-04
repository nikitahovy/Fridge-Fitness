import { NextRequest, NextResponse } from "next/server";
import { getRecoveryContext, setRecoveryPreset, store } from "@/lib/store";
import { recoveryPresetSchema } from "@/lib/validation";

export async function GET() {
  return NextResponse.json({
    preset: store.currentRecoveryPreset,
    context: getRecoveryContext(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = recoveryPresetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid preset" }, { status: 400 });
    }

    setRecoveryPreset(parsed.data.preset);
    return NextResponse.json({
      preset: store.currentRecoveryPreset,
      context: getRecoveryContext(),
    });
  } catch {
    return NextResponse.json({ error: "Failed to update recovery" }, { status: 500 });
  }
}
