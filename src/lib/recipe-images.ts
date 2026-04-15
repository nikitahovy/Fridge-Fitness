/** Keyword → Unsplash photo ID mapping. Order matters — first match wins. */
const KEYWORD_IMAGES: [string[], string][] = [
  // Specific dishes first (most precise)
  [["stir fry", "stir-fry", "stirfry"], "photo-1512058564366-18510be2db19"],
  [["smoothie", "shake", "blended"], "photo-1553530666-ba11a7da3888"],
  [["parfait", "yogurt", "granola"], "photo-1490371475955-4cb3bfc72f71"],
  [["oatmeal", "oats", "porridge", "overnight"], "photo-1517673400267-0251440c45dc"],
  [["burrito", "wrap", "tortilla", "quesadilla"], "photo-1626700051175-6818013e1d4f"],
  [["taco", "tacos", "mexican", "enchilada"], "photo-1551504734-5ee1c4a1479b"],
  [["curry", "tikka", "masala", "korma"], "photo-1565557623262-b51c2513a641"],
  [["soup", "stew", "chowder", "chili", "broth"], "photo-1613844237701-8f3664fc2eff"],
  [["pasta", "spaghetti", "noodle", "penne", "linguine", "mac"], "photo-1563379926898-05f4575a45d8"],
  [["salad", "slaw", "greens"], "photo-1512621776951-a57141f2eefd"],
  [["sandwich", "panini", "sub", "club", "blt"], "photo-1528735602780-2552fd46c7af"],
  [["pizza", "flatbread"], "photo-1565299624946-b28f40a0ae38"],
  [["burger", "hamburger"], "photo-1568901346375-23c9450c58cd"],
  [["sushi", "roll", "poke"], "photo-1604259596863-57153177d40b"],
  [["pancake", "waffle", "french toast", "crepe"], "photo-1567620905732-2d1ec7ab7445"],
  [["egg", "scramble", "omelette", "omelet", "frittata"], "photo-1544378828-5a7e2e02c2fd"],
  [["rice bowl", "grain bowl", "buddha bowl", "power bowl"], "photo-1543508289-2a4346387248"],
  [["salmon", "fish", "tuna", "cod", "shrimp", "seafood"], "photo-1467003909585-2f8a72700288"],
  [["chicken", "poultry", "turkey"], "photo-1532550907401-a500c9a57435"],
  [["steak", "beef", "pork", "lamb", "meat"], "photo-1546964124-0cce460f38ef"],
  [["toast", "bread", "avocado toast"], "photo-1525351484163-7529414344d8"],
  [["cake", "dessert", "brownie", "cookie", "sweet"], "photo-1551024506-0bccd828d307"],
  [["soup", "ramen"], "photo-1547592166-23ac45744acd"],
  // Broader categories (fallback)
  [["bowl"], "photo-1543508289-2a4346387248"],
  [["bake", "roast", "oven", "casserole"], "photo-1573730301149-84ca30c4c924"],
  [["breakfast", "morning", "brunch"], "photo-1569991869939-599da7cd0149"],
  [["snack", "bite", "dip", "hummus", "cheese"], "photo-1467453678174-768ec283a940"],
  [["drink", "juice", "lemonade", "tea", "coffee"], "photo-1505252585461-04db1eb84625"],
];

const DEFAULT_IMAGE = "photo-1504674900247-0877df9cc836"; // generic food

/** Get a relevant image URL for a recipe based on keyword matching in its name */
function unsplashUrl(photoId: string): string {
  const raw = `https://images.unsplash.com/${photoId}?w=600&h=400&fit=crop`;
  return `/api/img?url=${encodeURIComponent(raw)}`;
}

/** Get a relevant image URL for a recipe based on keyword matching in its name */
export function getRecipeImageUrl(name: string, _index: number): string {
  const lower = name.toLowerCase();

  for (const [keywords, photoId] of KEYWORD_IMAGES) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return unsplashUrl(photoId);
      }
    }
  }

  return unsplashUrl(DEFAULT_IMAGE);
}

/** Convert a raw Unsplash URL to our proxied URL */
export function proxyImageUrl(url: string): string {
  if (url.includes("unsplash.com")) {
    return `/api/img?url=${encodeURIComponent(url)}`;
  }
  return url;
}
