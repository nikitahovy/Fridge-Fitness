import { NextRequest, NextResponse } from "next/server";

// ── FOOD ADDITIVE RISKS ──
const FOOD_ADDITIVE_RISKS: Record<string, { risk: "high" | "moderate" | "low" | "safe"; name: string; concern: string }> = {
  "e950": { risk: "moderate", name: "Acesulfame K", concern: "Artificial sweetener, possible insulin disruption" },
  "e951": { risk: "moderate", name: "Aspartame", concern: "Artificial sweetener, linked to headaches and neurological concerns" },
  "e955": { risk: "moderate", name: "Sucralose", concern: "Artificial sweetener, may affect gut bacteria" },
  "e621": { risk: "moderate", name: "MSG", concern: "Flavor enhancer, can cause headaches in sensitive individuals" },
  "e250": { risk: "high", name: "Sodium Nitrite", concern: "Preservative in processed meat, forms carcinogenic nitrosamines" },
  "e251": { risk: "high", name: "Sodium Nitrate", concern: "Converts to nitrite in body, linked to colorectal cancer" },
  "e320": { risk: "high", name: "BHA", concern: "Antioxidant preservative, possible carcinogen and endocrine disruptor" },
  "e321": { risk: "high", name: "BHT", concern: "Preservative, potential endocrine disruptor and tumor promoter" },
  "e171": { risk: "high", name: "Titanium Dioxide", concern: "Whitening agent, nanoparticles may damage DNA. Banned in EU food" },
  "e102": { risk: "high", name: "Tartrazine", concern: "Yellow dye, linked to hyperactivity in children and allergic reactions" },
  "e110": { risk: "high", name: "Sunset Yellow", concern: "Orange dye, linked to hyperactivity and may contain carcinogenic contaminants" },
  "e122": { risk: "moderate", name: "Carmoisine", concern: "Red dye, may cause allergic reactions and hyperactivity" },
  "e124": { risk: "high", name: "Ponceau 4R", concern: "Red dye, banned in US, linked to hyperactivity and allergies" },
  "e129": { risk: "high", name: "Allura Red", concern: "Red dye, linked to hyperactivity in children and DNA damage" },
  "e211": { risk: "high", name: "Sodium Benzoate", concern: "Preservative, forms carcinogenic benzene when combined with vitamin C" },
  "e220": { risk: "moderate", name: "Sulfur Dioxide", concern: "Preservative, triggers asthma and allergic reactions" },
  "e407": { risk: "moderate", name: "Carrageenan", concern: "Thickener from seaweed, may cause gut inflammation" },
  "e450": { risk: "low", name: "Diphosphates", concern: "Emulsifier, excessive intake may affect calcium absorption" },
  "e471": { risk: "safe", name: "Mono/Diglycerides", concern: "Emulsifier from fats, generally well tolerated" },
  "e322": { risk: "safe", name: "Lecithin", concern: "Natural emulsifier from soy/eggs, safe" },
  "e330": { risk: "safe", name: "Citric Acid", concern: "Natural acid found in citrus fruits, safe" },
  "e300": { risk: "safe", name: "Ascorbic Acid", concern: "Vitamin C, antioxidant, safe" },
  "e306": { risk: "safe", name: "Tocopherols", concern: "Vitamin E, natural antioxidant, safe" },
  "e412": { risk: "safe", name: "Guar Gum", concern: "Natural thickener from beans, safe" },
  "e415": { risk: "safe", name: "Xanthan Gum", concern: "Natural thickener, safe" },
  "e440": { risk: "safe", name: "Pectin", concern: "Natural gelling agent from fruit, safe" },
  "e500": { risk: "safe", name: "Sodium Carbonates", concern: "Baking soda, safe" },
  "e503": { risk: "safe", name: "Ammonium Carbonates", concern: "Leavening agent, safe" },
  "e150a": { risk: "safe", name: "Caramel Color I", concern: "Simple caramel, safe" },
  "e150d": { risk: "moderate", name: "Caramel Color IV", concern: "Contains 4-MEI, a possible carcinogen at high doses" },
  "e338": { risk: "moderate", name: "Phosphoric Acid", concern: "Acidifier in sodas, may weaken bones with excess consumption" },
  "e339": { risk: "low", name: "Sodium Phosphates", concern: "Emulsifier, excess may affect kidney function" },
  "e341": { risk: "low", name: "Calcium Phosphates", concern: "Mineral supplement, generally safe" },
  "e420": { risk: "low", name: "Sorbitol", concern: "Sugar alcohol, may cause digestive issues in excess" },
  "e422": { risk: "safe", name: "Glycerol", concern: "Moistener, naturally occurring, safe" },
  "e460": { risk: "safe", name: "Cellulose", concern: "Plant fiber, safe" },
  "e472e": { risk: "safe", name: "DATEM", concern: "Dough conditioner, generally safe" },
  "e476": { risk: "low", name: "Polyglycerol Polyricinoleate", concern: "Emulsifier, well tolerated in normal amounts" },
  "e481": { risk: "low", name: "Sodium Stearoyl Lactylate", concern: "Dough strengthener, generally safe" },
  "e551": { risk: "safe", name: "Silicon Dioxide", concern: "Anti-caking agent, passes through body unabsorbed" },
  "e635": { risk: "low", name: "Disodium Ribonucleotides", concern: "Flavor enhancer often paired with MSG, generally safe" },
  "e901": { risk: "safe", name: "Beeswax", concern: "Natural glazing agent, safe" },
  "e903": { risk: "safe", name: "Carnauba Wax", concern: "Natural plant wax coating, safe" },
  // ── Preservatives common in energy drinks & beverages ──
  "e200": { risk: "safe", name: "Sorbic Acid", concern: "Natural preservative, safe in normal amounts" },
  "e201": { risk: "low", name: "Sodium Sorbate", concern: "Preservative, may cause mild skin irritation in rare cases" },
  "e202": { risk: "safe", name: "Potassium Sorbate", concern: "Common preservative, safe — one of the least harmful preservatives used" },
  "e203": { risk: "low", name: "Calcium Sorbate", concern: "Preservative, generally safe" },
  "e210": { risk: "moderate", name: "Benzoic Acid", concern: "Preservative, may form benzene with vitamin C. Can trigger asthma" },
  "e212": { risk: "moderate", name: "Potassium Benzoate", concern: "Preservative, same benzene risk as sodium benzoate with vitamin C" },
  "e213": { risk: "moderate", name: "Calcium Benzoate", concern: "Preservative, may form benzene in acidic conditions" },
  "e214": { risk: "moderate", name: "Ethylparaben", concern: "Preservative, potential endocrine disruptor" },
  "e215": { risk: "moderate", name: "Sodium Ethyl Para-hydroxybenzoate", concern: "Paraben preservative, endocrine disruption concern" },
  "e216": { risk: "high", name: "Propylparaben", concern: "Preservative banned in food in EU, endocrine disruptor" },
  "e218": { risk: "high", name: "Methylparaben", concern: "Preservative, endocrine disruptor, estrogenic activity" },
  "e219": { risk: "high", name: "Sodium Methyl Para-hydroxybenzoate", concern: "Paraben derivative, endocrine disruption" },
  "e221": { risk: "moderate", name: "Sodium Sulfite", concern: "Preservative, can trigger asthma attacks" },
  "e222": { risk: "moderate", name: "Sodium Bisulfite", concern: "Preservative, allergenic for sulfite-sensitive individuals" },
  "e223": { risk: "moderate", name: "Sodium Metabisulfite", concern: "Preservative, destroys vitamin B1, triggers asthma" },
  "e224": { risk: "moderate", name: "Potassium Metabisulfite", concern: "Preservative, same sulfite allergy risks" },
  "e226": { risk: "moderate", name: "Calcium Sulfite", concern: "Preservative, sulfite allergy trigger" },
  "e228": { risk: "moderate", name: "Potassium Bisulfite", concern: "Preservative, allergenic" },
  "e230": { risk: "high", name: "Biphenyl", concern: "Fungicide on citrus peels, possible carcinogen. Banned in EU" },
  "e231": { risk: "high", name: "Orthophenyl Phenol", concern: "Fungicide, irritant, possible carcinogen" },
  "e232": { risk: "high", name: "Sodium Orthophenyl Phenol", concern: "Fungicide, toxic to aquatic life" },
  "e233": { risk: "high", name: "Thiabendazole", concern: "Fungicide, potential liver and thyroid toxicity" },
  "e234": { risk: "low", name: "Nisin", concern: "Natural antimicrobial from bacteria, generally safe" },
  "e235": { risk: "moderate", name: "Natamycin", concern: "Antifungal, may contribute to antibiotic resistance" },
  "e236": { risk: "moderate", name: "Formic Acid", concern: "Preservative, irritant at high concentrations. Limited use in food" },
  "e237": { risk: "moderate", name: "Sodium Formate", concern: "Preservative, limited safety data for food use" },
  "e238": { risk: "moderate", name: "Calcium Formate", concern: "Preservative, limited safety data" },
  "e239": { risk: "high", name: "Hexamethylenetetramine", concern: "Preservative that releases formaldehyde. Banned in many countries" },
  "e240": { risk: "high", name: "Formaldehyde", concern: "Known carcinogen. Banned in food in most countries" },
  "e242": { risk: "moderate", name: "Dimethyl Dicarbonate", concern: "Beverage preservative, decomposes to methanol in small amounts" },
  "e249": { risk: "high", name: "Potassium Nitrite", concern: "Preservative, forms carcinogenic nitrosamines" },
  // ── Acids & regulators in energy drinks ──
  "e260": { risk: "safe", name: "Acetic Acid", concern: "Vinegar, safe" },
  "e270": { risk: "safe", name: "Lactic Acid", concern: "Naturally occurring acid, safe" },
  "e290": { risk: "safe", name: "Carbon Dioxide", concern: "Carbonation, safe" },
  "e296": { risk: "safe", name: "Malic Acid", concern: "Natural fruit acid, safe" },
  "e297": { risk: "safe", name: "Fumaric Acid", concern: "Naturally occurring acid, safe" },
  "e301": { risk: "safe", name: "Sodium Ascorbate", concern: "Vitamin C salt, antioxidant, safe" },
  "e302": { risk: "safe", name: "Calcium Ascorbate", concern: "Vitamin C with calcium, safe" },
  "e304": { risk: "safe", name: "Ascorbyl Palmitate", concern: "Fat-soluble vitamin C, antioxidant, safe" },
  "e307": { risk: "safe", name: "Alpha-Tocopherol", concern: "Vitamin E, antioxidant, safe" },
  "e308": { risk: "safe", name: "Gamma-Tocopherol", concern: "Vitamin E form, safe" },
  "e309": { risk: "safe", name: "Delta-Tocopherol", concern: "Vitamin E form, safe" },
  "e310": { risk: "moderate", name: "Propyl Gallate", concern: "Antioxidant, may cause skin rashes and stomach issues" },
  "e315": { risk: "safe", name: "Erythorbic Acid", concern: "Antioxidant similar to vitamin C, safe" },
  "e316": { risk: "safe", name: "Sodium Erythorbate", concern: "Antioxidant, safe" },
  "e319": { risk: "moderate", name: "TBHQ", concern: "Synthetic antioxidant, may cause nausea. Possible tumor growth at high doses" },
  "e325": { risk: "safe", name: "Sodium Lactate", concern: "Moisturizer and preservative, safe" },
  "e326": { risk: "safe", name: "Potassium Lactate", concern: "Preservative and acidity regulator, safe" },
  "e327": { risk: "safe", name: "Calcium Lactate", concern: "Calcium supplement and firming agent, safe" },
  "e331": { risk: "safe", name: "Sodium Citrate", concern: "Acidity regulator and emulsifier, safe" },
  "e332": { risk: "safe", name: "Potassium Citrate", concern: "Acidity regulator, safe" },
  "e333": { risk: "safe", name: "Calcium Citrate", concern: "Calcium supplement, safe" },
  "e334": { risk: "safe", name: "Tartaric Acid", concern: "Natural acid from grapes, safe" },
  "e335": { risk: "safe", name: "Sodium Tartrate", concern: "Salt of tartaric acid, safe" },
  "e336": { risk: "safe", name: "Potassium Tartrate", concern: "Cream of tartar, safe" },
  "e337": { risk: "safe", name: "Sodium Potassium Tartrate", concern: "Rochelle salt, safe" },
  "e340": { risk: "low", name: "Potassium Phosphates", concern: "Emulsifier, excess may strain kidneys" },
  // ── Sweeteners in energy drinks ──
  "e952": { risk: "moderate", name: "Cyclamate", concern: "Artificial sweetener, banned in US. Possible bladder cancer link" },
  "e953": { risk: "safe", name: "Isomalt", concern: "Sugar alcohol, may cause digestive issues in large amounts" },
  "e954": { risk: "moderate", name: "Saccharin", concern: "Oldest artificial sweetener, controversial cancer studies" },
  "e956": { risk: "safe", name: "Alitame", concern: "Artificial sweetener, generally considered safe" },
  "e957": { risk: "low", name: "Thaumatin", concern: "Natural protein sweetener, safe" },
  "e960": { risk: "safe", name: "Steviol Glycosides", concern: "Stevia extract, natural sweetener, safe" },
  "e961": { risk: "safe", name: "Neotame", concern: "Artificial sweetener, FDA approved, safe in normal amounts" },
  "e962": { risk: "moderate", name: "Aspartame-Acesulfame Salt", concern: "Combination sweetener, same concerns as both components" },
  "e965": { risk: "low", name: "Maltitol", concern: "Sugar alcohol, laxative effect in excess" },
  "e966": { risk: "low", name: "Lactitol", concern: "Sugar alcohol, laxative effect" },
  "e967": { risk: "low", name: "Xylitol", concern: "Sugar alcohol, safe for humans but toxic to dogs" },
  "e968": { risk: "safe", name: "Erythritol", concern: "Sugar alcohol, well tolerated, minimal digestive effects" },
  // ── Colors in energy drinks ──
  "e100": { risk: "safe", name: "Curcumin", concern: "Turmeric extract, natural yellow color, anti-inflammatory" },
  "e101": { risk: "safe", name: "Riboflavin", concern: "Vitamin B2, yellow color, safe" },
  "e104": { risk: "high", name: "Quinoline Yellow", concern: "Synthetic dye, linked to hyperactivity. Banned in some countries" },
  "e120": { risk: "low", name: "Cochineal / Carmine", concern: "Natural red from insects, allergenic for some" },
  "e131": { risk: "high", name: "Patent Blue V", concern: "Synthetic blue dye, allergenic, limited safety data" },
  "e132": { risk: "low", name: "Indigo Carmine", concern: "Blue dye, may cause nausea and skin rashes in sensitive people" },
  "e133": { risk: "low", name: "Brilliant Blue", concern: "Blue dye (common in energy drinks), poorly absorbed but may cross blood-brain barrier" },
  "e140": { risk: "safe", name: "Chlorophyll", concern: "Natural green from plants, safe" },
  "e141": { risk: "safe", name: "Copper Chlorophyll", concern: "Green colorant from chlorophyll, safe" },
  "e150b": { risk: "low", name: "Caramel Color II", concern: "Caustic sulfite caramel, limited concern" },
  "e150c": { risk: "moderate", name: "Caramel Color III", concern: "Ammonia caramel, may contain 4-MEI carcinogen" },
  "e153": { risk: "low", name: "Vegetable Carbon", concern: "Black color from charcoal, safe" },
  "e160a": { risk: "safe", name: "Beta-Carotene", concern: "Natural orange from carrots, converts to vitamin A, safe" },
  "e160b": { risk: "safe", name: "Annatto", concern: "Natural orange-red from seeds, safe" },
  "e160c": { risk: "safe", name: "Paprika Extract", concern: "Natural red from peppers, safe" },
  "e161b": { risk: "safe", name: "Lutein", concern: "Natural yellow, good for eye health" },
  "e162": { risk: "safe", name: "Beetroot Red", concern: "Natural red from beets, safe" },
  "e163": { risk: "safe", name: "Anthocyanins", concern: "Natural purple/red from berries, antioxidant" },
  "e170": { risk: "safe", name: "Calcium Carbonate", concern: "Chalk, calcium supplement, safe" },
  "e172": { risk: "low", name: "Iron Oxides", concern: "Mineral colorant, safe in food amounts" },
  // ── Thickeners & stabilizers ──
  "e400": { risk: "safe", name: "Alginic Acid", concern: "Seaweed extract, thickener, safe" },
  "e401": { risk: "safe", name: "Sodium Alginate", concern: "Seaweed extract, safe" },
  "e402": { risk: "safe", name: "Potassium Alginate", concern: "Seaweed extract, safe" },
  "e406": { risk: "safe", name: "Agar", concern: "Seaweed gelatin, safe" },
  "e410": { risk: "safe", name: "Locust Bean Gum", concern: "Natural thickener from carob, safe" },
  "e414": { risk: "safe", name: "Gum Arabic", concern: "Natural tree sap, safe" },
  "e418": { risk: "safe", name: "Gellan Gum", concern: "Microbial thickener, safe" },
  "e425": { risk: "safe", name: "Konjac Gum", concern: "Plant fiber thickener, safe" },
  "e433": { risk: "low", name: "Polysorbate 80", concern: "Emulsifier, may affect gut microbiome at high doses" },
  "e435": { risk: "low", name: "Polysorbate 60", concern: "Emulsifier, similar concerns to polysorbate 80" },
  "e442": { risk: "safe", name: "Ammonium Phosphatides", concern: "Emulsifier from soy, safe" },
  "e452": { risk: "low", name: "Polyphosphates", concern: "Emulsifier, excess may affect mineral absorption" },
  "e466": { risk: "safe", name: "Carboxymethyl Cellulose", concern: "Plant-derived thickener, safe" },
  "e473": { risk: "low", name: "Sucrose Esters", concern: "Emulsifier, generally safe" },
  // ── Common in energy drinks specifically ──
  "e150": { risk: "low", name: "Caramel Color", concern: "Generic caramel coloring, type determines risk level" },
  "e385": { risk: "moderate", name: "Calcium Disodium EDTA", concern: "Chelating agent, may affect mineral absorption. Used to prevent color changes" },
  "e392": { risk: "safe", name: "Rosemary Extract", concern: "Natural antioxidant, safe" },
  "e1505": { risk: "safe", name: "Triethyl Citrate", concern: "Plasticizer from citric acid, safe in food amounts" },
  "e1520": { risk: "safe", name: "Propylene Glycol", concern: "Solvent and humectant, safe in food amounts (different from antifreeze)" },
};

