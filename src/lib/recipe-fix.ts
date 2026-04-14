/**
 * Post-processing for AI-generated recipes.
 * Fixes common LLM issues: phantom ingredients in steps, brand names, etc.
 */

type Ingredient = {
  name: string;
  normalizedName: string;
  amount: string;
  optional: boolean;
};

/** Common cooking ingredients the LLM mentions in steps but forgets to list */
const PHANTOM_INGREDIENTS: Record<string, { name: string; amount: string }> = {
  flour: { name: "All-Purpose Flour", amount: "1 cup" },
  "all-purpose flour": { name: "All-Purpose Flour", amount: "1 cup" },
  "wheat flour": { name: "Wheat Flour", amount: "1 cup" },
  salt: { name: "Salt", amount: "to taste" },
  pepper: { name: "Black Pepper", amount: "to taste" },
  "black pepper": { name: "Black Pepper", amount: "to taste" },
  oil: { name: "Cooking Oil", amount: "2 tbsp" },
  "olive oil": { name: "Olive Oil", amount: "2 tbsp" },
  "vegetable oil": { name: "Vegetable Oil", amount: "2 tbsp" },
  butter: { name: "Butter", amount: "1 tbsp" },
  sugar: { name: "Sugar", amount: "1 tbsp" },
  honey: { name: "Honey", amount: "1 tbsp" },
  garlic: { name: "Garlic", amount: "2 cloves" },
  onion: { name: "Onion", amount: "1 small" },
  "soy sauce": { name: "Soy Sauce", amount: "2 tbsp" },
  vinegar: { name: "Vinegar", amount: "1 tbsp" },
  "baking powder": { name: "Baking Powder", amount: "1 tsp" },
  "baking soda": { name: "Baking Soda", amount: "1/2 tsp" },
  cinnamon: { name: "Cinnamon", amount: "1/2 tsp" },
  vanilla: { name: "Vanilla Extract", amount: "1 tsp" },
  water: { name: "Water", amount: "as needed" },
  milk: { name: "Milk", amount: "1/2 cup" },
  cream: { name: "Heavy Cream", amount: "1/4 cup" },
  "lemon juice": { name: "Lemon Juice", amount: "1 tbsp" },
  "lime juice": { name: "Lime Juice", amount: "1 tbsp" },
  cumin: { name: "Cumin", amount: "1/2 tsp" },
  paprika: { name: "Paprika", amount: "1/2 tsp" },
  "chili powder": { name: "Chili Powder", amount: "1/2 tsp" },
};

/** Brand names to strip from recipe names and ingredient names */
const BRAND_PATTERNS = [
  /kirkland\s*(signature)?\s*/gi,
  /great\s*value\s*/gi,
  /trader\s*joe'?s?\s*/gi,
  /whole\s*foods\s*/gi,
  /costco\s*/gi,
  /walmart\s*/gi,
  /kroger\s*/gi,
  /target\s*/gi,
  /aldi\s*/gi,
  /365\s*(everyday\s*value)?\s*/gi,
];

function stripBrands(text: string): string {
  let result = text;
  for (const pattern of BRAND_PATTERNS) {
    result = result.replace(pattern, "");
  }
  return result.replace(/\s{2,}/g, " ").trim();
}

/**
 * Scan steps for ingredient references not in the ingredients list.
 * Auto-add any missing common ingredients.
 */
export function fixRecipeConsistency(
  ingredients: Ingredient[],
  steps: string[],
  recipeName: string
): { ingredients: Ingredient[]; steps: string[]; name: string } {
  const fixedIngredients = [...ingredients];
  const existingNames = new Set(
    fixedIngredients.map((i) => i.normalizedName.toLowerCase())
  );

  // Also index individual words from ingredient names for fuzzy matching
  const existingWords = new Set<string>();
  for (const name of existingNames) {
    for (const word of name.split(/\s+/)) {
      if (word.length > 2) existingWords.add(word);
    }
  }

  const allStepsText = steps.join(" ").toLowerCase();

  // Check each phantom ingredient
  for (const [keyword, info] of Object.entries(PHANTOM_INGREDIENTS)) {
    // Check if this ingredient is mentioned in the steps
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (!regex.test(allStepsText)) continue;

    // Check if it's already in the ingredients (exact or fuzzy)
    const keyWords = keyword.split(/\s+/);
    const alreadyListed = existingNames.has(keyword) ||
      keyWords.some((w) => w.length > 3 && existingWords.has(w));

    if (!alreadyListed) {
      fixedIngredients.push({
        name: info.name,
        normalizedName: info.name.toLowerCase(),
        amount: info.amount,
        optional: false,
      });
      existingNames.add(info.name.toLowerCase());
      for (const w of info.name.toLowerCase().split(/\s+/)) {
        existingWords.add(w);
      }
    }
  }

  // Strip brand names from recipe name and ingredient names
  const fixedName = stripBrands(recipeName);
  const fixedIngs = fixedIngredients.map((ing) => ({
    ...ing,
    name: stripBrands(ing.name),
    normalizedName: stripBrands(ing.normalizedName).toLowerCase(),
  }));

  return { ingredients: fixedIngs, steps, name: fixedName };
}
