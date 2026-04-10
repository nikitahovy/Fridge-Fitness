export type FoodCategory =
  | "protein"
  | "dairy"
  | "produce"
  | "grain"
  | "snack"
  | "beverage"
  | "condiment"
  | "frozen"
  | "other";

export type StorageLocation = "fridge" | "freezer" | "pantry";

export type ItemStatus = "active" | "consumed" | "discarded" | "frozen";

export type RiskTier = "use-today" | "use-this-week" | "safe" | "frozen";

export type InventoryItem = {
  id: string;
  name: string;
  category: FoodCategory;
  location: StorageLocation;
  quantity: string;
  purchasePrice: number;
  purchaseDate: string;
  bestByDate: string | null;
  openedAt: string | null;
  status: ItemStatus;
  nutritionTags: string[];
};

export type ItemWithRisk = InventoryItem & {
  daysUntilQualityDecline: number;
  daysUntilDiscard: number;
  spoilageRiskScore: number;
  wasteValueScore: number;
  riskTier: RiskTier;
  reason: string;
  confidence: number;
};

export type DailyRecoveryContext = {
  recoveryScore: number;
  sleepPerformancePct: number;
  totalSleepHours: number;
  hrv: number;
  restingHeartRate: number;
  inferredDayType: "strength" | "cardio" | "rest" | "mixed";
  readinessBand: "low" | "moderate" | "high";
  strainYesterday: number;
};

export type RecipeIngredient = {
  name: string;
  normalizedName: string;
  amount: string;
  optional: boolean;
};

export type Recipe = {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  cookTimeMinutes: number;
  difficulty: "easy" | "medium" | "hard";
  macros: { protein: number; carbs: number; fat: number; fiber: number };
  tags: string[];
  steps: string[];
};

export type ScoredRecipe = {
  recipe: Recipe;
  matchedItems: ItemWithRisk[];
  atRiskItemsRescued: ItemWithRisk[];
  missingIngredients: RecipeIngredient[];
  wasteRescueValue: number;
  score: number;
  explanation: string[];
};

export type UploadSession = {
  id: string;
  status: "pending" | "uploaded" | "expired";
  createdAt: string;
  imageUrl: string | null;
};

export type RecoveryPreset = "post-strength" | "low-recovery" | "cardio-day";

export type CartItem = {
  id: string;
  name: string;
  category: FoodCategory;
  quantity: string;
  estimatedPrice: number;
  fromRecipeId: string | null;
  checked: boolean;
};

export type ShoppingCart = {
  id: string;
  name: string;
  items: CartItem[];
  createdAt: string;
};