// ── SKINCARE / COSMETIC INGREDIENT RISKS ──
const SKINCARE_RISKS: Record<string, { risk: "high" | "moderate" | "low" | "safe"; name: string; concern: string }> = {
  // HIGH RISK — linked to cancer, endocrine disruption, severe irritation
  "formaldehyde": { risk: "high", name: "Formaldehyde", concern: "Carcinogen" },
  "bha": { risk: "high", name: "BHA (Butylated Hydroxyanisole)", concern: "Endocrine disruptor, possible carcinogen" },
  "bht": { risk: "high", name: "BHT (Butylated Hydroxytoluene)", concern: "Endocrine disruptor" },
  "triclosan": { risk: "high", name: "Triclosan", concern: "Endocrine disruptor, antibiotic resistance" },
  "oxybenzone": { risk: "high", name: "Oxybenzone", concern: "Endocrine disruptor, coral reef damage" },
  "parabens": { risk: "high", name: "Parabens", concern: "Endocrine disruptor" },
  "methylparaben": { risk: "high", name: "Methylparaben", concern: "Endocrine disruptor" },
  "propylparaben": { risk: "high", name: "Propylparaben", concern: "Endocrine disruptor" },
  "butylparaben": { risk: "high", name: "Butylparaben", concern: "Endocrine disruptor" },
  "ethylparaben": { risk: "high", name: "Ethylparaben", concern: "Endocrine disruptor" },
  "coal tar": { risk: "high", name: "Coal Tar", concern: "Carcinogen" },
  "hydroquinone": { risk: "high", name: "Hydroquinone", concern: "Organ toxicity, cancer risk" },
  "lead acetate": { risk: "high", name: "Lead Acetate", concern: "Neurotoxin" },
  "toluene": { risk: "high", name: "Toluene", concern: "Neurotoxin, reproductive harm" },
  "phthalates": { risk: "high", name: "Phthalates", concern: "Endocrine disruptor" },
  "dibutyl phthalate": { risk: "high", name: "Dibutyl Phthalate", concern: "Reproductive toxin" },
  // MODERATE RISK
  "sodium lauryl sulfate": { risk: "moderate", name: "SLS", concern: "Skin irritant" },
  "sodium laureth sulfate": { risk: "moderate", name: "SLES", concern: "Can contain 1,4-dioxane" },
  "fragrance": { risk: "moderate", name: "Fragrance/Parfum", concern: "Undisclosed chemicals, allergens" },
  "parfum": { risk: "moderate", name: "Parfum", concern: "Undisclosed chemicals, allergens" },
  "dmdm hydantoin": { risk: "moderate", name: "DMDM Hydantoin", concern: "Formaldehyde releaser" },
  "polyethylene glycol": { risk: "moderate", name: "PEG Compounds", concern: "Can contain impurities" },
  "peg": { risk: "moderate", name: "PEG", concern: "Can contain 1,4-dioxane" },
  "retinyl palmitate": { risk: "moderate", name: "Retinyl Palmitate", concern: "Sun sensitivity, may accelerate skin damage" },
  "mineral oil": { risk: "moderate", name: "Mineral Oil", concern: "Petroleum derived, can clog pores" },
  "petrolatum": { risk: "moderate", name: "Petrolatum", concern: "Petroleum derived, contamination risk" },
  "aluminum": { risk: "moderate", name: "Aluminum Compounds", concern: "Potential neurotoxin" },
  "silicone": { risk: "moderate", name: "Silicones", concern: "Environmental concern, pore clogging" },
  "dimethicone": { risk: "moderate", name: "Dimethicone", concern: "Can trap bacteria" },
  // LOW RISK
  "phenoxyethanol": { risk: "low", name: "Phenoxyethanol", concern: "Mild irritant in high concentrations" },
  "cetearyl alcohol": { risk: "low", name: "Cetearyl Alcohol", concern: "Generally safe, rare irritant" },
  "tocopherol": { risk: "safe", name: "Tocopherol (Vitamin E)", concern: "Antioxidant" },
  // SAFE / GOOD
  "hyaluronic acid": { risk: "safe", name: "Hyaluronic Acid", concern: "Hydrating" },
  "niacinamide": { risk: "safe", name: "Niacinamide (Vitamin B3)", concern: "Brightening, anti-aging" },
  "glycerin": { risk: "safe", name: "Glycerin", concern: "Moisturizing" },
  "aloe": { risk: "safe", name: "Aloe Vera", concern: "Soothing" },
  "shea butter": { risk: "safe", name: "Shea Butter", concern: "Moisturizing" },
  "jojoba": { risk: "safe", name: "Jojoba Oil", concern: "Moisturizing" },
  "squalane": { risk: "safe", name: "Squalane", concern: "Hydrating" },
  "ceramide": { risk: "safe", name: "Ceramides", concern: "Barrier repair" },
  "salicylic acid": { risk: "safe", name: "Salicylic Acid", concern: "Exfoliant, anti-acne" },
  "retinol": { risk: "low", name: "Retinol", concern: "Anti-aging, can cause irritation" },
  "zinc oxide": { risk: "safe", name: "Zinc Oxide", concern: "Safe sunscreen" },
  "titanium dioxide": { risk: "low", name: "Titanium Dioxide", concern: "Safe in non-nano form" },
  "water": { risk: "safe", name: "Water (Aqua)", concern: "Base ingredient" },
  "aqua": { risk: "safe", name: "Aqua (Water)", concern: "Base ingredient" },
};

