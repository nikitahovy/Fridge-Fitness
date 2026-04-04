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

    // Extract base64 and media type — flexible parsing
    let mimeType = "image/jpeg";
    let base64Data = "";

    if (imageDataUrl.startsWith("data:")) {
      const commaIndex = imageDataUrl.indexOf(",");
      if (commaIndex === -1) {
        return NextResponse.json({ error: "Invalid image data URL" }, { status: 400 });
      }

      // Parse mime type from header
      const header = imageDataUrl.substring(0, commaIndex);
      const mimeMatch = header.match(/data:(image\/[a-zA-Z+]+)/);
      if (mimeMatch) {
        // Normalize jpg → jpeg
        mimeType = mimeMatch[1].replace("image/jpg", "image/jpeg");
      }

      base64Data = imageDataUrl.substring(commaIndex + 1);
    } else {
      // Might be raw base64 without data: prefix
      base64Data = imageDataUrl;
    }

    // Strip any whitespace/newlines from base64
    base64Data = base64Data.replace(/\s/g, "");

    if (!base64Data || base64Data.length < 100) {
      return NextResponse.json({ error: "Image data too small or empty" }, { status: 400 });
    }

    // 10MB base64 limit (covers ~7.5MB raw images)
    if (base64Data.length > 10_000_000) {
      return NextResponse.json({ error: "Image too large. Try a lower resolution photo." }, { status: 400 });
    }

    // Ensure mime type is supported by Gemini
    const supportedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
    if (!supportedTypes.includes(mimeType)) {
      mimeType = "image/jpeg"; // fallback
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
    jsonText = jsonText.trim();

    let items;
    try {
      items = JSON.parse(jsonText);
    } catch {
      console.error("Failed to parse Gemini response:", jsonText.substring(0, 200));
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

    if (message.includes("API_KEY") || message.includes("api key") || message.includes("API key")) {
      return NextResponse.json({ error: "Gemini API key invalid. Check Vercel environment variables." }, { status: 503 });
    }
    if (message.includes("quota") || message.includes("rate") || message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
      return NextResponse.json({ error: "Gemini free tier limit hit (15/min). Wait a minute and try again." }, { status: 429 });
    }
    if (message.includes("400") || message.includes("INVALID_ARGUMENT")) {
      return NextResponse.json({ error: "Gemini couldn't process this image. Try a different photo." }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to analyze image. Try again." }, { status: 500 });
  }
}
