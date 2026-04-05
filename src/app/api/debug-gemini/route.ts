import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      status: "NO_KEY",
      error: "GEMINI_API_KEY not set in environment variables",
      keyPrefix: null,
    });
  }

  try {
    // Simple text-only test (no image, minimal tokens)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("Reply with exactly: OK");
    const text = result.response.text().trim();

    return NextResponse.json({
      status: "OK",
      keyPrefix: apiKey.substring(0, 10) + "...",
      geminiResponse: text,
      model: "gemini-2.0-flash",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      status: "ERROR",
      keyPrefix: apiKey.substring(0, 10) + "...",
      error: message,
    });
  }
}
