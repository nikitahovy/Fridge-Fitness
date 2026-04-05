import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { getAuthenticatedClient } from "@/utils/supabase/api";
import { computeItemRisk } from "@/lib/shelf-life";
import { recoveryPresets } from "@/lib/seed-data";
import { InventoryItem, RecoveryPreset } from "@/lib/types";

const PROMPT = `You are a recipe generator for Fridge Fitness, a food waste reduction app.

Given a list of ingredients the user currently has (with spoilage urgency), generate 8-12 recipes that:
1. PRIORITIZE ingredients that are expiring soon (marked as "use-today" or "use-this-week")
2. Maximize use of owned ingredients — avoid recipes needing many missing items
3. Include a mix of quick meals (<15 min), medium (15-30 min), and longer (30+ min)
4. Cover different meal types: breakfast, lunch, dinner, snack
5. Consider the user's fitness day type for nutrition balance

Return ONLY a valid JSON array. No markdown, no code fences, no explanation.

Each recipe must have:
- id: a unique string like "ai-1", "ai-2" etc
- name: recipe name
- ingredients: array of {name, normalizedName (lowercase), amount, optional (boolean)}
- cookTimeMinutes: number
- difficulty: "easy" | "medium" | "hard"
- macros: {protein, carbs, fat, fiber} in grams (estimate)
- tags: array of strings like "high-protein", "quick", "breakfast", "one-pot"
- steps: array of instruction strings (3-6 steps)

Make recipes practical and real — not just "throw everything together". Use common cooking techniques.`;

export async function GET() {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 503 });
    }

    const { supabase, user } = await getAuthenticatedClient();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: items } = await supabase
      .from("inventory_items")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "frozen"]);

    const mapped: InventoryItem[] = (items || []).map((row) => ({
      id: row.id, name: row.name, category: row.category, location: row.location,
      quantity: row.quantity || "1", purchasePrice: Number(row.purchase_price) || 0,
      purchaseDate: row.purchase_date || new Date().toISOString().split("T")[0],
      bestByDate: row.best_by_date, openedAt: row.opened_at, status: row.status,
      nutritionTags: row.nutrition_tags || [],
    }));

    const itemsWithRisk = mapped.map(computeItemRisk);

    const { data: recoveryRow } = await supabase
      .from("recovery_state").select("preset").eq("user_id", user.id).single();
    const preset = (recoveryRow?.preset || "post-strength") as RecoveryPreset;
    const recovery = recoveryPresets[preset];

    const ingredientList = itemsWithRisk.map((item) => {
      const urgency = item.riskTier === "use-today" ? "⚠️ USE TODAY" :
        item.riskTier === "use-this-week" ? "⏰ use this week" :
        item.riskTier === "frozen" ? "❄️ frozen" : "✅ safe";
      return `- ${item.name} (${item.quantity}, ${item.category}, ${urgency})`;
    }).join("\n");

    const dayType = recovery.inferredDayType;
    const recoveryInfo = `Fitness context: ${dayType} day, recovery ${recovery.recoveryScore}%, ${recovery.totalSleepHours}h sleep`;

    const groq = new Groq({ apiKey });

    const result = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        { role: "system", content: PROMPT },
        {
          role: "user",
          content: `Here are my current ingredients:\n${ingredientList}\n\n${recoveryInfo}\n\nGenerate recipes using these ingredients. Prioritize the expiring ones.`,
        },
      ],
      max_tokens: 4096,
      temperature: 0.7,
    });

    const responseText = result.choices[0]?.message?.content?.trim() || "[]";

    let jsonText = responseText;
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    jsonText = jsonText.trim();

    let recipes;
    try {
      recipes = JSON.parse(jsonText);
    } catch {
      console.error("Failed to parse recipe response:", jsonText.substring(0, 500));
      return NextResponse.json({ recipes: [], error: "Failed to parse recipes" });
    }

    if (!Array.isArray(recipes)) {
      return NextResponse.json({ recipes: [] });
    }

    // Sanitize and validate each recipe
    const validDifficulties = ["easy", "medium", "hard"];
    const sanitized = recipes.slice(0, 15).map((r: Record<string, unknown>, idx: number) => ({
      id: `ai-${idx + 1}`,
      name: String(r.name || "Untitled Recipe").slice(0, 200),
      ingredients: Array.isArray(r.ingredients) ? r.ingredients.slice(0, 20).map((ing: Record<string, unknown>) => ({
        name: String(ing.name || "").slice(0, 200),
        normalizedName: String(ing.normalizedName || ing.name || "").toLowerCase().slice(0, 200),
        amount: String(ing.amount || "1").slice(0, 100),
        optional: Boolean(ing.optional),
      })) : [],
      cookTimeMinutes: typeof r.cookTimeMinutes === "number" ? Math.min(Math.max(r.cookTimeMinutes, 1), 480) : 20,
      difficulty: (validDifficulties.includes(String(r.difficulty)) ? String(r.difficulty) : "easy") as "easy" | "medium" | "hard",
      macros: {
        protein: Number((r.macros as Record<string, unknown>)?.protein) || 0,
        carbs: Number((r.macros as Record<string, unknown>)?.carbs) || 0,
        fat: Number((r.macros as Record<string, unknown>)?.fat) || 0,
        fiber: Number((r.macros as Record<string, unknown>)?.fiber) || 0,
      },
      tags: Array.isArray(r.tags) ? r.tags.slice(0, 10).map(String) : [],
      steps: Array.isArray(r.steps) ? r.steps.slice(0, 10).map(String) : [],
    }));

    return NextResponse.json({ recipes: sanitized, count: sanitized.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Generate recipes error:", message);
    return NextResponse.json({ error: "Failed to generate recipes", debug: message.substring(0, 300) }, { status: 500 });
  }
}
