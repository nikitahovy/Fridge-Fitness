import { z } from "zod";
import { sanitizeString } from "./sanitize";

const safeString = (max = 200) =>
  z.string().min(1, "Required").max(max).transform((s) => sanitizeString(s, max));

const optionalSafeString = (max = 200) =>
  z.string().max(max).transform((s) => sanitizeString(s, max)).optional().or(z.literal(""));

const isoDateOrNull = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD")
  .nullable()
  .optional()
  .default(null);

const foodCategory = z.enum([
  "protein", "dairy", "produce", "grain", "snack",
  "beverage", "condiment", "frozen", "other",
]);

const storageLocation = z.enum(["fridge", "freezer", "pantry"]);

const itemStatus = z.enum(["active", "consumed", "discarded", "frozen"]);

// ── Inventory ──

export const inventoryCreateSchema = z.object({
  name: safeString(200),
  category: foodCategory.default("other"),
  location: storageLocation.default("fridge"),
  quantity: safeString(100).default("1"),
  purchasePrice: z.number().min(0).max(10000).default(0),
  purchaseDate: isoDateOrNull,
  bestByDate: isoDateOrNull,
  openedAt: isoDateOrNull,
  nutritionTags: z.array(z.string().max(50)).max(20).default([]),
});

export const inventoryPatchSchema = z.object({
  id: z.string().uuid("Invalid item ID"),
  name: safeString(200).optional(),
  status: itemStatus.optional(),
  location: storageLocation.optional(),
  quantity: safeString(100).optional(),
  purchasePrice: z.number().min(0).max(10000).optional(),
  bestByDate: isoDateOrNull,
  openedAt: isoDateOrNull,
});

// ── Carts ──

export const cartItemInputSchema = z.object({
  name: safeString(200).default(""),
  category: foodCategory.default("other"),
  quantity: safeString(100).default("1"),
  estimatedPrice: z.number().min(0).max(10000).default(0),
  fromRecipeId: z.string().max(100).nullable().default(null),
});

export const cartCreateSchema = z.object({
  name: safeString(100).default("New Cart"),
  items: z.array(cartItemInputSchema).max(50).default([]),
});

export const cartPatchSchema = z.object({
  toggleItemId: z.string().uuid().optional(),
  addItem: cartItemInputSchema.optional(),
  removeItemId: z.string().uuid().optional(),
  name: safeString(100).optional(),
}).refine(
  (data) => data.toggleItemId || data.addItem || data.removeItemId || data.name,
  { message: "At least one operation required" }
);

// ── Profile ──

export const profilePatchSchema = z.object({
  displayName: safeString(100).optional(),
  householdSize: z.number().int().min(1).max(20).optional(),
  fitnessGoal: z.enum(["maintenance", "muscle-gain", "fat-loss", "endurance"]).optional(),
  dietaryPreferences: z.array(z.string().max(50).transform((s) => sanitizeString(s, 50))).max(20).optional(),
});

// ── Recovery ──

export const recoveryPresetSchema = z.object({
  preset: z.enum(["post-strength", "low-recovery", "cardio-day"]),
});

// ── Sessions ──

export const uuidParamSchema = z.string().uuid("Invalid session ID");

// ── Upload ──

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function validateUploadedFile(file: File): { ok: true } | { ok: false; error: string } {
  if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
    return { ok: false, error: `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP` };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { ok: false, error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 5MB` };
  }
  return { ok: true };
}
