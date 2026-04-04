import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { v4 as uuid } from "uuid";
import { ShoppingCart } from "@/lib/types";
import { cartCreateSchema } from "@/lib/validation";

export async function GET() {
  return NextResponse.json(store.carts);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = cartCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const cart: ShoppingCart = {
      id: uuid(),
      name: data.name || `Cart ${store.carts.length + 1}`,
      items: data.items.map((item) => ({
        id: uuid(),
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        estimatedPrice: item.estimatedPrice,
        fromRecipeId: item.fromRecipeId,
        checked: false,
      })),
      createdAt: new Date().toISOString(),
    };
    store.carts.push(cart);
    return NextResponse.json(cart, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create cart" }, { status: 500 });
  }
}
