import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/utils/supabase/api";
import { cartPatchSchema, uuidParamSchema } from "@/lib/validation";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ cartId: string }> }
) {
  try {
    const { cartId } = await params;
    if (!uuidParamSchema.safeParse(cartId).success) return NextResponse.json({ error: "Invalid cart ID" }, { status: 400 });

    const { supabase, user } = await getAuthenticatedClient();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data } = await supabase
      .from("shopping_carts")
      .select("*, cart_items(*)")
      .eq("id", cartId)
      .eq("user_id", user.id)
      .single();

    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(data);
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
    if (!uuidParamSchema.safeParse(cartId).success) return NextResponse.json({ error: "Invalid cart ID" }, { status: 400 });

    const { supabase, user } = await getAuthenticatedClient();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = cartPatchSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    const d = parsed.data;

    if (d.toggleItemId) {
      const { data: item } = await supabase.from("cart_items").select("checked").eq("id", d.toggleItemId).eq("user_id", user.id).single();
      if (item) {
        await supabase.from("cart_items").update({ checked: !item.checked }).eq("id", d.toggleItemId);
      }
    }

    if (d.addItem) {
      await supabase.from("cart_items").insert({
        cart_id: cartId,
        user_id: user.id,
        name: d.addItem.name,
        category: d.addItem.category,
        quantity: d.addItem.quantity,
        estimated_price: d.addItem.estimatedPrice,
        from_recipe_id: d.addItem.fromRecipeId,
      });
    }

    if (d.removeItemId) {
      await supabase.from("cart_items").delete().eq("id", d.removeItemId).eq("user_id", user.id);
    }

    if (d.name) {
      await supabase.from("shopping_carts").update({ name: d.name }).eq("id", cartId).eq("user_id", user.id);
    }

    // Refetch
    const { data } = await supabase
      .from("shopping_carts")
      .select("*, cart_items(*)")
      .eq("id", cartId)
      .eq("user_id", user.id)
      .single();

    return NextResponse.json(data);
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
    if (!uuidParamSchema.safeParse(cartId).success) return NextResponse.json({ error: "Invalid cart ID" }, { status: 400 });

    const { supabase, user } = await getAuthenticatedClient();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await supabase.from("shopping_carts").delete().eq("id", cartId).eq("user_id", user.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete cart" }, { status: 500 });
  }
}
