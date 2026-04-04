import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Vision API not configured. Set GEMINI_API_KEY environment variable." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { imageDataUrl } = body;

    if (!imageDataUrl || typeof imageDataUrl !== "string") {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Extract base64 and media type from data URL
    const match = imageDataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);
    if (!match) {
      return NextResponse.json({ error: "Invalid image format. Use JPEG, PNG, or WebP." }, { status: 400 });
    }

    const mimeType = match[1];
    const base64Data = match[2];

    // Check size (~5MB)
    if (base64Data.length > 7_000_000) {
      return NextResponse.json({ error: "Image too large" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([
      PROMPT,
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
    ]);

    const responseText = result.response.text().trim();

    // Parse JSON (strip markdown fences if present)
    let jsonText = responseText;
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let items;
    try {
      items = JSON.parse(jsonText);
    } catch {
      return NextResponse.json({ items: [], raw: jsonText });
    }

    if (!Array.isArray(items)) {
      return NextResponse.json({ items: [] });
    }

    // Validate and sanitize
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
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("API_KEY") || message.includes("api key")) {
      return NextResponse.json({ error: "Vision API key invalid" }, { status: 503 });
    }
    if (message.includes("quota") || message.includes("rate")) {
      return NextResponse.json({ error: "Rate limit reached. Try again in a minute." }, { status: 429 });
    }
    return NextResponse.json({ error: "Failed to analyze image" }, { status: 500 });
  }
}
