import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { getAuthenticatedClient } from "@/utils/supabase/api";
import { mapInventoryRow } from "@/utils/supabase/mappers";
import { computeItemRisk } from "@/lib/shelf-life";
import { recoveryPresets } from "@/lib/seed-data";
import { RecoveryPreset } from "@/lib/types";
import { checkRateLimit, getRateLimitId } from "@/lib/rate-limit";

const PROMPT = `You are a recipe generator for Fridge Fitness, a food waste reduction app.

Given a list of ingredients the user currently has (with spoilage urgency), generate 8-12 recipes that:
1. PRIORITIZE ingredients that are expiring soon (marked as "use-today" or "use-this-week")
2. Maximize use of owned ingredients — avoid recipes needing many missing items
3. Include a mix of quick meals (<15 min), medium (15-30 min), and longer (30+ min)
4. Cover different meal types: breakfast, lunch, dinner, snack
5. Consider the user's fitness day type for nutrition balance
6. EVERY recipe MUST have at least 3 ingredients. Combine pantry staples (salt, oil, flour, eggs, butter, spices) with the user's items to make complete dishes.
7. EVERY recipe MUST have at least 3 steps. Explain how to actually cook the dish.
8. Give recipes proper descriptive names. Do NOT use brand names in recipe names.

Return ONLY a valid JSON array. No markdown, no code fences, no explanation.

Each recipe must have:
- id: a unique string like "ai-1", "ai-2" etc
- name: recipe name
- imageSearchTerm: a short 2-3 word term for finding a photo of this dish (e.g. "chicken stir fry", "berry smoothie", "salmon bowl")
- ingredients: array of {name, normalizedName (lowercase), amount, optional (boolean)}
- cookTimeMinutes: number
- difficulty: "easy" | "medium" | "hard"
- macros: {protein, carbs, fat, fiber} in grams (estimate)
- tags: array of strings like "high-protein", "quick", "breakfast", "one-pot"
- steps: array of instruction strings (3-6 steps)

IMPORTANT: Every recipe needs at least 3 ingredients and 3 steps. No single-ingredient recipes. Make recipes practical and real — not just "throw everything together". Use common cooking techniques.`;

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY not set" }, { status: 503 });
    }

    const { supabase, user } = await getAuthenticatedClient();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const limited = checkRateLimit(getRateLimitId(req, user.id), "generate-recipes");
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
    // Curated food photos from Unsplash CDN, keyed by tag/category
    const FOOD_IMAGES: [string, string][] = [
      ["stir-fry", "photo-1511910849309-0dffb8785146"],
      ["smoothie", "photo-1505252585461-04db1eb84625"],
      ["bowl", "photo-1543508289-2a4346387248"],
      ["pasta", "photo-1563379926898-05f4575a45d8"],
      ["breakfast", "photo-1569991869939-599da7cd0149"],
      ["snack", "photo-1467453678174-768ec283a940"],
      ["salad", "photo-1512621776951-a57141f2eefd"],
      ["wrap", "photo-1664455248787-bed872761fa2"],
      ["sandwich", "photo-1664455248787-bed872761fa2"],
      ["soup", "photo-1613844237701-8f3664fc2eff"],
      ["one-pot", "photo-1585138548795-fa869d44af7c"],
      ["high-protein", "photo-1532550907401-a500c9a57435"],
      ["quick", "photo-1585417791023-a5a6164b2646"],
      ["dinner", "photo-1547573854-74d2a71d0826"],
      ["lunch", "photo-1536329639134-ade172b2fea0"],
      ["dessert", "photo-1492683513054-55277abccd99"],
      ["recovery", "photo-1564636242997-77953084df48"],
      ["curry", "photo-1565557623262-b51c2513a641"],
      ["tacos", "photo-1551504734-5ee1c4a1479b"],
      ["mexican", "photo-1551504734-5ee1c4a1479b"],
      ["baked", "photo-1573730301149-84ca30c4c924"],
      ["roasted", "photo-1573730301149-84ca30c4c924"],
      ["seafood", "photo-1578935149228-66b184c83e69"],
      ["low-carb", "photo-1532550907401-a500c9a57435"],
    ];
    // All unique photo IDs for fallback cycling
    const ALL_PHOTO_IDS = [...new Set(FOOD_IMAGES.map(([, id]) => id))];
    const usedPhotos = new Set<string>();

    function pickImage(tags: string[], idx: number): string {
      // Try to match a specific tag first
      for (const tag of tags) {
        const key = tag.toLowerCase();
        const match = FOOD_IMAGES.find(([k]) => k === key);
        if (match && !usedPhotos.has(match[1])) {
          usedPhotos.add(match[1]);
          return `https://images.unsplash.com/${match[1]}?w=600&h=400&fit=crop`;
        }
      }
      // Fallback: cycle through all photos by index to avoid duplicates
      const photoId = ALL_PHOTO_IDS[idx % ALL_PHOTO_IDS.length];
      return `https://images.unsplash.com/${photoId}?w=600&h=400&fit=crop`;
    }

    const sanitized = recipes.slice(0, 15).map((r: Record<string, unknown>, idx: number) => {
      const name = String(r.name || "Untitled Recipe").slice(0, 200);
      const tags = Array.isArray(r.tags) ? r.tags.slice(0, 10).map(String) : [];
      return {
        id: `ai-${idx + 1}`,
        name,
        imageUrl: pickImage(tags, idx),
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
      };
    });

    // Filter out incomplete recipes (must have ≥3 ingredients and ≥1 step)
    const valid = sanitized.filter((r: { ingredients: unknown[]; steps: unknown[] }) => r.ingredients.length >= 3 && r.steps.length >= 1);

    return NextResponse.json({ recipes: valid, count: valid.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Generate recipes error:", message);
    return NextResponse.json({ error: "Failed to generate recipes", debug: message.substring(0, 300) }, { status: 500 });
  }
}
