import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { v4 as uuid } from "uuid";
import { ShoppingCart, CartItem } from "@/lib/types";

export async function GET() {
  return NextResponse.json(store.carts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const cart: ShoppingCart = {
    id: uuid(),
    name: body.name || `Cart ${store.carts.length + 1}`,
    items: (body.items || []).map((item: Partial<CartItem>) => ({
      id: uuid(),
      name: item.name || "",
      category: item.category || "other",
      quantity: item.quantity || "1",
      estimatedPrice: item.estimatedPrice || 0,
      fromRecipeId: item.fromRecipeId || null,
      checked: false,
    })),
    createdAt: new Date().toISOString(),
  };
  store.carts.push(cart);
  return NextResponse.json(cart, { status: 201 });
}
