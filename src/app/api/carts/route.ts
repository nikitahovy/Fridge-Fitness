import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/utils/supabase/api";
import { mapCartRow } from "@/utils/supabase/mappers";
import { cartCreateSchema } from "@/lib/validation";

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: carts } = await supabase
      .from("shopping_carts")
      .select("*, cart_items(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Transform to match frontend shape
    const transformed = (carts || []).map((cart) => ({
      id: cart.id,
      name: cart.name,
      createdAt: cart.created_at,
      items: (cart.cart_items || []).map((item: Record<string, unknown>) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        estimatedPrice: Number(item.estimated_price) || 0,
        fromRecipeId: item.from_recipe_id,
        checked: item.checked,
      })),
    }));

    return NextResponse.json(transformed);
  } catch {
    return NextResponse.json({ error: "Failed to fetch carts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabase, user } = await getAuthenticatedClient();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = cartCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const d = parsed.data;
    const { data: cart, error } = await supabase
      .from("shopping_carts")
      .insert({ user_id: user.id, name: d.name })
      .select()
      .single();

    if (error) throw error;

    // Insert cart items
    if (d.items.length > 0) {
      const items = d.items.map((item) => ({
        cart_id: cart.id,
        user_id: user.id,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        estimated_price: item.estimatedPrice,
        from_recipe_id: item.fromRecipeId,
      }));
      await supabase.from("cart_items").insert(items);
    }

    // Refetch with items
    const { data: fullCart } = await supabase
      .from("shopping_carts")
      .select("*, cart_items(*)")
      .eq("id", cart.id)
      .single();

    return NextResponse.json(mapCartRow(fullCart as Record<string, unknown>), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create cart" }, { status: 500 });
  }
}
