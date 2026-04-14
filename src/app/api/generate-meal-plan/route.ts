import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { getAuthenticatedClient } from "@/utils/supabase/api";
import { mapInventoryRow } from "@/utils/supabase/mappers";
import { computeItemRisk } from "@/lib/shelf-life";
import { recoveryPresets } from "@/lib/seed-data";
import { RecoveryPreset } from "@/lib/types";
import { checkRateLimit, getRateLimitId } from "@/lib/rate-limit";

const PROMPT = `You are a meal planner for Fridge Fitness, a food waste reduction app.

Given a list of ingredients the user currently has (with spoilage urgency), generate a 7-day meal plan with 4 meals per day (breakfast, lunch, dinner, snack).

Rules:
1. PRIORITIZE ingredients expiring soon ("use-today", "use-this-week") in the first 2-3 days
2. Maximize use of owned ingredients — avoid recipes needing many missing items
3. Vary meal types — don't repeat the same recipe more than twice in a week
4. Keep breakfast simple (5-15 min), lunch moderate (10-25 min), dinner flexible (15-45 min), snacks quick
5. Consider the user's fitness day type for nutrition balance
6. EVERY recipe MUST have at least 3 ingredients — never generate a recipe with only 1-2 ingredients. Include ALL ingredients needed (flour, oil, salt, spices, etc.) in the ingredients list.
7. EVERY recipe MUST have at least 3 steps in the instructions. Explain how to actually cook the dish.
8. Give recipes proper descriptive names (e.g. "Chicken & Vegetable Stir Fry" not "Kirkland Milk Pancakes"). Do NOT use brand names in recipe names.
9. Steps must ONLY reference ingredients that are listed in the ingredients array. If a step says "add flour", then flour MUST be in the ingredients list. Never mention an ingredient in the steps that isn't listed.

Return ONLY a valid JSON array of meals. No markdown, no code fences, no explanation.

Each meal must have:
- day: day number 1-7 (1 = today)
- slot: "breakfast" | "lunch" | "dinner" | "snack"
- recipe: { name, ingredients: [{name, normalizedName, amount, optional}], cookTimeMinutes, difficulty, macros: {protein, carbs, fat, fiber}, tags: [], steps: [] }

IMPORTANT: Each recipe MUST have at least 3 ingredients and at least 3 cooking steps. No single-ingredient recipes. Make recipes practical, complete, and real. Generate exactly 28 meals (4 per day x 7 days).`;

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 503 });

    const { supabase, user } = await getAuthenticatedClient();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const limited = checkRateLimit(getRateLimitId(req, user.id), "generate-meal-plan");
    if (limited) return limited;

    const { data: items } = await supabase
      .from("inventory_items")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "frozen"]);

    const mapped = (items || []).map(mapInventoryRow);
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
          content: `Here are my current ingredients:\n${ingredientList}\n\n${recoveryInfo}\n\nGenerate a 7-day meal plan using these ingredients. Prioritize the expiring ones in the first few days.`,
        },
      ],
      max_tokens: 8192,
      temperature: 0.7,
    });

    const responseText = result.choices[0]?.message?.content?.trim() || "[]";

    let jsonText = responseText;
    if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    jsonText = jsonText.trim();

    let meals;
    try {
      meals = JSON.parse(jsonText);
    } catch {
      console.error("Failed to parse meal plan:", jsonText.substring(0, 500));
      return NextResponse.json({ meals: [], error: "Failed to parse meal plan" });
    }

    if (!Array.isArray(meals)) return NextResponse.json({ meals: [] });

    const validSlots = ["breakfast", "lunch", "dinner", "snack"];
    const validDifficulties = ["easy", "medium", "hard"];

    // Build dates for the next 7 days
    const today = new Date();
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      return d.toISOString().split("T")[0];
    });

    // Food image mapping for meal plan recipes
    const FOOD_IMAGES: [string, string][] = [
      ["stir-fry", "photo-1511910849309-0dffb8785146"],
      ["smoothie", "photo-1505252585461-04db1eb84625"],
      ["bowl", "photo-1543508289-2a4346387248"],
      ["pasta", "photo-1563379926898-05f4575a45d8"],
      ["breakfast", "photo-1569991869939-599da7cd0149"],
      ["snack", "photo-1467453678174-768ec283a940"],
      ["salad", "photo-1512621776951-a57141f2eefd"],
      ["wrap", "photo-1664455248787-bed872761fa2"],
      ["soup", "photo-1613844237701-8f3664fc2eff"],
      ["high-protein", "photo-1532550907401-a500c9a57435"],
      ["quick", "photo-1585417791023-a5a6164b2646"],
      ["dinner", "photo-1547573854-74d2a71d0826"],
      ["lunch", "photo-1536329639134-ade172b2fea0"],
      ["curry", "photo-1565557623262-b51c2513a641"],
      ["seafood", "photo-1578935149228-66b184c83e69"],
    ];
    const ALL_PHOTO_IDS = [...new Set(FOOD_IMAGES.map(([, id]) => id))];
    function pickImage(tags: string[], idx: number): string {
      for (const tag of tags) {
        const match = FOOD_IMAGES.find(([k]) => k === tag.toLowerCase());
        if (match) return `https://images.unsplash.com/${match[1]}?w=600&h=400&fit=crop`;
      }
      // Cycle through all photos by index to avoid duplicates
      const photoId = ALL_PHOTO_IDS[idx % ALL_PHOTO_IDS.length];
      return `https://images.unsplash.com/${photoId}?w=600&h=400&fit=crop`;
    }

    const sanitized = meals.slice(0, 28).map((m: Record<string, unknown>, idx: number) => {
      const dayNum = typeof m.day === "number" ? Math.min(Math.max(m.day as number, 1), 7) : Math.floor(idx / 4) + 1;
      const slot = validSlots.includes(String(m.slot)) ? String(m.slot) : validSlots[idx % 4];
      const r = (m.recipe || m) as Record<string, unknown>;
      const tags = Array.isArray(r.tags) ? r.tags.slice(0, 10).map(String) : [];

      return {
        id: `mp-${idx + 1}`,
        day: dates[dayNum - 1] || dates[0],
        slot,
        recipe: {
          id: `mp-r-${idx + 1}`,
          name: String(r.name || "Meal").slice(0, 200),
          imageUrl: pickImage([...tags, slot], idx),
          ingredients: Array.isArray(r.ingredients) ? r.ingredients.slice(0, 15).map((ing: Record<string, unknown>) => ({
            name: String(ing.name || "").slice(0, 200),
            normalizedName: String(ing.normalizedName || ing.name || "").toLowerCase().slice(0, 200),
            amount: String(ing.amount || "1").slice(0, 100),
            optional: Boolean(ing.optional),
          })) : [],
          cookTimeMinutes: typeof r.cookTimeMinutes === "number" ? Math.min(Math.max(r.cookTimeMinutes as number, 1), 120) : 15,
          difficulty: validDifficulties.includes(String(r.difficulty)) ? String(r.difficulty) : "easy",
          macros: {
            protein: Number((r.macros as Record<string, unknown>)?.protein) || 0,
            carbs: Number((r.macros as Record<string, unknown>)?.carbs) || 0,
            fat: Number((r.macros as Record<string, unknown>)?.fat) || 0,
            fiber: Number((r.macros as Record<string, unknown>)?.fiber) || 0,
          },
          tags,
          steps: Array.isArray(r.steps) ? r.steps.slice(0, 8).map(String) : [],
        },
      };
    });

    // Filter out incomplete recipes (must have ≥3 ingredients and ≥1 step)
    const valid = sanitized.filter((m: { recipe: { ingredients: unknown[]; steps: unknown[] } }) =>
      m.recipe.ingredients.length >= 3 && m.recipe.steps.length >= 1
    );

    return NextResponse.json({ meals: valid, count: valid.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Generate meal plan error:", message);
    return NextResponse.json({ error: "Failed to generate meal plan", debug: message.substring(0, 300) }, { status: 500 });
  }
}