function isCosmetic(product: Record<string, unknown>): boolean {
  const cats = ((product.categories_tags || product.categories || []) as string[]).join(" ").toLowerCase();
  const name = String(product.product_name || "").toLowerCase();
  const keywords = ["cosmetic", "beauty", "skincare", "skin care", "shampoo", "conditioner", "lotion",
    "cream", "serum", "cleanser", "moisturizer", "sunscreen", "spf", "makeup", "lipstick",
    "foundation", "mascara", "deodorant", "soap", "body wash", "face wash", "toner",
    "perfume", "cologne", "toothpaste", "mouthwash", "hair"];
  return keywords.some((k) => cats.includes(k) || name.includes(k));
}

function calculateFoodScore(product: Record<string, unknown>) {
  const nutriments = (product.nutriments || {}) as Record<string, number>;
  const additivesTags = (product.additives_tags || []) as string[];
  const labels = ((product.labels_tags || []) as string[]).join(" ").toLowerCase();

  // Nutrition (0-60)
  const sugar100g = nutriments.sugars_100g || 0;
  const salt100g = nutriments.salt_100g || (nutriments.sodium_100g || 0) * 2.5;
  const satFat100g = nutriments.saturated_fat_100g || nutriments["saturated-fat_100g"] || 0;
  const energy100g = nutriments["energy-kcal_100g"] || nutriments.energy_kcal_100g
    || (nutriments["energy-kj_100g"] ? nutriments["energy-kj_100g"] / 4.184 : 0)
    || (nutriments.energy_100g ? nutriments.energy_100g / 4.184 : 0) || 0;
  const fiber100g = nutriments.fiber_100g || 0;
  const protein100g = nutriments.proteins_100g || 0;

  let negPts = 0;
  negPts += Math.min(10, Math.floor(sugar100g / 4.5));
  negPts += Math.min(10, Math.floor(salt100g / 0.9));
  negPts += Math.min(10, Math.floor(satFat100g / 1));
  negPts += Math.min(10, Math.floor(energy100g / 335));

  let posPts = 0;
  posPts += Math.min(5, Math.floor(fiber100g / 0.9));
  posPts += Math.min(5, Math.floor(protein100g / 1.6));
  const hasFruits = ((product.categories_tags || []) as string[]).some((c: string) =>
    c.includes("fruit") || c.includes("vegetable") || c.includes("legume"));
  if (hasFruits) posPts += 5;

  const nutritionScore = Math.min(60, Math.max(0, Math.round(((40 - negPts + posPts) / 40) * 60)));

  // Additives (heavier penalties)
  const detectedAdditives: { code: string; name: string; risk: string; concern: string }[] = [];
  let additivePenalty = 0;
  let highRiskCount = 0;

  for (const tag of additivesTags) {
    const code = tag.replace("en:", "").toLowerCase();
    const info = FOOD_ADDITIVE_RISKS[code];
    if (info) {
      detectedAdditives.push({ code: code.toUpperCase(), name: info.name, risk: info.risk, concern: info.concern });
      if (info.risk === "high") { additivePenalty += 15; highRiskCount++; }
      else if (info.risk === "moderate") additivePenalty += 7;
      else if (info.risk === "low") additivePenalty += 2;
    } else {
      detectedAdditives.push({ code: code.toUpperCase(), name: code.toUpperCase(), risk: "unknown", concern: "Not in database" });
      additivePenalty += 2;
    }
  }
  additivePenalty = Math.min(50, additivePenalty);

  const isOrganic = labels.includes("organic") || labels.includes("bio");
  const organicBonus = isOrganic ? 10 : 0;

  let score = nutritionScore - additivePenalty + organicBonus;
  // Hard cap: each high-risk additive caps score lower
  if (highRiskCount >= 3) score = Math.min(score, 20);
  else if (highRiskCount >= 2) score = Math.min(score, 35);
  else if (highRiskCount >= 1) score = Math.min(score, 50);
  score = Math.max(0, Math.min(100, score));

  const trafficLights = {
    sugar: sugar100g > 12.5 ? "high" : sugar100g > 5 ? "moderate" : "low",
    salt: salt100g > 1.5 ? "high" : salt100g > 0.3 ? "moderate" : "low",
    saturatedFat: satFat100g > 5 ? "high" : satFat100g > 1.5 ? "moderate" : "low",
    calories: energy100g > 400 ? "high" : energy100g > 200 ? "moderate" : "low",
  };

  return {
    type: "food" as const, score, nutritionScore, additivePenalty, organicBonus,
    isOrganic, hasHighRisk: highRiskCount > 0, highRiskCount, trafficLights,
    additives: detectedAdditives,
    nutriments: { sugar: sugar100g, salt: salt100g, saturatedFat: satFat100g, calories: energy100g, fiber: fiber100g, protein: protein100g },
  };
}

