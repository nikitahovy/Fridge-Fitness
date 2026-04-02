import { Recipe, ItemWithRisk, DailyRecoveryContext, ScoredRecipe } from "./types";

const WEIGHTS = {
  atRiskCoverage: 0.30,
  macroMatch: 0.25,
  wasteValueRescued: 0.15,
  inventoryCoverage: 0.10,
  userPreference: 0.10,
  prepFriction: 0.10,
};

function matchInventoryItem(ingredientName: string, items: ItemWithRisk[]): ItemWithRisk | undefined {
  const normalized = ingredientName.toLowerCase();
  return items.find((item) => item.name.toLowerCase().includes(normalized) || normalized.includes(item.name.toLowerCase()));
}

function computeMacroMatch(recipe: Recipe, recovery: DailyRecoveryContext): number {
  const { protein, carbs } = recipe.macros;
  const total = protein + carbs + recipe.macros.fat;
  if (total === 0) return 0.5;

  const proteinRatio = protein / total;
  const carbRatio = carbs / total;

  switch (recovery.inferredDayType) {
    case "strength":
      // Want high protein (>35% ideal)
      return Math.min(1, proteinRatio / 0.35);
    case "cardio":
      // Want balanced carbs+protein
      return Math.min(1, (carbRatio + proteinRatio) / 0.7);
    case "rest":
      // Prefer easy, balanced meals
      return 0.7;
    case "mixed":
      return Math.min(1, proteinRatio / 0.3);
    default:
      return 0.5;
  }
}

function computePrepFriction(recipe: Recipe, recovery: DailyRecoveryContext): number {
  const base = Math.min(1, recipe.cookTimeMinutes / 30);
  // On low recovery days, friction matters more
  if (recovery.readinessBand === "low") return base;
  return base * 0.6;
}

export function scoreRecipe(
  recipe: Recipe,
  inventory: ItemWithRisk[],
  recovery: DailyRecoveryContext
): ScoredRecipe {
  const requiredIngredients = recipe.ingredients.filter((i) => !i.optional);
  const allIngredients = recipe.ingredients;

  const matchedItems: ItemWithRisk[] = [];
  const atRiskItemsRescued: ItemWithRisk[] = [];
  const missingIngredients = [];

  for (const ingredient of allIngredients) {
    const match = matchInventoryItem(ingredient.normalizedName, inventory);
    if (match) {
      matchedItems.push(match);
      if (match.riskTier === "use-today" || match.riskTier === "use-this-week") {
        atRiskItemsRescued.push(match);
      }
    } else if (!ingredient.optional) {
      missingIngredients.push(ingredient);
    }
  }

  const inventoryCoverage = requiredIngredients.length > 0
    ? matchedItems.filter((m) => requiredIngredients.some((r) => matchInventoryItem(r.normalizedName, [m]))).length / requiredIngredients.length
    : 0;

  const atRiskCoverage = allIngredients.length > 0
    ? atRiskItemsRescued.length / allIngredients.length
    : 0;

  const wasteRescueValue = atRiskItemsRescued.reduce((sum, item) => sum + item.purchasePrice, 0);
  const normalizedWasteRescue = Math.min(1, wasteRescueValue / 20);

  const macroMatch = computeMacroMatch(recipe, recovery);
  const prepFriction = computePrepFriction(recipe, recovery);

  const score =
    WEIGHTS.atRiskCoverage * atRiskCoverage +
    WEIGHTS.macroMatch * macroMatch +
    WEIGHTS.wasteValueRescued * normalizedWasteRescue +
    WEIGHTS.inventoryCoverage * inventoryCoverage +
    WEIGHTS.userPreference * 0.5 - // neutral default
    WEIGHTS.prepFriction * prepFriction;

  // Generate explanations
  const explanation: string[] = [];
  if (atRiskItemsRescued.length > 0) {
    const names = atRiskItemsRescued.map((i) => i.name).join(" and ");
    explanation.push(`Uses ${names} expiring soon`);
  }
  if (wasteRescueValue > 0) {
    explanation.push(`Saves $${wasteRescueValue.toFixed(2)} in at-risk ingredients`);
  }
  if (macroMatch > 0.7) {
    const dayLabel = recovery.inferredDayType === "strength" ? "strength training" :
      recovery.inferredDayType === "cardio" ? "cardio" : "recovery";
    explanation.push(`Great ${recipe.macros.protein >= 30 ? "high-protein" : "balanced"} match for your ${dayLabel} day`);
  }
  if (recipe.cookTimeMinutes <= 10) {
    explanation.push("Ready in under 10 minutes");
  }
  if (missingIngredients.length === 0) {
    explanation.push("You have everything you need");
  }

  return {
    recipe,
    matchedItems,
    atRiskItemsRescued,
    missingIngredients,
    wasteRescueValue,
    score: Math.round(score * 100),
    explanation,
  };
}

export function rankRecipes(
  recipes: Recipe[],
  inventory: ItemWithRisk[],
  recovery: DailyRecoveryContext
): ScoredRecipe[] {
  return recipes
    .map((r) => scoreRecipe(r, inventory, recovery))
    .sort((a, b) => b.score - a.score);
}

export function rankEatFirstQueue(items: ItemWithRisk[], recovery: DailyRecoveryContext): ItemWithRisk[] {
  return [...items]
    .filter((item) => item.status === "active")
    .sort((a, b) => {
      const scoreA = computeEatFirstScore(a, recovery);
      const scoreB = computeEatFirstScore(b, recovery);
      return scoreB - scoreA;
    });
}

function computeEatFirstScore(item: ItemWithRisk, recovery: DailyRecoveryContext): number {
  const spoilage = item.spoilageRiskScore / 100;
  const value = Math.min(1, item.purchasePrice / 15);

  // Nutrition fit: does this item match today's needs?
  let nutritionFit = 0.5;
  if (recovery.inferredDayType === "strength" && item.nutritionTags.includes("high-protein")) {
    nutritionFit = 1.0;
  } else if (recovery.inferredDayType === "cardio" && item.nutritionTags.includes("complex-carbs")) {
    nutritionFit = 1.0;
  } else if (recovery.readinessBand === "low" && item.category === "produce") {
    nutritionFit = 0.8;
  }

  return 0.40 * spoilage + 0.30 * value + 0.20 * nutritionFit + 0.10 * 0.5;
}
