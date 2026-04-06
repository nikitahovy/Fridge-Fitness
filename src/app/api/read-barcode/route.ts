import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 503 });

    const { imageDataUrl } = await req.json();
    if (!imageDataUrl) return NextResponse.json({ error: "No image" }, { status: 400 });

    const groq = new Groq({ apiKey });

    const result = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
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