function calculateSkincareScore(product: Record<string, unknown>) {
  const ingredientsText = String(product.ingredients_text || product.ingredients_text_en || "").toLowerCase();
  const ingredientsTags = (product.ingredients_tags || []) as string[];
  const labels = ((product.labels_tags || []) as string[]).join(" ").toLowerCase();

  // Parse ingredients from text + tags
  const allIngredients = [
    ...ingredientsTags.map((t: string) => t.replace("en:", "").toLowerCase()),
    ...ingredientsText.split(/[,;]/).map((s: string) => s.trim().toLowerCase()),
  ];

  const detectedAdditives: { code: string; name: string; risk: string; concern: string }[] = [];
  let goodCount = 0;
  let badPenalty = 0;
  let highRiskCount = 0;

  for (const [key, info] of Object.entries(SKINCARE_RISKS)) {
    const found = allIngredients.some((ing) => ing.includes(key));
    if (found) {
      detectedAdditives.push({ code: key.toUpperCase(), name: info.name, risk: info.risk, concern: info.concern });
      if (info.risk === "high") { badPenalty += 20; highRiskCount++; }
      else if (info.risk === "moderate") badPenalty += 8;
      else if (info.risk === "low") badPenalty += 2;
      else if (info.risk === "safe") goodCount++;
    }
  }

  const baseScore = 60 + Math.min(20, goodCount * 4); // good ingredients boost
  const isOrganic = labels.includes("organic") || labels.includes("bio") || labels.includes("natural");
  const organicBonus = isOrganic ? 10 : 0;

  let score = baseScore - badPenalty + organicBonus;
  if (highRiskCount >= 3) score = Math.min(score, 15);
  else if (highRiskCount >= 2) score = Math.min(score, 25);
  else if (highRiskCount >= 1) score = Math.min(score, 40);
  score = Math.max(0, Math.min(100, score));

  return {
    type: "skincare" as const, score, goodCount, badPenalty, organicBonus,
    isOrganic, hasHighRisk: highRiskCount > 0, highRiskCount,
    additives: detectedAdditives,
    ingredientCount: allIngredients.filter(Boolean).length,
  };
}

