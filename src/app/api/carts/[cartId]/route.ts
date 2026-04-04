import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { v4 as uuid } from "uuid";
import { cartPatchSchema, uuidParamSchema } from "@/lib/validation";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ cartId: string }> }
) {
  try {
    const { cartId } = await params;
    if (!uuidParamSchema.safeParse(cartId).success) {
      return NextResponse.json({ error: "Invalid cart ID" }, { status: 400 });
    }
    const cart = store.carts.find((c) => c.id === cartId);
    if (!cart) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(cart);
  } catch {
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ cartId: string }> }
) {
  try {
    const { cartId } = await params;
    if (!uuidParamSchema.safeParse(cartId).success) {
      return NextResponse.json({ error: "Invalid cart ID" }, { status: 400 });
    }

    const cart = store.carts.find((c) => c.id === cartId);
    if (!cart) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const parsed = cartPatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.toggleItemId) {
      const item = cart.items.find((i) => i.id === data.toggleItemId);
      if (item) item.checked = !item.checked;
    }

    if (data.addItem) {
      if (cart.items.length >= 100) {
        return NextResponse.json({ error: "Cart item limit reached (100)" }, { status: 400 });
      }
      cart.items.push({
        id: uuid(),
        name: data.addItem.name,
        category: data.addItem.category,
        quantity: data.addItem.quantity,
        estimatedPrice: data.addItem.estimatedPrice,
        fromRecipeId: data.addItem.fromRecipeId,
        checked: false,
      });
    }

    if (data.removeItemId) {
      cart.items = cart.items.filter((i) => i.id !== data.removeItemId);
    }

    if (data.name) {
      cart.name = data.name;
    }

    return NextResponse.json(cart);
  } catch {
    return NextResponse.json({ error: "Failed to update cart" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ cartId: string }> }
) {
  try {
    const { cartId } = await params;
    if (!uuidParamSchema.safeParse(cartId).success) {
      return NextResponse.json({ error: "Invalid cart ID" }, { status: 400 });
    }
    const idx = store.carts.findIndex((c) => c.id === cartId);
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    store.carts.splice(idx, 1);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete cart" }, { status: 500 });
  }
}
