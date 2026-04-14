/** Curated food photos from Unsplash CDN for recipe cards */
const PHOTO_IDS = [
  "photo-1511910849309-0dffb8785146",  // stir fry
  "photo-1505252585461-04db1eb84625",  // smoothie
  "photo-1543508289-2a4346387248",     // bowl
  "photo-1563379926898-05f4575a45d8",  // pasta
  "photo-1569991869939-599da7cd0149",  // breakfast
  "photo-1467453678174-768ec283a940",  // snack
  "photo-1512621776951-a57141f2eefd",  // salad
  "photo-1664455248787-bed872761fa2",  // wrap
  "photo-1613844237701-8f3664fc2eff",  // soup
  "photo-1585138548795-fa869d44af7c",  // one-pot
  "photo-1532550907401-a500c9a57435",  // grilled protein
  "photo-1585417791023-a5a6164b2646",  // quick meal
  "photo-1547573854-74d2a71d0826",    // dinner plate
  "photo-1536329639134-ade172b2fea0",  // lunch
  "photo-1492683513054-55277abccd99",  // dessert
  "photo-1564636242997-77953084df48",  // recovery
  "photo-1565557623262-b51c2513a641",  // curry
  "photo-1551504734-5ee1c4a1479b",    // tacos
  "photo-1573730301149-84ca30c4c924",  // baked
  "photo-1578935149228-66b184c83e69",  // seafood
];

/** Simple string hash → consistent index per recipe name */
function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Get a consistent, diverse image URL for a recipe based on its name */
export function getRecipeImageUrl(name: string, index: number): string {
  const hash = hashCode(name.toLowerCase());
  // Mix hash with index to ensure adjacent recipes get different images
  const photoIndex = (hash + index * 7) % PHOTO_IDS.length;
  return `https://images.unsplash.com/${PHOTO_IDS[photoIndex]}?w=600&h=400&fit=crop`;
}
