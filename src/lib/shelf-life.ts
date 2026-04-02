import { InventoryItem, ItemWithRisk, RiskTier } from "./types";
import { daysBetween, today } from "./utils";

// Days of shelf life: sealed in fridge, after opening, frozen
const SHELF_LIFE_RULES: Record<string, { sealed: number; opened: number; frozen: number }> = {
  "chicken breast": { sealed: 3, opened: 2, frozen: 180 },
  "baby spinach": { sealed: 5, opened: 3, frozen: 120 },
  "strawberries": { sealed: 5, opened: 3, frozen: 180 },
  "greek yogurt": { sealed: 14, opened: 5, frozen: 60 },
  "eggs": { sealed: 28, opened: 28, frozen: 0 },
  "whole milk": { sealed: 10, opened: 5, frozen: 0 },
  "bell peppers": { sealed: 7, opened: 5, frozen: 120 },
  "salmon fillet": { sealed: 3, opened: 1, frozen: 180 },
  "hummus": { sealed: 21, opened: 7, frozen: 0 },
  "cheddar cheese": { sealed: 28, opened: 14, frozen: 120 },
  "brown rice": { sealed: 365, opened: 180, frozen: 365 },
  "pasta": { sealed: 730, opened: 365, frozen: 365 },
  "canned black beans": { sealed: 730, opened: 3, frozen: 0 },
  "olive oil": { sealed: 730, opened: 365, frozen: 0 },
  "oats": { sealed: 365, opened: 180, frozen: 365 },
  "ground turkey": { sealed: 3, opened: 2, frozen: 180 },
  "frozen blueberries": { sealed: 365, opened: 180, frozen: 365 },
  "frozen broccoli": { sealed: 365, opened: 180, frozen: 365 },
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

export function computeItemRisk(item: InventoryItem): ItemWithRisk {
  const normalized = item.name.toLowerCase();
  const rules = SHELF_LIFE_RULES[normalized] || CATEGORY_DEFAULTS[item.category] || CATEGORY_DEFAULTS.other;

  if (item.status === "frozen" || item.location === "freezer") {
    return {
      ...item,
      daysUntilQualityDecline: rules.frozen > 0 ? rules.frozen : 999,
      daysUntilDiscard: rules.frozen > 0 ? rules.frozen + 30 : 999,
      spoilageRiskScore: 0,
      wasteValueScore: 0,
      riskTier: "frozen",
    };
  }

  let expiryDays: number;

  if (item.openedAt) {
    // Use opened shelf life from the opened date
    const daysSinceOpened = -daysBetween(item.openedAt, today());
    expiryDays = rules.opened - daysSinceOpened;
  } else if (item.bestByDate) {
    expiryDays = daysBetween(item.bestByDate, today());
  } else {
    // Estimate from purchase date
    const daysSincePurchase = -daysBetween(item.purchaseDate, today());
    expiryDays = rules.sealed - daysSincePurchase;
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
  };
}

export function computeAllItemRisks(items: InventoryItem[]): ItemWithRisk[] {
  return items.filter((i) => i.status === "active" || i.status === "frozen").map(computeItemRisk);
}
