import { NextRequest, NextResponse } from "next/server";

// Additive risk database (common ones)
const ADDITIVE_RISKS: Record<string, { risk: "high" | "moderate" | "low" | "safe"; name: string }> = {
  "e950": { risk: "moderate", name: "Acesulfame K" },
  "e951": { risk: "moderate", name: "Aspartame" },
  "e955": { risk: "moderate", name: "Sucralose" },
  "e621": { risk: "moderate", name: "MSG" },
  "e250": { risk: "high", name: "Sodium Nitrite" },
  "e251": { risk: "high", name: "Sodium Nitrate" },
  "e320": { risk: "high", name: "BHA" },
  "e321": { risk: "high", name: "BHT" },
  "e171": { risk: "high", name: "Titanium Dioxide" },
  "e102": { risk: "high", name: "Tartrazine" },
  "e110": { risk: "high", name: "Sunset Yellow" },
  "e122": { risk: "moderate", name: "Carmoisine" },
  "e124": { risk: "high", name: "Ponceau 4R" },
  "e129": { risk: "high", name: "Allura Red" },
  "e211": { risk: "high", name: "Sodium Benzoate" },
  "e220": { risk: "moderate", name: "Sulfur Dioxide" },
  "e407": { risk: "moderate", name: "Carrageenan" },
  "e450": { risk: "low", name: "Diphosphates" },
  "e471": { risk: "safe", name: "Mono/Diglycerides" },
  "e322": { risk: "safe", name: "Lecithin" },
  "e330": { risk: "safe", name: "Citric Acid" },
  "e300": { risk: "safe", name: "Ascorbic Acid (Vitamin C)" },
  "e306": { risk: "safe", name: "Tocopherols (Vitamin E)" },
  "e412": { risk: "safe", name: "Guar Gum" },
  "e415": { risk: "safe", name: "Xanthan Gum" },
  "e440": { risk: "safe", name: "Pectin" },
  "e500": { risk: "safe", name: "Sodium Carbonates" },
  "e503": { risk: "safe", name: "Ammonium Carbonates" },
};

function calculateHealthScore(product: Record<string, unknown>) {
  const nutriments = (product.nutriments || {}) as Record<string, number>;
  const additivesTags = (product.additives_tags || []) as string[];
  const labels = ((product.labels_tags || []) as string[]).join(" ").toLowerCase();

  // === 1. NUTRITION SCORE (0-65 points) ===
  // Negative points (bad stuff, 0-40)
  const sugar100g = nutriments.sugars_100g || nutriments["sugars_100g"] || 0;
  const salt100g = nutriments.salt_100g || (nutriments.sodium_100g || 0) * 2.5;
  const satFat100g = nutriments.saturated_fat_100g || nutriments["saturated-fat_100g"] || 0;
  // Energy: try kcal fields first, fall back to kJ ÷ 4.184
  const energy100g = nutriments["energy-kcal_100g"]
    || nutriments.energy_kcal_100g
    || (nutriments["energy-kj_100g"] ? nutriments["energy-kj_100g"] / 4.184 : 0)
    || (nutriments.energy_kj_100g ? nutriments.energy_kj_100g / 4.184 : 0)
    || (nutriments.energy_100g ? nutriments.energy_100g / 4.184 : 0)
    || 0;

  let negativePoints = 0;
  negativePoints += Math.min(10, Math.floor(sugar100g / 4.5));
  negativePoints += Math.min(10, Math.floor(salt100g / 0.9));
  negativePoints += Math.min(10, Math.floor(satFat100g / 1));
  negativePoints += Math.min(10, Math.floor(energy100g / 335));

  // Positive points (good stuff, 0-15)
  const fiber100g = nutriments.fiber_100g || 0;
  const protein100g = nutriments.proteins_100g || 0;

  let positivePoints = 0;
  positivePoints += Math.min(5, Math.floor(fiber100g / 0.9));
  positivePoints += Math.min(5, Math.floor(protein100g / 1.6));
  // Fruits/veg estimate from tags
  const hasFruits = ((product.categories_tags || []) as string[]).some((c: string) =>
    c.includes("fruit") || c.includes("vegetable") || c.includes("legume")
  );
  if (hasFruits) positivePoints += 5;

  const nutritionRaw = Math.max(0, 40 - negativePoints + positivePoints);
  const nutritionScore = Math.min(65, Math.round((nutritionRaw / 40) * 65));

  // === 2. ADDITIVES PENALTY (0 to -35 points) ===
  const detectedAdditives: { code: string; name: string; risk: string }[] = [];
  let additivePenalty = 0;
  let hasHighRisk = false;

  for (const tag of additivesTags) {
    const code = tag.replace("en:", "").toLowerCase();
    const info = ADDITIVE_RISKS[code];
    if (info) {
      detectedAdditives.push({ code: code.toUpperCase(), name: info.name, risk: info.risk });
      if (info.risk === "high") { additivePenalty += 10; hasHighRisk = true; }
      else if (info.risk === "moderate") additivePenalty += 5;
      else if (info.risk === "low") additivePenalty += 2;
    } else {
      // Unknown additive — small penalty
      detectedAdditives.push({ code: code.toUpperCase(), name: code.toUpperCase(), risk: "unknown" });
      additivePenalty += 1;
    }
  }
  additivePenalty = Math.min(35, additivePenalty);

  // === 3. ORGANIC BONUS (0-10 points) ===
  const isOrganic = labels.includes("organic") || labels.includes("bio");
  const organicBonus = isOrganic ? 10 : 0;

  // === FINAL SCORE ===
  let score = nutritionScore - additivePenalty + organicBonus;
  // Cap at 50 if high-risk additive present
  if (hasHighRisk && score > 50) score = 50;
  score = Math.max(0, Math.min(100, score));

  // Grade
  let grade: string;
  let gradeColor: string;
  if (score >= 75) { grade = "Excellent"; gradeColor = "#4ade80"; }
  else if (score >= 50) { grade = "Good"; gradeColor = "#a3e635"; }
  else if (score >= 25) { grade = "Mediocre"; gradeColor = "#f59e0b"; }
  else { grade = "Bad"; gradeColor = "#ff6b6b"; }

  // Traffic lights
  const trafficLights = {
    sugar: sugar100g > 12.5 ? "high" : sugar100g > 5 ? "moderate" : "low",
    salt: salt100g > 1.5 ? "high" : salt100g > 0.3 ? "moderate" : "low",
    saturatedFat: satFat100g > 5 ? "high" : satFat100g > 1.5 ? "moderate" : "low",
    calories: energy100g > 400 ? "high" : energy100g > 200 ? "moderate" : "low",
  };

  return {
    score,
    grade,
    gradeColor,
    nutritionScore,
    additivePenalty,
    organicBonus,
    isOrganic,
    hasHighRisk,
    trafficLights,
    additives: detectedAdditives,
    nutriments: {
      sugar: sugar100g,
      salt: salt100g,
      saturatedFat: satFat100g,
      calories: energy100g,
      fiber: fiber100g,
      protein: protein100g,
    },
  };
}

