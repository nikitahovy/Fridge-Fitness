import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { GROQ_VISION_MODEL } from "@/lib/ai-model";
import { getAuthenticatedClient } from "@/utils/supabase/api";
import { checkRateLimit, getRateLimitId } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const { user } = await getAuthenticatedClient();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const limited = checkRateLimit(getRateLimitId(req, user.id), "read-barcode");
    if (limited) return limited;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 503 });

    const { imageDataUrl } = await req.json();
    if (!imageDataUrl || typeof imageDataUrl !== "string") return NextResponse.json({ error: "No image" }, { status: 400 });
    if (!imageDataUrl.startsWith("data:image/")) return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
    if (imageDataUrl.length > 10_000_000) return NextResponse.json({ error: "Image too large" }, { status: 413 });

    const groq = new Groq({ apiKey });

    const result = await groq.chat.completions.create({
      model: GROQ_VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Read the barcode number from this image. Return ONLY the numeric barcode digits (UPC, EAN, or any product barcode). Nothing else — just the number. If you can't read a barcode, respond with: NONE",
            },
            {
              type: "image_url",
              image_url: { url: imageDataUrl },
            },
          ],
        },
      ],
      max_tokens: 50,
      temperature: 0,
    });

    const text = result.choices[0]?.message?.content?.trim() || "";

    // Extract digits from response
    const digits = text.replace(/\D/g, "");

    if (digits.length >= 4 && digits.length <= 14) {
      return NextResponse.json({ code: digits });
    }

    return NextResponse.json({ error: "Couldn't read barcode. Try a clearer, closer photo." }, { status: 400 });
  } catch (err) {
    console.error("Read barcode error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Failed to read barcode" }, { status: 500 });
  }
}
