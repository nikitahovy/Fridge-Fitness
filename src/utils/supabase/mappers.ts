import { InventoryItem } from "@/lib/types";

/** Map a Supabase inventory_items row to the camelCase InventoryItem the frontend expects */
export function mapInventoryRow(row: Record<string, unknown>): InventoryItem {
  return {
    id: String(row.id),
    name: String(row.name),
    category: String(row.category || "other") as InventoryItem["category"],
    location: String(row.location || "fridge") as InventoryItem["location"],
    quantity: String(row.quantity || "1"),
    purchasePrice: Number(row.purchase_price) || 0,
    purchaseDate: String(row.purchase_date || new Date().toISOString().split("T")[0]),
    bestByDate: row.best_by_date ? String(row.best_by_date) : null,
    openedAt: row.opened_at ? String(row.opened_at) : null,
    status: String(row.status || "active") as InventoryItem["status"],
    nutritionTags: Array.isArray(row.nutrition_tags) ? row.nutrition_tags : [],
  };
}

/** Map a Supabase cart + cart_items to the shape the frontend expects */
export function mapCartRow(cart: Record<string, unknown>) {
  const cartItems = Array.isArray(cart.cart_items) ? cart.cart_items : [];
  return {
    id: cart.id,
    name: cart.name,
    createdAt: cart.created_at,
    items: cartItems.map((item: Record<string, unknown>) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      estimatedPrice: Number(item.estimated_price) || 0,
      fromRecipeId: item.from_recipe_id,
      checked: item.checked,
    })),
  };
}
