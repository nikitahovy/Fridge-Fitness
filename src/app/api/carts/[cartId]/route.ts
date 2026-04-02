import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { v4 as uuid } from "uuid";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ cartId: string }> }
) {
  const { cartId } = await params;
  const cart = store.carts.find((c) => c.id === cartId);
  if (!cart) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(cart);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ cartId: string }> }
) {
  const { cartId } = await params;
  const cart = store.carts.find((c) => c.id === cartId);
  if (!cart) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();

  // Toggle item checked
  if (body.toggleItemId) {
    const item = cart.items.find((i) => i.id === body.toggleItemId);
    if (item) item.checked = !item.checked;
  }

  // Add item
  if (body.addItem) {
    cart.items.push({
      id: uuid(),
      name: body.addItem.name,
      category: body.addItem.category || "other",
      quantity: body.addItem.quantity || "1",
      estimatedPrice: body.addItem.estimatedPrice || 0,
      fromRecipeId: body.addItem.fromRecipeId || null,
      checked: false,
    });
  }

  // Remove item
  if (body.removeItemId) {
    cart.items = cart.items.filter((i) => i.id !== body.removeItemId);
  }

  // Rename cart
  if (body.name) {
    cart.name = body.name;
  }

  return NextResponse.json(cart);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ cartId: string }> }
) {
  const { cartId } = await params;
  const idx = store.carts.findIndex((c) => c.id === cartId);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  store.carts.splice(idx, 1);
  return NextResponse.json({ success: true });
}
