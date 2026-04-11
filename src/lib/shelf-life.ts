import { InventoryItem, ItemWithRisk, RiskTier } from "./types";
import { daysBetween, today } from "./utils";

// Days of shelf life: sealed in fridge, after opening, frozen
const SHELF_LIFE_RULES: Record<string, { sealed: number; opened: number; frozen: number }> = {
  // Proteins
  "chicken breast": { sealed: 3, opened: 2, frozen: 180 },
  "chicken thighs": { sealed: 3, opened: 2, frozen: 180 },
  "ground beef": { sealed: 3, opened: 2, frozen: 120 },
  "ground turkey": { sealed: 3, opened: 2, frozen: 180 },
  "steak": { sealed: 5, opened: 3, frozen: 180 },
  "pork chops": { sealed: 5, opened: 3, frozen: 180 },
  "bacon": { sealed: 14, opened: 7, frozen: 180 },
  "salmon fillet": { sealed: 3, opened: 1, frozen: 180 },
  "salmon": { sealed: 3, opened: 1, frozen: 180 },
  "shrimp": { sealed: 3, opened: 2, frozen: 180 },
  "tuna": { sealed: 3, opened: 1, frozen: 180 },
  "tofu": { sealed: 21, opened: 5, frozen: 180 },
  "eggs": { sealed: 28, opened: 28, frozen: 0 },
  "deli meat": { sealed: 7, opened: 5, frozen: 60 },
  "sausage": { sealed: 7, opened: 3, frozen: 120 },
  // Dairy
  "whole milk": { sealed: 10, opened: 5, frozen: 0 },
  "milk": { sealed: 10, opened: 5, frozen: 0 },
  "oat milk": { sealed: 14, opened: 7, frozen: 0 },
  "almond milk": { sealed: 14, opened: 7, frozen: 0 },
  "greek yogurt": { sealed: 14, opened: 5, frozen: 60 },
  "yogurt": { sealed: 14, opened: 5, frozen: 60 },
  "butter": { sealed: 90, opened: 30, frozen: 365 },
  "cream cheese": { sealed: 21, opened: 10, frozen: 60 },
  "sour cream": { sealed: 21, opened: 7, frozen: 0 },
  "cheddar cheese": { sealed: 28, opened: 14, frozen: 120 },
  "mozzarella": { sealed: 21, opened: 7, frozen: 120 },
  "parmesan": { sealed: 180, opened: 60, frozen: 180 },
  "heavy cream": { sealed: 21, opened: 7, frozen: 0 },
  // Produce
  "baby spinach": { sealed: 5, opened: 3, frozen: 120 },
  "spinach": { sealed: 5, opened: 3, frozen: 120 },
  "lettuce": { sealed: 7, opened: 5, frozen: 0 },
  "kale": { sealed: 7, opened: 5, frozen: 120 },
  "broccoli": { sealed: 7, opened: 5, frozen: 120 },
  "bell peppers": { sealed: 7, opened: 5, frozen: 120 },
  "tomatoes": { sealed: 7, opened: 3, frozen: 60 },
  "onions": { sealed: 30, opened: 10, frozen: 180 },
  "garlic": { sealed: 60, opened: 14, frozen: 180 },
  "potatoes": { sealed: 21, opened: 14, frozen: 120 },
  "sweet potatoes": { sealed: 21, opened: 14, frozen: 120 },
  "carrots": { sealed: 21, opened: 14, frozen: 120 },
  "celery": { sealed: 14, opened: 7, frozen: 120 },
  "cucumber": { sealed: 7, opened: 3, frozen: 0 },
  "avocado": { sealed: 5, opened: 2, frozen: 120 },
  "avocados": { sealed: 5, opened: 2, frozen: 120 },
  "bananas": { sealed: 5, opened: 3, frozen: 120 },
  "apples": { sealed: 21, opened: 7, frozen: 120 },
  "oranges": { sealed: 14, opened: 5, frozen: 0 },
  "lemons": { sealed: 21, opened: 7, frozen: 120 },
  "limes": { sealed: 21, opened: 7, frozen: 120 },
  "strawberries": { sealed: 5, opened: 3, frozen: 180 },
  "blueberries": { sealed: 7, opened: 5, frozen: 180 },
  "grapes": { sealed: 7, opened: 5, frozen: 180 },
  "mushrooms": { sealed: 7, opened: 5, frozen: 120 },
  "corn": { sealed: 5, opened: 3, frozen: 180 },
  "zucchini": { sealed: 7, opened: 5, frozen: 120 },
  // Grains & Pantry
  "bread": { sealed: 7, opened: 5, frozen: 180 },
  "tortillas": { sealed: 14, opened: 7, frozen: 180 },
  "brown rice": { sealed: 365, opened: 180, frozen: 365 },
  "white rice": { sealed: 730, opened: 365, frozen: 365 },
  "pasta": { sealed: 730, opened: 365, frozen: 365 },
  "oats": { sealed: 365, opened: 180, frozen: 365 },
  "cereal": { sealed: 180, opened: 30, frozen: 0 },
  "flour": { sealed: 365, opened: 180, frozen: 365 },
  // Canned & Jarred
  "canned black beans": { sealed: 730, opened: 3, frozen: 0 },
  "canned beans": { sealed: 730, opened: 3, frozen: 0 },
  "canned tomatoes": { sealed: 730, opened: 5, frozen: 0 },
  "canned tuna": { sealed: 730, opened: 2, frozen: 0 },
  "peanut butter": { sealed: 365, opened: 90, frozen: 0 },
  "jam": { sealed: 365, opened: 30, frozen: 0 },
  "salsa": { sealed: 180, opened: 14, frozen: 0 },
  "pickles": { sealed: 365, opened: 60, frozen: 0 },
  // Condiments
  "olive oil": { sealed: 730, opened: 365, frozen: 0 },
  "soy sauce": { sealed: 730, opened: 365, frozen: 0 },
  "ketchup": { sealed: 365, opened: 180, frozen: 0 },
  "mustard": { sealed: 365, opened: 180, frozen: 0 },
  "mayonnaise": { sealed: 180, opened: 60, frozen: 0 },
  "hot sauce": { sealed: 730, opened: 365, frozen: 0 },
  "hummus": { sealed: 21, opened: 7, frozen: 0 },
  // Beverages
  "kombucha": { sealed: 60, opened: 5, frozen: 0 },
  "juice": { sealed: 14, opened: 7, frozen: 120 },
  "orange juice": { sealed: 14, opened: 7, frozen: 120 },
  // Frozen
  "frozen blueberries": { sealed: 365, opened: 180, frozen: 365 },
  "frozen broccoli": { sealed: 365, opened: 180, frozen: 365 },
  "frozen vegetables": { sealed: 365, opened: 180, frozen: 365 },
  "frozen pizza": { sealed: 180, opened: 0, frozen: 180 },
  "ice cream": { sealed: 120, opened: 60, frozen: 120 },
  // Snacks
  "chips": { sealed: 60, opened: 14, frozen: 0 },
  "crackers": { sealed: 180, opened: 30, frozen: 0 },
  "nuts": { sealed: 180, opened: 60, frozen: 365 },
  "granola bars": { sealed: 180, opened: 30, frozen: 0 },
  "chocolate": { sealed: 365, opened: 60, frozen: 365 },
  "gum": { sealed: 730, opened: 730, frozen: 0 },
};

