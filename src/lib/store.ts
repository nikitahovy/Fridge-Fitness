import { InventoryItem, Recipe, UploadSession, RecoveryPreset, DailyRecoveryContext, ShoppingCart } from "./types";
import { createSeedInventory, createSeedRecipes, recoveryPresets } from "./seed-data";

type Store = {
  inventory: InventoryItem[];
  recipes: Recipe[];
  sessions: UploadSession[];
  currentRecoveryPreset: RecoveryPreset;
  carts: ShoppingCart[];
  wastedValue: number;
  savedValue: number;
};

function initializeStore(): Store {
  return {
    inventory: createSeedInventory(),
    recipes: createSeedRecipes(),
    sessions: [],
    currentRecoveryPreset: "post-strength",
    carts: [],
    wastedValue: 0,
    savedValue: 0,
  };
}

// Survive HMR in development
const g = globalThis as unknown as { __fridgeFitnessStore?: Store };
if (!g.__fridgeFitnessStore) {
  g.__fridgeFitnessStore = initializeStore();
}

export const store = g.__fridgeFitnessStore;

export function getRecoveryContext(): DailyRecoveryContext {
  return recoveryPresets[store.currentRecoveryPreset];
}

export function setRecoveryPreset(preset: RecoveryPreset) {
  store.currentRecoveryPreset = preset;
}