function getGrade(score: number) {
  if (score >= 75) return { grade: "Excellent", gradeColor: "#4ade80" };
  if (score >= 50) return { grade: "Good", gradeColor: "#a3e635" };
  if (score >= 25) return { grade: "Mediocre", gradeColor: "#f59e0b" };
  return { grade: "Bad", gradeColor: "#ff6b6b" };
}

export async function GET(req: NextRequest) {
  try {
    const barcode = req.nextUrl.searchParams.get("code");
    if (!barcode || !/^\d{4,14}$/.test(barcode)) {
      return NextResponse.json({ error: "Invalid barcode" }, { status: 400 });
    }

    // Try food database first
    let product = null;
    const foodRes = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`, {
      headers: { "User-Agent": "FridgeFitness/1.0" },
    });
    if (foodRes.ok) {
      const foodData = await foodRes.json();
      if (foodData.status === 1 && foodData.product) product = foodData.product;
    }

    // Try cosmetics database if not found or if it's a cosmetic
    if (!product) {
      const cosmeticRes = await fetch(`https://world.openbeautyfacts.org/api/v2/product/${barcode}.json`, {
        headers: { "User-Agent": "FridgeFitness/1.0" },
      });
      if (cosmeticRes.ok) {
        const cosmeticData = await cosmeticRes.json();
        if (cosmeticData.status === 1 && cosmeticData.product) product = cosmeticData.product;
      }
    }

    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const p = product as Record<string, unknown>;
    const isSkincare = isCosmetic(p);
    const result = isSkincare ? calculateSkincareScore(p) : calculateFoodScore(p);
    const { grade, gradeColor } = getGrade(result.score);

    const n = (p.nutriments || {}) as Record<string, number>;
    const servingSize = (p.serving_size as string) || ((p.serving_quantity as string) ? `${p.serving_quantity}${(p.serving_quantity_unit as string) || "g"}` : null);
    const perServing = isSkincare ? null : {
      sugar: n.sugars_serving || 0,
      salt: n.salt_serving || (n.sodium_serving || 0) * 2.5 || 0,
      saturatedFat: n["saturated-fat_serving"] || n.saturated_fat_serving || 0,
      calories: n["energy-kcal_serving"] || n.energy_kcal_serving || (n["energy-kj_serving"] ? n["energy-kj_serving"] / 4.184 : 0) || 0,
      fiber: n.fiber_serving || 0,
      protein: n.proteins_serving || 0,
    };

    const productQuantityG = parseFloat(String(p.product_quantity || "0")) || 0;
    const multiplier = productQuantityG > 0 ? productQuantityG / 100 : 1;
    const foodNutriments = result.type === "food" ? result.nutriments : null;
    const total = foodNutriments ? {
      sugar: foodNutriments.sugar * multiplier,
      salt: foodNutriments.salt * multiplier,
      saturatedFat: foodNutriments.saturatedFat * multiplier,
      calories: foodNutriments.calories * multiplier,
      fiber: foodNutriments.fiber * multiplier,
      protein: foodNutriments.protein * multiplier,
    } : null;

    return NextResponse.json({
      product: {
        name: (p.product_name as string) || (p.product_name_en as string) || "Unknown Product",
        brand: (p.brands as string) || "Unknown Brand",
        imageUrl: (p.image_front_small_url as string) || null,
        quantity: (p.quantity as string) || "",
        servingSize,
        categories: ((p.categories_tags || []) as string[]).slice(0, 5).map((c: string) => c.replace("en:", "").replace(/-/g, " ")),
        barcode,
      },
      ...result,
      grade,
      gradeColor,
      perServing,
      total,
      totalSize: p.product_quantity ? `${p.product_quantity}${(p.product_quantity_unit as string) || "g"}` : ((p.quantity as string) || null),
    });
  } catch {
    return NextResponse.json({ error: "Failed to analyze product" }, { status: 500 });
  }
}
