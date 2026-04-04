import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { uuidParamSchema, validateUploadedFile } from "@/lib/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    if (!uuidParamSchema.safeParse(sessionId).success) {
      return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
    }

    const session = store.sessions.find((s) => s.id === sessionId);
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    if (!file) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    // Validate file type and size
    const validation = validateUploadedFile(file);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Convert to base64 data URL
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    session.status = "uploaded";
    session.imageUrl = dataUrl;

    return NextResponse.json({ success: true, imageUrl: session.imageUrl });
  } catch {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
