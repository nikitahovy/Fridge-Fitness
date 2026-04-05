import { NextResponse } from "next/server";
import Groq from "groq-sdk";

export async function GET() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      status: "NO_KEY",
      error: "GROQ_API_KEY not set in environment variables",
    });
  }

  try {
    const groq = new Groq({ apiKey });
    const result = await groq.chat.completions.create({
      model: "llama-4-scout-17b-16e-instruct",
      messages: [{ role: "user", content: "Reply with exactly: OK" }],
      max_tokens: 10,
    });
    const text = result.choices[0]?.message?.content?.trim();

    return NextResponse.json({
      status: "OK",
      keyPrefix: apiKey.substring(0, 8) + "...",
      response: text,
      model: "llama-4-scout-17b-16e-instruct",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({
      status: "ERROR",
      keyPrefix: apiKey.substring(0, 8) + "...",
      error: message.substring(0, 300),
    });
  }
}
