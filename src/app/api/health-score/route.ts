import { NextRequest, NextResponse } from "next/server";

// ── FOOD ADDITIVE RISKS ──
const FOOD_ADDITIVE_RISKS: Record<string, { risk: "high" | "moderate" | "low" | "safe"; name: string }> = {
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

// ── SKINCARE / COSMETIC INGREDIENT RISKS ──
const SKINCARE_RISKS: Record<string, { risk: "high" | "moderate" | "low" | "safe"; name: string; concern: string }> = {
  // HIGH RISK — linked to cancer, endocrine disruption, severe irritation
  "formaldehyde": { risk: "high", name: "Formaldehyde", concern: "Carcinogen" },
  "bha": { risk: "high", name: "BHA (Butylated Hydroxyanisole)", concern: "Endocrine disruptor, possible carcinogen" },
  "bht": { risk: "high", name: "BHT (Butylated Hydroxytoluene)", concern: "Endocrine disruptor" },
  "triclosan": { risk: "high", name: "Triclosan", concern: "Endocrine disruptor, antibiotic resistance" },
  "oxybenzone": { risk: "high", name: "Oxybenzone", concern: "Endocrine disruptor, coral reef damage" },
  "parabens": { risk: "high", name: "Parabens", concern: "Endocrine disruptor" },
  "methylparaben": { risk: "high", name: "Methylparaben", concern: "Endocrine disruptor" },
  "propylparaben": { risk: "high", name: "Propylparaben", concern: "Endocrine disruptor" },
  "butylparaben": { risk: "high", name: "Butylparaben", concern: "Endocrine disruptor" },
  "ethylparaben": { risk: "high", name: "Ethylparaben", concern: "Endocrine disruptor" },
  "coal tar": { risk: "high", name: "Coal Tar", concern: "Carcinogen" },
  "hydroquinone": { risk: "high", name: "Hydroquinone", concern: "Organ toxicity, cancer risk" },
  "lead acetate": { risk: "high", name: "Lead Acetate", concern: "Neurotoxin" },
  "toluene": { risk: "high", name: "Toluene", concern: "Neurotoxin, reproductive harm" },
  "phthalates": { risk: "high", name: "Phthalates", concern: "Endocrine disruptor" },
  "dibutyl phthalate": { risk: "high", name: "Dibutyl Phthalate", concern: "Reproductive toxin" },
  // MODERATE RISK
  "sodium lauryl sulfate": { risk: "moderate", name: "SLS", concern: "Skin irritant" },
  "sodium laureth sulfate": { risk: "moderate", name: "SLES", concern: "Can contain 1,4-dioxane" },
  "fragrance": { risk: "moderate", name: "Fragrance/Parfum", concern: "Undisclosed chemicals, allergens" },
  "parfum": { risk: "moderate", name: "Parfum", concern: "Undisclosed chemicals, allergens" },
  "dmdm hydantoin": { risk: "moderate", name: "DMDM Hydantoin", concern: "Formaldehyde releaser" },
  "polyethylene glycol": { risk: "moderate", name: "PEG Compounds", concern: "Can contain impurities" },
  "peg": { risk: "moderate", name: "PEG", concern: "Can contain 1,4-dioxane" },
  "retinyl palmitate": { risk: "moderate", name: "Retinyl Palmitate", concern: "Sun sensitivity, may accelerate skin damage" },
  "mineral oil": { risk: "moderate", name: "Mineral Oil", concern: "Petroleum derived, can clog pores" },
  "petrolatum": { risk: "moderate", name: "Petrolatum", concern: "Petroleum derived, contamination risk" },
  "aluminum": { risk: "moderate", name: "Aluminum Compounds", concern: "Potential neurotoxin" },
  "silicone": { risk: "moderate", name: "Silicones", concern: "Environmental concern, pore clogging" },
  "dimethicone": { risk: "moderate", name: "Dimethicone", concern: "Can trap bacteria" },
  // LOW RISK
  "phenoxyethanol": { risk: "low", name: "Phenoxyethanol", concern: "Mild irritant in high concentrations" },
  "cetearyl alcohol": { risk: "low", name: "Cetearyl Alcohol", concern: "Generally safe, rare irritant" },
  "tocopherol": { risk: "safe", name: "Tocopherol (Vitamin E)", concern: "Antioxidant" },
  // SAFE / GOOD
  "hyaluronic acid": { risk: "safe", name: "Hyaluronic Acid", concern: "Hydrating" },
  "niacinamide": { risk: "safe", name: "Niacinamide (Vitamin B3)", concern: "Brightening, anti-aging" },
  "glycerin": { risk: "safe", name: "Glycerin", concern: "Moisturizing" },
  "aloe": { risk: "safe", name: "Aloe Vera", concern: "Soothing" },
  "shea butter": { risk: "safe", name: "Shea Butter", concern: "Moisturizing" },
  "jojoba": { risk: "safe", name: "Jojoba Oil", concern: "Moisturizing" },
  "squalane": { risk: "safe", name: "Squalane", concern: "Hydrating" },
  "ceramide": { risk: "safe", name: "Ceramides", concern: "Barrier repair" },
  "salicylic acid": { risk: "safe", name: "Salicylic Acid", concern: "Exfoliant, anti-acne" },
  "retinol": { risk: "low", name: "Retinol", concern: "Anti-aging, can cause irritation" },
  "zinc oxide": { risk: "safe", name: "Zinc Oxide", concern: "Safe sunscreen" },
  "titanium dioxide": { risk: "low", name: "Titanium Dioxide", concern: "Safe in non-nano form" },
  "water": { risk: "safe", name: "Water (Aqua)", concern: "Base ingredient" },
  "aqua": { risk: "safe", name: "Aqua (Water)", concern: "Base ingredient" },
};

function isCosmetic(product: Record<string, unknown>): boolean {
  const cats = ((product.categories_tags || product.categories || []) as string[]).join(" ").toLowerCase();
  const name = String(product.product_name || "").toLowerCase();
  const keywords = ["cosmetic", "beauty", "skincare", "skin care", "shampoo", "conditioner", "lotion",
    "cream", "serum", "cleanser", "moisturizer", "sunscreen", "spf", "makeup", "lipstick",
    "foundation", "mascara", "deodorant", "soap", "body wash", "face wash", "toner",
    "perfume", "cologne", "toothpaste", "mouthwash", "hair"];
  return keywords.some((k) => cats.includes(k) || name.includes(k));
}

function calculateFoodScore(product: Record<string, unknown>) {
  const nutriments = (product.nutriments || {}) as Record<string, number>;
  const additivesTags = (product.additives_tags || []) as string[];
  const labels = ((product.labels_tags || []) as string[]).join(" ").toLowerCase();

  // Nutrition (0-60)
  const sugar100g = nutriments.sugars_100g || 0;
  const salt100g = nutriments.salt_100g || (nutriments.sodium_100g || 0) * 2.5;
  const satFat100g = nutriments.saturated_fat_100g || nutriments["saturated-fat_100g"] || 0;
  const energy100g = nutriments["energy-kcal_100g"] || nutriments.energy_kcal_100g
    || (nutriments["energy-kj_100g"] ? nutriments["energy-kj_100g"] / 4.184 : 0)
    || (nutriments.energy_100g ? nutriments.energy_100g / 4.184 : 0) || 0;
  const fiber100g = nutriments.fiber_100g || 0;
  const protein100g = nutriments.proteins_100g || 0;

  let negPts = 0;
  negPts += Math.min(10, Math.floor(sugar100g / 4.5));
  negPts += Math.min(10, Math.floor(salt100g / 0.9));
  negPts += Math.min(10, Math.floor(satFat100g / 1));
  negPts += Math.min(10, Math.floor(energy100g / 335));

  let posPts = 0;
  posPts += Math.min(5, Math.floor(fiber100g / 0.9));
  posPts += Math.min(5, Math.floor(protein100g / 1.6));
  const hasFruits = ((product.categories_tags || []) as string[]).some((c: string) =>
    c.includes("fruit") || c.includes("vegetable") || c.includes("legume"));
  if (hasFruits) posPts += 5;

  const nutritionScore = Math.min(60, Math.max(0, Math.round(((40 - negPts + posPts) / 40) * 60)));

  // Additives (heavier penalties)
  const detectedAdditives: { code: string; name: string; risk: string }[] = [];
  let additivePenalty = 0;
  let highRiskCount = 0;

  for (const tag of additivesTags) {
    const code = tag.replace("en:", "").toLowerCase();
    const info = FOOD_ADDITIVE_RISKS[code];
    if (info) {
      detectedAdditives.push({ code: code.toUpperCase(), name: info.name, risk: info.risk });
      if (info.risk === "high") { additivePenalty += 15; highRiskCount++; }
      else if (info.risk === "moderate") additivePenalty += 7;
      else if (info.risk === "low") additivePenalty += 2;
    } else {
      detectedAdditives.push({ code: code.toUpperCase(), name: code.toUpperCase(), risk: "unknown" });
      additivePenalty += 2;
    }
  }
  additivePenalty = Math.min(50, additivePenalty);

  const isOrganic = labels.includes("organic") || labels.includes("bio");
  const organicBonus = isOrganic ? 10 : 0;

  let score = nutritionScore - additivePenalty + organicBonus;
  // Hard cap: each high-risk additive caps score lower
  if (highRiskCount >= 3) score = Math.min(score, 20);
  else if (highRiskCount >= 2) score = Math.min(score, 35);
  else if (highRiskCount >= 1) score = Math.min(score, 50);
  score = Math.max(0, Math.min(100, score));

  const trafficLights = {
    sugar: sugar100g > 12.5 ? "high" : sugar100g > 5 ? "moderate" : "low",
    salt: salt100g > 1.5 ? "high" : salt100g > 0.3 ? "moderate" : "low",
    saturatedFat: satFat100g > 5 ? "high" : satFat100g > 1.5 ? "moderate" : "low",
    calories: energy100g > 400 ? "high" : energy100g > 200 ? "moderate" : "low",
  };

  return {
    type: "food" as const, score, nutritionScore, additivePenalty, organicBonus,
    isOrganic, hasHighRisk: highRiskCount > 0, highRiskCount, trafficLights,
    additives: detectedAdditives,
    nutriments: { sugar: sugar100g, salt: salt100g, saturatedFat: satFat100g, calories: energy100g, fiber: fiber100g, protein: protein100g },
  };
}

function calculateSkincareScore(product: Record<string, unknown>) {
  const ingredientsText = String(product.ingredients_text || product.ingredients_text_en || "").toLowerCase();
  const ingredientsTags = (product.ingredients_tags || []) as string[];
  const labels = ((product.labels_tags || []) as string[]).join(" ").toLowerCase();

  // Parse ingredients from text + tags
  const allIngredients = [
    ...ingredientsTags.map((t: string) => t.replace("en:", "").toLowerCase()),
    ...ingredientsText.split(/[,;]/).map((s: string) => s.trim().toLowerCase()),
  ];

  const detectedAdditives: { code: string; name: string; risk: string; concern: string }[] = [];
  let goodCount = 0;
  let badPenalty = 0;
  let highRiskCount = 0;

  for (const [key, info] of Object.entries(SKINCARE_RISKS)) {
    const found = allIngredients.some((ing) => ing.includes(key));
    if (found) {
      detectedAdditives.push({ code: key.toUpperCase(), name: info.name, risk: info.risk, concern: info.concern });
      if (info.risk === "high") { badPenalty += 20; highRiskCount++; }
      else if (info.risk === "moderate") badPenalty += 8;
      else if (info.risk === "low") badPenalty += 2;
      else if (info.risk === "safe") goodCount++;
    }
  }

  const baseScore = 60 + Math.min(20, goodCount * 4); // good ingredients boost
  const isOrganic = labels.includes("organic") || labels.includes("bio") || labels.includes("natural");
  const organicBonus = isOrganic ? 10 : 0;

  let score = baseScore - badPenalty + organicBonus;
  if (highRiskCount >= 3) score = Math.min(score, 15);
  else if (highRiskCount >= 2) score = Math.min(score, 25);
  else if (highRiskCount >= 1) score = Math.min(score, 40);
  score = Math.max(0, Math.min(100, score));

  return {
    type: "skincare" as const, score, goodCount, badPenalty, organicBonus,
    isOrganic, hasHighRisk: highRiskCount > 0, highRiskCount,
    additives: detectedAdditives,
    ingredientCount: allIngredients.filter(Boolean).length,
  };
}

function getGrade(score: number) {
  if (score >= 75) return { grade: "Excellent", gradeColor: "#4ade80" };
  if (score >= 50) return { grade: "Good", gradeColor: "#a3e635" };
  if (score >= 25) return { grade: "Mediocre", gradeColor: "#f59e0b" };
  return { grade: "Bad", gradeColor: "#ff6b6b" };
}

export async function GET(req: NextRequest) {
  try {
    const barcode = req.nextUrl.searchParams.get("code");
    if (!barcode || !/^\d{4,14}$/.test(barcode)) {
      return NextResponse.json({ error: "Invalid barcode" }, { status: 400 });
    }

    // Try food database first
    let product = null;
    const foodRes = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
      headers: { "User-Agent": "FridgeFitness/1.0" },
    });
    if (foodRes.ok) {
      const foodData = await foodRes.json();
      if (foodData.status === 1 && foodData.product) product = foodData.product;
    }

    // Try cosmetics database if not found or if it's a cosmetic
    if (!product) {
      const cosmeticRes = await fetch(`https://world.openbeautyfacts.org/api/v2/product/${barcode}.json`, {
        headers: { "User-Agent": "FridgeFitness/1.0" },
      });
      if (cosmeticRes.ok) {
        const cosmeticData = await cosmeticRes.json();
        if (cosmeticData.status === 1 && cosmeticData.product) product = cosmeticData.product;
      }
    }

    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const p = product as Record<string, unknown>;
    const isSkincare = isCosmetic(p);
    const result = isSkincare ? calculateSkincareScore(p) : calculateFoodScore(p);
    const { grade, gradeColor } = getGrade(result.score);

    const n = (p.nutriments || {}) as Record<string, number>;
    const servingSize = (p.serving_size as string) || ((p.serving_quantity as string) ? `${p.serving_quantity}${(p.serving_quantity_unit as string) || "g"}` : null);
    const perServing = isSkincare ? null : {
      sugar: n.sugars_serving || 0,
      salt: n.salt_serving || (n.sodium_serving || 0) * 2.5 || 0,
      saturatedFat: n["saturated-fat_serving"] || n.saturated_fat_serving || 0,
      calories: n["energy-kcal_serving"] || n.energy_kcal_serving || (n["energy-kj_serving"] ? n["energy-kj_serving"] / 4.184 : 0) || 0,
      fiber: n.fiber_serving || 0,
      protein: n.proteins_serving || 0,
    };

    const productQuantityG = parseFloat(String(p.product_quantity || "0")) || 0;
    const multiplier = productQuantityG > 0 ? productQuantityG / 100 : 1;
    const foodNutriments = result.type === "food" ? result.nutriments : null;
    const total = foodNutriments ? {
      sugar: foodNutriments.sugar * multiplier,
      salt: foodNutriments.salt * multiplier,
      saturatedFat: foodNutriments.saturatedFat * multiplier,
      calories: foodNutriments.calories * multiplier,
      fiber: foodNutriments.fiber * multiplier,
      protein: foodNutriments.protein * multiplier,
    } : null;

    return NextResponse.json({
      product: {
        name: (p.product_name as string) || (p.product_name_en as string) || "Unknown Product",
        brand: (p.brands as string) || "Unknown Brand",
        imageUrl: (p.image_front_small_url as string) || null,
        quantity: (p.quantity as string) || "",
        servingSize,
        categories: ((p.categories_tags || []) as string[]).slice(0, 5).map((c: string) => c.replace("en:", "").replace(/-/g, " ")),
        barcode,
      },
      ...result,
      grade,
      gradeColor,
      perServing,
      total,
      totalSize: p.product_quantity ? `${p.product_quantity}${(p.product_quantity_unit as string) || "g"}` : ((p.quantity as string) || null),
    });
  } catch {
    return NextResponse.json({ error: "Failed to analyze product" }, { status: 500 });
  }
}
