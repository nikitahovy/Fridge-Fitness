import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { v4 as uuid } from "uuid";
import { UploadSession } from "@/lib/types";
import { checkRateLimit, getRateLimitId } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(getRateLimitId(req), "sessions");
  if (limited) return limited;

  try {
    const session: UploadSession = {
      id: uuid(),
      status: "pending",
      createdAt: new Date().toISOString(),
      imageUrl: null,
    };
    store.sessions.push(session);

    // Clean up old sessions (keep last 20)
    if (store.sessions.length > 20) {
      store.sessions = store.sessions.slice(-20);
    }

    return NextResponse.json(session, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
