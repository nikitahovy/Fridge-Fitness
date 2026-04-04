import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { uuidParamSchema } from "@/lib/validation";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    if (!uuidParamSchema.safeParse(sessionId).success) {
      return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
    }
    const session = store.sessions.find((s) => s.id === sessionId);
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(session);
  } catch {
    return NextResponse.json({ error: "Failed to fetch session" }, { status: 500 });
  }
}
