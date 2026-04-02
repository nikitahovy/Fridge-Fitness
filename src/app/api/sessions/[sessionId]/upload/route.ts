import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  if (!file) return NextResponse.json({ error: "No image provided" }, { status: 400 });

  // Convert to base64 data URL (works on Vercel's read-only filesystem)
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  const mimeType = file.type || "image/jpeg";
  const dataUrl = `data:${mimeType};base64,${base64}`;

  session.status = "uploaded";
  session.imageUrl = dataUrl;

  return NextResponse.json({ success: true, imageUrl: session.imageUrl });
}
