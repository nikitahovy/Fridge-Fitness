import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { GROQ_VISION_MODEL, VISION_MAX_TOKENS } from "@/lib/ai-model";
import { getAuthenticatedClient } from "@/utils/supabase/api";
import { checkRateLimit, getRateLimitId } from "@/lib/rate-limit";

const PROMPT = `You are a food item detector for a grocery/kitchen inventory app.

Identify ALL food items visible in this image. This could be:
- A grocery receipt (extract item names and prices)
- A photo of a fridge, pantry, or counter (identify visible food items)
- A photo of a single food item or product

For each item, return:
- name: the common name (e.g., "Chicken Breast", "Greek Yogurt", "Kombucha")
- category: one of: protein, dairy, produce, grain, snack, beverage, condiment, frozen, other
- estimatedPrice: your best estimate in USD (use receipt price if visible, otherwise estimate typical US grocery price)
- quantity: estimated quantity with unit (e.g., "1 lb", "16 oz", "1 bottle", "2 cans")

Return ONLY a valid JSON array. No markdown, no explanation, no code fences.
Example: [{"name":"Chicken Breast","category":"protein","estimatedPrice":8.99,"quantity":"1.5 lbs"}]

If you cannot identify any food items, return: []`;

export async function POST(req: NextRequest) {
  try {
    const { user } = await getAuthenticatedClient();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const limited = checkRateLimit(getRateLimitId(req, user.id), "analyze-image");
    if (limited) return limited;

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Vision API not configured. Set GROQ_API_KEY environment variable." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { imageDataUrl } = body;

    if (!imageDataUrl || typeof imageDataUrl !== "string") {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Validate it's a data URL with image
    if (!imageDataUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
    }

    // Cap at 10MB base64 (~7.5MB raw image) to prevent abuse
    if (imageDataUrl.length > 10_000_000) {
      return NextResponse.json({ error: "Image too large. Max 7MB." }, { status: 413 });
    }

    // Validate MIME type is an allowed image format
    const mimeMatch = imageDataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,/);
    if (!mimeMatch) {
      return NextResponse.json({ error: "Invalid image type. Allowed: JPEG, PNG, WebP, GIF" }, { status: 400 });
    }

    const groq = new Groq({ apiKey });

    const result = await groq.chat.completions.create({
      model: GROQ_VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPT },
            {
              type: "image_url",
              image_url: { url: imageDataUrl },
            },
          ],
        },
      ],
      max_tokens: VISION_MAX_TOKENS,
      temperature: 0.1,
    });

    const responseText = result.choices[0]?.message?.content?.trim() || "[]";

    // Parse JSON (strip markdown fences if present)
    let jsonText = responseText;
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    jsonText = jsonText.trim();

    let items;
    try {
      items = JSON.parse(jsonText);
    } catch {
      console.error("Failed to parse Groq response:", jsonText.substring(0, 300));
      return NextResponse.json({ items: [], error: "Could not parse detected items" });
    }

    if (!Array.isArray(items)) {
      return NextResponse.json({ items: [] });
    }

    const validCategories = ["protein", "dairy", "produce", "grain", "snack", "beverage", "condiment", "frozen", "other"];

    const sanitizedItems = items
      .filter((item: Record<string, unknown>) => item && typeof item.name === "string" && item.name.length > 0)
      .slice(0, 30)
      .map((item: Record<string, unknown>) => ({
        name: String(item.name).slice(0, 200),
        category: validCategories.includes(String(item.category)) ? String(item.category) : "other",
        estimatedPrice: typeof item.estimatedPrice === "number" ? Math.min(Math.max(item.estimatedPrice, 0), 10000) : 0,
        quantity: typeof item.quantity === "string" ? String(item.quantity).slice(0, 100) : "1",
      }));

    return NextResponse.json({ items: sanitizedItems });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Analyze image error:", message);

    if (message.includes("api_key") || message.includes("API key") || message.includes("authentication")) {
      return NextResponse.json({ error: "Groq API key invalid. Check Vercel environment variables." }, { status: 503 });
    }
    if (message.includes("rate") || message.includes("429") || message.includes("quota")) {
      return NextResponse.json({ error: "Rate limit hit. Wait a moment and try again." }, { status: 429 });
    }
    return NextResponse.json({ error: "Failed to analyze image. Try again.", debug: message.substring(0, 300) }, { status: 500 });
  }
}
