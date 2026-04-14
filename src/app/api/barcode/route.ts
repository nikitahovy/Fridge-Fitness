import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getRateLimitId } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const limited = checkRateLimit(getRateLimitId(req), "barcode");
    if (limited) return limited;

    const barcode = req.nextUrl.searchParams.get("code");
    if (!barcode || !/^\d{4,14}$/.test(barcode)) {
      return NextResponse.json({ error: "Invalid barcode" }, { status: 400 });
    }

    // Open Food Facts — free, no API key needed
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
      headers: { "User-Agent": "FridgeFitness/1.0" },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const data = await res.json();

    if (data.status !== 1 || !data.product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const p = data.product;

    // Map Open Food Facts categories to our categories
    const categories = (p.categories_tags || []).join(" ").toLowerCase();
    let category = "other";
    if (categories.includes("meat") || categories.includes("fish") || categories.includes("egg")) category = "protein";
    else if (categories.includes("dairy") || categories.includes("milk") || categories.includes("cheese") || categories.includes("yogurt")) category = "dairy";
    else if (categories.includes("fruit") || categories.includes("vegetable") || categories.includes("produce")) category = "produce";
    else if (categories.includes("grain") || categories.includes("bread") || categories.includes("cereal") || categories.includes("pasta")) category = "grain";
    else if (categories.includes("snack") || categories.includes("chip") || categories.includes("cookie")) category = "snack";
    else if (categories.includes("beverage") || categories.includes("drink") || categories.includes("juice") || categories.includes("water")) category = "beverage";
    else if (categories.includes("sauce") || categories.includes("condiment") || categories.includes("oil")) category = "condiment";
    else if (categories.includes("frozen")) category = "frozen";

    return NextResponse.json({
      name: p.product_name || p.product_name_en || "Unknown Product",
      brand: p.brands || "",
      category,
      quantity: p.quantity || "1",
      imageUrl: p.image_front_small_url || null,
      nutriments: {
        protein: p.nutriments?.proteins_100g || 0,
        carbs: p.nutriments?.carbohydrates_100g || 0,
        fat: p.nutriments?.fat_100g || 0,
        fiber: p.nutriments?.fiber_100g || 0,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to lookup barcode" }, { status: 500 });
  }
}