export async function GET(req: NextRequest) {
  try {
    const barcode = req.nextUrl.searchParams.get("code");
    if (!barcode || !/^\d{4,14}$/.test(barcode)) {
      return NextResponse.json({ error: "Invalid barcode" }, { status: 400 });
    }

    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
      headers: { "User-Agent": "FridgeFitness/1.0" },
    });

    if (!res.ok) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    const data = await res.json();
    if (data.status !== 1 || !data.product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const p = data.product;
    const n = (p.nutriments || {}) as Record<string, number>;
    const healthScore = calculateHealthScore(p);

    // Per-serving data
    const servingSize = p.serving_size || (p.serving_quantity ? `${p.serving_quantity}${p.serving_quantity_unit || "g"}` : null);
    const perServing = {
      sugar: n.sugars_serving || 0,
      salt: n.salt_serving || (n.sodium_serving || 0) * 2.5 || 0,
      saturatedFat: n["saturated-fat_serving"] || n.saturated_fat_serving || 0,
      calories: n["energy-kcal_serving"] || n.energy_kcal_serving || (n["energy-kj_serving"] ? n["energy-kj_serving"] / 4.184 : 0) || (n.energy_serving ? n.energy_serving / 4.184 : 0) || 0,
      fiber: n.fiber_serving || 0,
      protein: n.proteins_serving || 0,
    };

    // Total (whole package) — estimate from per-100g * product quantity, or use product-level fields
    const productQuantityG = parseFloat(String(p.product_quantity || "0")) || 0;
    const multiplier = productQuantityG > 0 ? productQuantityG / 100 : 1;
    const total = {
      sugar: healthScore.nutriments.sugar * multiplier,
      salt: healthScore.nutriments.salt * multiplier,
      saturatedFat: healthScore.nutriments.saturatedFat * multiplier,
      calories: healthScore.nutriments.calories * multiplier,
      fiber: healthScore.nutriments.fiber * multiplier,
      protein: healthScore.nutriments.protein * multiplier,
    };
    const totalSize = p.product_quantity ? `${p.product_quantity}${p.product_quantity_unit || "g"}` : (p.quantity || null);

    return NextResponse.json({
      product: {
        name: p.product_name || p.product_name_en || "Unknown Product",
        brand: p.brands || "Unknown Brand",
        imageUrl: p.image_front_small_url || null,
        quantity: p.quantity || "",
        servingSize: servingSize || p.serving_size || null,
        categories: ((p.categories_tags || []) as string[]).slice(0, 5).map((c: string) => c.replace("en:", "").replace(/-/g, " ")),
        barcode,
      },
      ...healthScore,
      perServing,
      total,
      totalSize,
    });
  } catch {
    return NextResponse.json({ error: "Failed to analyze product" }, { status: 500 });
  }
}