const CATEGORY_DEFAULTS: Record<string, { sealed: number; opened: number; frozen: number }> = {
  protein: { sealed: 3, opened: 2, frozen: 180 },
  dairy: { sealed: 10, opened: 5, frozen: 60 },
  produce: { sealed: 5, opened: 3, frozen: 120 },
  grain: { sealed: 365, opened: 180, frozen: 365 },
  snack: { sealed: 30, opened: 14, frozen: 180 },
  beverage: { sealed: 30, opened: 7, frozen: 0 },
  condiment: { sealed: 180, opened: 30, frozen: 0 },
  frozen: { sealed: 365, opened: 180, frozen: 365 },
  other: { sealed: 14, opened: 7, frozen: 120 },
};

function findShelfLifeRules(name: string) {
  const normalized = name.toLowerCase().trim();

  // Pass 1: exact key match
  if (SHELF_LIFE_RULES[normalized]) return SHELF_LIFE_RULES[normalized];

  // Pass 2: substring match in either direction
  for (const [key, rules] of Object.entries(SHELF_LIFE_RULES)) {
    if (normalized.includes(key) || key.includes(normalized)) return rules;
  }

  // Pass 3: For multi-word keys, match if the input contains the FIRST
  // (distinguishing) word of the key. This catches "raw chicken" → "chicken
  // breast" without incorrectly matching "Korean BBQ sauce" → "soy sauce"
  // (the naive any-word overlap would match on the common word "sauce" and
  // grant 2-year shelf life to a totally different sauce). Single-word keys
  // are already handled by Pass 2 substring matching.
  const inputWords = normalized.split(/\s+/).filter((w) => w.length > 2);
  if (inputWords.length === 0) return null;

  for (const [key, rules] of Object.entries(SHELF_LIFE_RULES)) {
    const keyWords = key.split(/\s+/);
    if (keyWords.length < 2) continue;
    const firstWord = keyWords[0];
    if (firstWord.length > 2 && inputWords.includes(firstWord)) {
      return rules;
    }
  }
  return null;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function computeItemRisk(item: InventoryItem): ItemWithRisk {
  const namedRules = findShelfLifeRules(item.name);
  const rules = namedRules || CATEGORY_DEFAULTS[item.category] || CATEGORY_DEFAULTS.other;
  const fromCategoryDefault = !namedRules;

  if (item.status === "frozen" || item.location === "freezer") {
    const days = rules.frozen > 0 ? rules.frozen : 999;
    return {
      ...item,
      daysUntilQualityDecline: days,
      daysUntilDiscard: days + 30,
      spoilageRiskScore: 0,
      wasteValueScore: 0,
      riskTier: "frozen",
      reason: "Frozen — spoilage paused",
      confidence: 0.95,
    };
  }

  let expiryDays: number;
  let reason: string;
  let confidence: number;

  if (item.openedAt) {
    // Two competing timers:
    //  1. Opened life: rules.opened - daysSinceOpened (the post-opening shelf life)
    //  2. Sealed life: rules.sealed - daysSincePurchase (the absolute purchase-based life)
    //
    // Take whichever is SHORTER. This prevents the bug where opening an
    // already-expired item would magically grant fresh "opened" days. If a
    // chicken sat sealed in the fridge for 6 days (sealed=3 → expired), opening
    // it now should still read as expired, not give it 2 fresh days.
    const daysSinceOpened = Math.max(0, -daysBetween(item.openedAt, today()));
    const daysSincePurchase = Math.max(0, -daysBetween(item.purchaseDate, today()));
    const openedLife = rules.opened - daysSinceOpened;
    const sealedLife = rules.sealed - daysSincePurchase;
    expiryDays = Math.min(openedLife, sealedLife);
    const remaining = Math.max(0, expiryDays);
    const openedLabel = daysSinceOpened === 0 ? "today" : `${daysSinceOpened}d ago`;
    reason = `Opened ${openedLabel} · ${remaining}d quality life left`;
    confidence = 0.9;
  } else if (item.bestByDate) {
    expiryDays = daysBetween(item.bestByDate, today());
    const remaining = Math.max(0, expiryDays);
    reason = `Best-by ${formatShortDate(item.bestByDate)} · ${remaining}d left`;
    confidence = 0.85;
  } else {
    const daysSincePurchase = Math.max(0, -daysBetween(item.purchaseDate, today()));
    expiryDays = rules.sealed - daysSincePurchase;
    if (fromCategoryDefault) {
      reason = `Estimated from ${item.category} default`;
      confidence = 0.5;
    } else {
      reason = `Sealed ${item.category} · est. ${rules.sealed}d from purchase`;
      confidence = 0.7;
    }
  }

  const daysUntilQualityDecline = Math.max(0, expiryDays);
  const daysUntilDiscard = Math.max(0, expiryDays + 2);
  const maxLife = item.openedAt ? rules.opened : rules.sealed;
  const spoilageRiskScore = Math.min(100, Math.max(0, Math.round(100 - (daysUntilQualityDecline / maxLife) * 100)));
  const wasteValueScore = Math.round((item.purchasePrice / 15) * spoilageRiskScore); // normalize against ~$15 max

  let riskTier: RiskTier;
  if (daysUntilQualityDecline <= 1) riskTier = "use-today";
  else if (daysUntilQualityDecline <= 5) riskTier = "use-this-week";
  else riskTier = "safe";

  return {
    ...item,
    daysUntilQualityDecline,
    daysUntilDiscard,
    spoilageRiskScore,
    wasteValueScore: Math.min(100, wasteValueScore),
    riskTier,
    reason,
    confidence,
  };
}

export function computeAllItemRisks(items: InventoryItem[]): ItemWithRisk[] {
  return items.filter((i) => i.status === "active" || i.status === "frozen").map(computeItemRisk);
}
