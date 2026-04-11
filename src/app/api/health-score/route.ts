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
  // ── Missing preservatives & acids ──
  "e252": { risk: "high", name: "Potassium Nitrate", concern: "Saltpeter, converts to nitrite. Carcinogenic nitrosamine risk" },
  "e261": { risk: "safe", name: "Potassium Acetate", concern: "Acidity regulator, safe" },
  "e262": { risk: "safe", name: "Sodium Acetate", concern: "Flavoring and preservative, safe" },
  "e263": { risk: "safe", name: "Calcium Acetate", concern: "Stabilizer and preservative, safe" },
  "e264": { risk: "safe", name: "Ammonium Acetate", concern: "Acidity regulator, safe" },
  "e271": { risk: "safe", name: "Sodium Lactate (extended)", concern: "Acidity regulator, safe" },
  "e280": { risk: "safe", name: "Propionic Acid", concern: "Natural preservative found in cheese, safe" },
  "e281": { risk: "safe", name: "Sodium Propionate", concern: "Bread preservative, safe" },
  "e282": { risk: "safe", name: "Calcium Propionate", concern: "Common bread mold inhibitor, safe" },
  "e283": { risk: "safe", name: "Potassium Propionate", concern: "Preservative, safe" },
  "e284": { risk: "moderate", name: "Boric Acid", concern: "Preservative, toxic in large amounts. Restricted use" },
  "e285": { risk: "moderate", name: "Sodium Tetraborate (Borax)", concern: "Banned in many countries as food additive, reproductive toxin" },
  // ── More phosphates ──
  "e342": { risk: "low", name: "Ammonium Phosphates", concern: "Leavening agent, generally safe" },
  "e343": { risk: "low", name: "Magnesium Phosphates", concern: "Mineral supplement, safe in normal amounts" },
  "e350": { risk: "safe", name: "Sodium Malate", concern: "Salt of malic acid, safe" },
  "e351": { risk: "safe", name: "Potassium Malate", concern: "Salt of malic acid, safe" },
  "e352": { risk: "safe", name: "Calcium Malate", concern: "Calcium supplement, safe" },
  "e353": { risk: "safe", name: "Metatartaric Acid", concern: "Wine stabilizer, safe" },
  "e354": { risk: "safe", name: "Calcium Tartrate", concern: "Tartrate salt, safe" },
  "e355": { risk: "safe", name: "Adipic Acid", concern: "Acidifier, found naturally in beets, safe" },
  "e356": { risk: "safe", name: "Sodium Adipate", concern: "Salt of adipic acid, safe" },
  "e357": { risk: "safe", name: "Potassium Adipate", concern: "Salt of adipic acid, safe" },
  "e363": { risk: "safe", name: "Succinic Acid", concern: "Natural acid, safe" },
  "e375": { risk: "safe", name: "Niacin (Vitamin B3)", concern: "Essential vitamin, safe" },
  "e380": { risk: "safe", name: "Triammonium Citrate", concern: "Acidity regulator, safe" },
  "e381": { risk: "safe", name: "Ammonium Ferric Citrate", concern: "Iron supplement, safe" },
  "e385": { risk: "moderate", name: "Calcium Disodium EDTA", concern: "Chelating agent, may affect mineral absorption" },
  "e386": { risk: "safe", name: "Disodium EDTA", concern: "Preservative, generally safe in food amounts" },
  "e387": { risk: "safe", name: "Oxystearin", concern: "Anti-foam agent, safe" },
  "e388": { risk: "safe", name: "Thiodipropionic Acid", concern: "Antioxidant, safe" },
  "e390": { risk: "safe", name: "Dilauryl Thiodipropionate", concern: "Antioxidant, safe" },
  "e391": { risk: "safe", name: "Phytic Acid", concern: "Natural plant antioxidant, safe" },
  "e392": { risk: "safe", name: "Rosemary Extract", concern: "Natural antioxidant, safe" },
  // ── Emulsifiers & stabilizers gap fill ──
  "e403": { risk: "safe", name: "Ammonium Alginate", concern: "Seaweed thickener, safe" },
  "e404": { risk: "safe", name: "Calcium Alginate", concern: "Seaweed thickener, safe" },
  "e405": { risk: "safe", name: "Propylene Glycol Alginate", concern: "Thickener and emulsifier, safe" },
  "e407a": { risk: "moderate", name: "Processed Eucheuma Seaweed", concern: "Degraded carrageenan, gut inflammation concern" },
  "e413": { risk: "safe", name: "Tragacanth Gum", concern: "Natural tree gum, safe" },
  "e416": { risk: "safe", name: "Karaya Gum", concern: "Natural gum, laxative in large amounts" },
  "e417": { risk: "safe", name: "Tara Gum", concern: "Plant seed thickener, safe" },
  "e426": { risk: "safe", name: "Soybean Hemicellulose", concern: "Soy fiber, safe" },
  "e427": { risk: "safe", name: "Cassia Gum", concern: "Plant thickener, safe" },
  "e431": { risk: "low", name: "Polyoxyethylene Stearate", concern: "Emulsifier, limited safety data" },
  "e432": { risk: "low", name: "Polysorbate 20", concern: "Emulsifier, may affect gut at high doses" },
  "e434": { risk: "low", name: "Polysorbate 40", concern: "Emulsifier, similar to polysorbate 80" },
  "e436": { risk: "low", name: "Polysorbate 65", concern: "Emulsifier, may affect gut microbiome" },
  // ── Cellulose derivatives ──
  "e461": { risk: "safe", name: "Methyl Cellulose", concern: "Plant fiber thickener, not absorbed, safe" },
  "e462": { risk: "safe", name: "Ethyl Cellulose", concern: "Coating agent, safe" },
  "e463": { risk: "safe", name: "Hydroxypropyl Cellulose", concern: "Thickener, safe" },
  "e464": { risk: "safe", name: "Hydroxypropyl Methyl Cellulose", concern: "Thickener and coating, safe" },
  "e465": { risk: "safe", name: "Methyl Ethyl Cellulose", concern: "Foaming agent, safe" },
  "e467": { risk: "low", name: "Ethyl Hydroxyethyl Cellulose", concern: "Thickener, limited data" },
  "e468": { risk: "safe", name: "Crosslinked Sodium CMC", concern: "Modified cellulose, safe" },
  "e469": { risk: "safe", name: "Enzymatically Hydrolysed CMC", concern: "Modified cellulose, safe" },
  "e470a": { risk: "safe", name: "Sodium/Potassium/Calcium Stearates", concern: "Anti-caking agents, safe" },
  "e470b": { risk: "safe", name: "Magnesium Stearate", concern: "Anti-caking agent, safe" },
  "e472a": { risk: "safe", name: "Acetic Acid Esters", concern: "Emulsifier, safe" },
  "e472b": { risk: "safe", name: "Lactic Acid Esters", concern: "Emulsifier, safe" },
  "e472c": { risk: "safe", name: "Citric Acid Esters", concern: "Emulsifier, safe" },
  "e474": { risk: "safe", name: "Sucroglycerides", concern: "Emulsifier, safe" },
  "e475": { risk: "safe", name: "Polyglycerol Esters", concern: "Emulsifier, safe" },
  "e477": { risk: "low", name: "Propylene Glycol Esters", concern: "Emulsifier, generally safe" },
  "e479b": { risk: "low", name: "Thermally Oxidized Soya Bean Oil", concern: "Emulsifier, limited data" },
  "e480": { risk: "safe", name: "Dioctyl Sodium Sulfosuccinate", concern: "Emulsifier, safe in food amounts" },
  "e482": { risk: "safe", name: "Calcium Stearoyl Lactylate", concern: "Dough conditioner, safe" },
  "e483": { risk: "safe", name: "Stearyl Tartrate", concern: "Dough conditioner, safe" },
  // ── Mineral salts ──
  "e501": { risk: "safe", name: "Potassium Carbonates", concern: "Alkalizing agent, safe" },
  "e504": { risk: "safe", name: "Magnesium Carbonates", concern: "Anti-caking, antacid, safe" },
  "e507": { risk: "safe", name: "Hydrochloric Acid", concern: "pH adjuster, safe in food amounts" },
  "e508": { risk: "safe", name: "Potassium Chloride", concern: "Salt substitute, safe" },
  "e509": { risk: "safe", name: "Calcium Chloride", concern: "Firming agent, safe" },
  "e510": { risk: "safe", name: "Ammonium Chloride", concern: "Flavoring (salmiak), safe in normal amounts" },
  "e511": { risk: "safe", name: "Magnesium Chloride", concern: "Coagulant for tofu, safe" },
  "e512": { risk: "safe", name: "Stannous Chloride", concern: "Antioxidant for canned food, safe in amounts used" },
  "e513": { risk: "safe", name: "Sulfuric Acid", concern: "pH adjuster, safe in trace food amounts" },
  "e514": { risk: "safe", name: "Sodium Sulfate", concern: "Diluent, safe" },
  "e515": { risk: "safe", name: "Potassium Sulfate", concern: "Mineral supplement, safe" },
  "e516": { risk: "safe", name: "Calcium Sulfate", concern: "Plaster of Paris, tofu coagulant, safe" },
  "e517": { risk: "safe", name: "Ammonium Sulfate", concern: "Dough conditioner, safe" },
  "e520": { risk: "safe", name: "Aluminium Sulfate", concern: "Firming agent, low aluminium concern in normal amounts" },
  "e524": { risk: "safe", name: "Sodium Hydroxide", concern: "pH adjuster (lye), safe in trace food amounts" },
  "e525": { risk: "safe", name: "Potassium Hydroxide", concern: "pH adjuster, safe in food amounts" },
  "e526": { risk: "safe", name: "Calcium Hydroxide", concern: "Lime water, safe" },
  "e527": { risk: "safe", name: "Ammonium Hydroxide", concern: "pH adjuster, safe in food amounts" },
  "e528": { risk: "safe", name: "Magnesium Hydroxide", concern: "Antacid, safe" },
  "e529": { risk: "safe", name: "Calcium Oxide", concern: "Quicklime, pH adjuster, safe in food" },
  "e530": { risk: "safe", name: "Magnesium Oxide", concern: "Anti-caking, safe" },
  "e535": { risk: "safe", name: "Sodium Ferrocyanide", concern: "Anti-caking in salt, safe — cyanide is bound and non-toxic" },
  "e536": { risk: "safe", name: "Potassium Ferrocyanide", concern: "Anti-caking in salt, safe" },
  "e538": { risk: "safe", name: "Calcium Ferrocyanide", concern: "Anti-caking, safe" },
  "e541": { risk: "low", name: "Sodium Aluminium Phosphate", concern: "Leavening agent, minor aluminium exposure" },
  "e542": { risk: "safe", name: "Bone Phosphate", concern: "Anti-caking from animal bones, safe" },
  "e552": { risk: "safe", name: "Calcium Silicate", concern: "Anti-caking agent, safe" },
  "e553a": { risk: "safe", name: "Magnesium Silicate", concern: "Anti-caking (talc), safe in food amounts" },
  "e553b": { risk: "safe", name: "Talc", concern: "Anti-caking, food-grade is safe" },
  "e554": { risk: "safe", name: "Sodium Aluminosilicate", concern: "Anti-caking, safe" },
  "e570": { risk: "safe", name: "Stearic Acid", concern: "Natural fatty acid, safe" },
  "e574": { risk: "safe", name: "Gluconic Acid", concern: "Natural acid, safe" },
  "e575": { risk: "safe", name: "Glucono-Delta-Lactone", concern: "Acidifier in tofu, safe" },
  "e576": { risk: "safe", name: "Sodium Gluconate", concern: "Sequestrant, safe" },
  "e577": { risk: "safe", name: "Potassium Gluconate", concern: "Mineral supplement, safe" },
  "e578": { risk: "safe", name: "Calcium Gluconate", concern: "Calcium supplement, safe" },
  "e579": { risk: "safe", name: "Ferrous Gluconate", concern: "Iron supplement, black olive coloring, safe" },
  "e585": { risk: "safe", name: "Ferrous Lactate", concern: "Iron supplement, safe" },
  // ── Flavor enhancers ──
  "e620": { risk: "low", name: "Glutamic Acid", concern: "Natural amino acid, safe in normal amounts" },
  "e622": { risk: "moderate", name: "Potassium Glutamate", concern: "MSG variant, same sensitivity concerns" },
  "e623": { risk: "moderate", name: "Calcium Glutamate", concern: "MSG variant" },
  "e624": { risk: "moderate", name: "Ammonium Glutamate", concern: "MSG variant" },
  "e625": { risk: "moderate", name: "Magnesium Glutamate", concern: "MSG variant" },
  "e626": { risk: "safe", name: "Guanylic Acid", concern: "Natural flavor enhancer, safe" },
  "e627": { risk: "safe", name: "Disodium Guanylate", concern: "Flavor enhancer often with MSG, safe alone" },
  "e628": { risk: "safe", name: "Dipotassium Guanylate", concern: "Flavor enhancer, safe" },
  "e629": { risk: "safe", name: "Calcium Guanylate", concern: "Flavor enhancer, safe" },
  "e630": { risk: "safe", name: "Inosinic Acid", concern: "Natural flavor enhancer, safe" },
  "e631": { risk: "safe", name: "Disodium Inosinate", concern: "Flavor enhancer, safe" },
  "e632": { risk: "safe", name: "Dipotassium Inosinate", concern: "Flavor enhancer, safe" },
  "e633": { risk: "safe", name: "Calcium Inosinate", concern: "Flavor enhancer, safe" },
  "e634": { risk: "safe", name: "Calcium Ribonucleotides", concern: "Flavor enhancer, safe" },
  "e636": { risk: "low", name: "Maltol", concern: "Flavor enhancer, safe in food amounts" },
  "e637": { risk: "low", name: "Ethyl Maltol", concern: "Synthetic flavor, safe in food amounts" },
  // ── Glazing agents & waxes ──
  "e900": { risk: "safe", name: "Dimethylpolysiloxane", concern: "Anti-foaming agent (in fryer oil), safe" },
  "e902": { risk: "safe", name: "Candelilla Wax", concern: "Natural plant wax, safe" },
  "e904": { risk: "safe", name: "Shellac", concern: "Natural resin from lac bugs, used as fruit coating, safe" },
  "e905": { risk: "safe", name: "Microcrystalline Wax", concern: "Mineral wax coating, safe" },
  "e907": { risk: "low", name: "Crystalline Wax", concern: "Petroleum-derived wax, safe in amounts used" },
  "e912": { risk: "safe", name: "Montan Acid Esters", concern: "Wax coating for fruit, safe" },
  "e914": { risk: "safe", name: "Oxidized Polyethylene Wax", concern: "Fruit coating, safe" },
  "e920": { risk: "low", name: "L-Cysteine", concern: "Dough improver, sometimes from human hair or duck feathers" },
  "e927b": { risk: "moderate", name: "Carbamide (Urea)", concern: "Used in chewing gum, may irritate at high levels" },
  "e938": { risk: "safe", name: "Argon", concern: "Inert gas, packaging, safe" },
  "e939": { risk: "safe", name: "Helium", concern: "Inert gas, packaging, safe" },
  "e941": { risk: "safe", name: "Nitrogen", concern: "Inert gas, used for packaging and nitro coffee, safe" },
  "e942": { risk: "safe", name: "Nitrous Oxide", concern: "Propellant in whipped cream, safe in food use" },
  "e943a": { risk: "safe", name: "Butane", concern: "Propellant, safe in trace food amounts" },
  "e943b": { risk: "safe", name: "Isobutane", concern: "Propellant, safe in trace food amounts" },
  "e944": { risk: "safe", name: "Propane", concern: "Propellant, safe in food use" },
  "e948": { risk: "safe", name: "Oxygen", concern: "Packaging gas, safe" },
  "e949": { risk: "safe", name: "Hydrogen", concern: "Packaging gas, safe" },
  // ── Modified starches (common in drinks & sauces) ──
  "e1400": { risk: "safe", name: "Dextrin", concern: "Modified starch, safe" },
  "e1401": { risk: "safe", name: "Acid-treated Starch", concern: "Modified starch, safe" },
  "e1402": { risk: "safe", name: "Alkaline-treated Starch", concern: "Modified starch, safe" },
  "e1403": { risk: "safe", name: "Bleached Starch", concern: "Modified starch, safe" },
  "e1404": { risk: "safe", name: "Oxidized Starch", concern: "Modified starch, safe" },
  "e1410": { risk: "safe", name: "Monostarch Phosphate", concern: "Modified starch, safe" },
  "e1412": { risk: "safe", name: "Distarch Phosphate", concern: "Modified starch thickener, safe" },
  "e1413": { risk: "safe", name: "Phosphated Distarch Phosphate", concern: "Modified starch, safe" },
  "e1414": { risk: "safe", name: "Acetylated Distarch Phosphate", concern: "Modified starch, safe" },
  "e1420": { risk: "safe", name: "Acetylated Starch", concern: "Modified starch, safe" },
  "e1422": { risk: "safe", name: "Acetylated Distarch Adipate", concern: "Modified starch thickener, safe" },
  "e1440": { risk: "safe", name: "Hydroxypropyl Starch", concern: "Modified starch, safe" },
  "e1442": { risk: "safe", name: "Hydroxypropyl Distarch Phosphate", concern: "Very common modified starch, safe" },
  "e1450": { risk: "safe", name: "Starch Sodium Octenyl Succinate", concern: "Emulsifying starch, safe" },
  "e1451": { risk: "safe", name: "Acetylated Oxidized Starch", concern: "Modified starch, safe" },
  "e1452": { risk: "safe", name: "Starch Aluminium Octenyl Succinate", concern: "Modified starch, safe" },
  "e1505": { risk: "safe", name: "Triethyl Citrate", concern: "Plasticizer from citric acid, safe" },
  "e1510": { risk: "safe", name: "Ethanol", concern: "Alcohol, solvent and carrier, safe in amounts used" },
  "e1517": { risk: "safe", name: "Glyceryl Diacetate", concern: "Solvent, safe" },
  "e1518": { risk: "safe", name: "Glyceryl Triacetate", concern: "Humectant, safe" },
  "e1520": { risk: "safe", name: "Propylene Glycol", concern: "Solvent and humectant, safe in food amounts" },
  "e1521": { risk: "safe", name: "Polyethylene Glycol", concern: "Tablet coating, safe in amounts used" },
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

  // Nutrition (0-100)
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

  const nutritionScore = Math.min(100, Math.max(0, Math.round(((40 - negPts + posPts) / 40) * 100)));

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
