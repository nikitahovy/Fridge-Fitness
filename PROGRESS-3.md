# Fridge Fitness — Progress Report #3

## What Changed Since Progress Report #2

This session delivered **security hardening**, **weekly meal plans**, **recipe images**, **PWA support**, **receipt OCR**, a **full mascot personality system**, **recipe favorites & cooking history**, **guided onboarding**, **daily macro tracking**, and dozens of mobile/dark-mode polish fixes. ~30 commits.

**Live at:** [fridge-fitness.vercel.app](https://fridge-fitness.vercel.app)

---

## New Features

### Recipe Images
- Every recipe (seed, AI, meal plan) now shows a food photo
- `src/lib/recipe-images.ts` — keyword matching system: scans recipe name for food words ("stir fry" → stir fry photo, "smoothie" → smoothie photo, "burrito" → burrito photo)
- 27 keyword groups covering stir-fry, smoothie, parfait, burrito, tacos, curry, soup, pasta, salad, sandwich, pizza, burger, sushi, pancake, eggs, bowls, seafood, chicken, steak, toast, dessert, etc.
- Images proxied through `/api/img` route to avoid CSP/CORS/hotlink issues — server fetches from Unsplash CDN and serves from our domain with 7-day cache
- Scored recipe cards: image on top (mobile) or left side (desktop ≥1024px)
- Recipe detail page: hero banner image at top of glass card
- Dashboard suggested recipes: thumbnail above each card

### Security Hardening
- **Rate limiting** (`src/lib/rate-limit.ts`) — sliding-window in-memory limiter applied to all 16 API routes
  - AI generation: 10 req/hr
  - Image analysis: 20 req/hr
  - Barcode OCR: 30 req/hr
  - Barcode lookup: 60 req/hr
  - Default: 120 req/hr
  - Auto-cleanup of expired entries every 5 minutes
  - Returns `429 Too Many Requests` with `Retry-After` header
- **Auth added** to `/api/analyze-image` and `/api/read-barcode` (were open, now require login)
- **Zod validation** added to profile PATCH (was raw input) — `profilePatchSchema` with enum fitness goals, sanitized strings, bounded household size
- **UUID validation** on inventory DELETE
- **Image data URL** size cap (10MB) + MIME whitelist on vision routes
- **Sanitize function** strengthened: strips null bytes + HTML comments
- **CORS fixed** — removed blanket exception for `/upload` and `/sessions` routes
- **CSP tightened** — removed `'unsafe-eval'` from `script-src`
- **Recipe post-processing** (`src/lib/recipe-fix.ts`) — server-side fix for LLM inconsistencies:
  - Scans steps for phantom ingredients (flour, salt, oil, etc.) not in ingredients list → auto-adds them
  - Strips brand names (Kirkland, Great Value, Trader Joe's, etc.) from recipe names and ingredients
  - 30+ common phantom ingredients covered
- **Recipe quality enforcement** — prompts require ≥3 ingredients, ≥3 steps, no brand names; server rejects non-compliant recipes

### Weekly Meal Plans
- **`/api/generate-meal-plan`** — Groq generates 28 meals (7 days × 4 slots: breakfast/lunch/dinner/snack) prioritizing expiring inventory
- **`/meal-plan` page** (`src/app/(app)/meal-plan/page.tsx`)
  - 7-day vertical layout, each day shows 4 meal slots with recipe thumbnails
  - Daily macro totals (protein/carbs) in day headers
  - "TODAY" badge on current day with sky ring highlight
  - "AI PLAN" button generates, "CLEAR" wipes everything
  - Coverage summary: "X/28 meals, Y/Z ingredients owned"
  - Missing ingredients list with "ADD X ITEMS TO CART" button → creates a shopping cart and navigates to `/cart`
  - Recipes clickable → full detail page with ingredients, steps, Cook Now
  - Persisted to `localStorage` key `ff_meal_plan`
- Added to sidebar nav (desktop + mobile drawer) with `CalendarDays` icon

### FridgeMascot Personality System
The cute anthropomorphized fridge mascot now appears throughout the app in 5 moment types:

#### Empty States (with speech bubbles)
- Dashboard welcome: waving mascot + "Let's stock me up!"
- Inventory empty: bouncing mascot + "I'm hungry!"
- Meal plan empty: waving mascot + "Plan the week!"
- Cart empty: waving mascot + "Need groceries?"
- Analytics no data: bouncing mascot + "Start eating!"

#### Expiry Nudge (Dashboard Hero)
- AT RISK THIS WEEK: worried running mascot in rose color, top-right corner
- ALL CLEAR: happy mascot in emerald, top-right corner

#### Cook Now Success
- Running + bobbing mascot in emerald celebrating in the green success card

#### Error/404
- Recipe not found: mascot + "Where'd it go?"
- Global 404 page (`src/app/not-found.tsx`): large waving mascot + "Maybe it expired?"

#### Streak Celebration
- Analytics ALL TIME section: if savings ≥70%, running mascot with "Nice!" badge

#### Mascot Enhancements
- New `waving` prop — shows two arms that wave with offset CSS animations
- Wider SVG viewBox (`-4 0 32 32`) when waving so arms aren't clipped
- `mascot-wave-left` / `mascot-wave-right` keyframes in `globals.css`
- Never bounce AND wave simultaneously — each instance uses one or the other
- Logo scaled up 35% (`scale-[1.35]`) in sidebar containers

### Recipe Favorites & Cooking History
- **Favorites**: Heart icon on all recipe cards (ranked, AI, favorites tab) and detail page header
  - Toggle saves/removes recipe to `ff_favorite_recipes` localStorage
  - "FAVS" tab appears on recipes page when favorites exist
  - Full recipe cards with images in favorites view
- **Cooking History**: Cook Now logs to `ff_cook_history` localStorage
  - Stores recipe name, macros, date, ingredients used, waste rescued (last 50)
  - Dashboard "RECENTLY COOKED" section shows last 3 entries with date + protein + waste saved

### Guided Onboarding Flow
- `src/components/onboarding/OnboardingFlow.tsx` — 4-step walkthrough overlay
  - Step 1: "Welcome to Fridge Fitness" — mascot waving, app intro
  - Step 2: "Add Your Food" — camera/receipt/barcode/manual explanation
  - Step 3: "We Track Freshness" — eat-first queue, freeze nudges, savings
  - Step 4: "AI Recipes & Meal Plans" — recipe generation, weekly planning
- Glass card centered with backdrop blur overlay
- Progress dots, Skip/Next buttons, step counter
- Tracked via `ff_onboarded` localStorage — only shows once for new users with empty inventory

### Daily Macro Tracker
- Cook Now saves protein/carbs/fat to daily localStorage key (`ff_macros_YYYY-MM-DD`)
- Dashboard "TODAY'S NUTRITION" section with 3 SVG progress rings
  - Green ring: protein (target 150g)
  - Blue ring: carbs (target 250g)
  - Amber ring: fat (target 65g)
- `src/components/MacroRing.tsx` — reusable animated ring component
- Auto-resets daily (keyed by ISO date)

### Smart Cook Now
- No longer marks ALL matched ingredients as fully consumed
- **Partial use detection**: condiments, sauces, oils, grains stay in inventory (marked as opened)
- Ingredient amounts with `tbsp`, `tsp`, `pinch`, `drizzle`, `cup`, `oz` recognized as partial use
- Only items fully consumed (whole chicken breast, bag of spinach) get removed
- Confirmation message: "2 used up, 3 partially used"

### PWA Support
- `src/app/manifest.ts` — generates `/manifest.webmanifest` via Next.js metadata API
- `src/app/sw.js/route.ts` — serves service worker as API route (static files 404'd on Vercel)
- Square PWA icons: `icon-192.png` (192×192) and `icon-512.png` (512×512) with black background
- Separate `any` and `maskable` icon purpose entries for Chrome compliance
- Service worker: network-first for pages, cache-first fallback for offline support
- Apple Web App meta tags: `black-translucent` status bar, "FridgeFit" title

### Receipt OCR
- New "RECEIPT" tab on add-item page (`src/app/(app)/add-item/page.tsx`)
- Reuses existing camera + AI vision pipeline
- Receipt-specific copy: "Snap a grocery receipt — AI extracts items and prices"
- Same flow: capture → AI analyze → review detected items → bulk add to inventory

### "Freeze Now" Nudge Cards
- Dashboard section between "Expiring Soon" and "Suggested Recipes"
- Shows items expiring in fridge (not already frozen, excludes produce)
- Header: "FREEZE TO SAVE $X.XX" with total potential savings
- Per-item: name, quantity, price, one-tap "FREEZE NOW" button
- Blue `risk-frozen` styling with sky-colored text

### Health Score Accuracy
- **Carbs and fat** now shown in health score (was only protein + fiber)
- Color-coded macro grid: green protein, blue carbs, amber fat, green fiber
- **Per-serving fix**: when `_serving` fields missing (common), computes from `per_100g × serving_quantity`
- **Incomplete data warning**: yellow banner when the database is missing protein/carbs/fat data
- `dataCompleteness` flag returned by API so UI can warn users

### Shopping List from Meal Plan
- "ADD X ITEMS TO CART" button on meal plan missing ingredients section
- Creates an actual shopping cart via `/api/carts` with all missing ingredients
- Navigates to `/cart` page after creation

---

## Bug Fixes

### Eat-First Text Contrast
- Red text on red `risk-urgent` cards in light mode was invisible
- Changed to `text-rose-950/50` (dark on pink) for light mode, `text-rose-200/50` for dark mode
- Rank numbers also darkened for contrast

### Inventory OPEN Button
- "OPENED" button had violet highlighted style that looked pre-clicked
- Renamed to "OPEN" with muted default `btn` styling

### Analytics Percentages
- Saved/Wasted cards changed from dollar amounts to percentages (e.g., "85%")
- Dollar amount shown as subtitle (e.g., "Saved ($42)")

### Dark Mode Polish
- Analytics chart bar backgrounds: invisible `bg-white/50` → `bg-white/50 dark:bg-neutral-800/50`
- Category breakdown bar gradients: `from-white/15` → themed `from-slate-400/20 dark:from-slate-300/20`

### Mobile Layout
- **Recipes page**: image stacks on top (full width) below 1024px, side-by-side only on desktop
- **Analytics page**: smaller text, tighter gaps, whole-number dollars, compact 2×2 grid
- **Meal plan page**: compact header buttons, shorter macro labels (P/C), hide fat on mobile
- Meal plan added to mobile drawer navigation

### Recipe Image Fixes
- Replaced deprecated `source.unsplash.com` with direct Unsplash CDN URLs
- Fixed all AI recipes showing same image (hash-based → keyword-based matching)
- Fixed stale cached recipes in localStorage not being replaced on regeneration
- Image proxy (`/api/img`) solves CSP/CORS/hotlink blocking on deployed site

### Meal Plan Cache
- Old `mp-r-*` recipes persisted in localStorage across regenerations
- Now properly nukes ALL old meal plan recipes before saving new ones
- CLEAR button fully removes data from both `ff_meal_plan` and `ff_ai_recipes`

---

## UI Polish

### Recipe Cards
- Scored recipes: image + heart button + score + explanation pills + stats
- AI recipes: image + heart + AI badge + tags + stats + ingredient preview
- Favorites: dedicated tab with full card layout and filled heart

### Dashboard Sections (in order)
1. WHOOP Recovery (Coming Soon)
2. Loss-Aversion Hero (AT RISK $ or ALL CLEAR) with mascot
3. Expiring Soon (horizontal card carousel)
4. Freeze to Save (conditional nudge cards)
5. Suggested Recipes (2×2 grid with images)
6. Today's Nutrition (macro progress rings)
7. Recently Cooked (last 3 cook history entries)

---

## Tech Stack (Updated)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2 (App Router, TypeScript) |
| Styling | Tailwind CSS v4, `@custom-variant dark` for theme |
| Database | Supabase Postgres + RLS |
| Auth | Supabase Auth (email/password) |
| AI Vision | Groq (Llama 4 Scout) — food detection from photos |
| AI Recipes | Groq (Llama 4 Scout) — recipe generation from inventory |
| AI Meal Plans | Groq (Llama 4 Scout) — 7-day meal plan generation |
| Food Data | Open Food Facts API (free, no key) |
| Cosmetic Data | Open Beauty Facts API (free, no key) |
| Barcode | Native BarcodeDetector API + Groq fallback |
| Icons | Lucide React (line icons, tree-shakeable) |
| Validation | Zod |
| Hosting | Vercel |
| Fonts | Inter + Space Mono (Google Fonts) |
| Theme | ThemeProvider Context + localStorage + inline init script |
| PWA | manifest.ts + service worker via API route |
| Rate Limiting | In-memory sliding window (per-route configurable) |
| Image Proxy | `/api/img` — proxies Unsplash through our domain |

---

## localStorage Keys

| Key | Purpose |
|-----|---------|
| `ff_theme` | Light/dark mode preference |
| `ff_ai_recipes` | AI-generated recipes cache |
| `ff_meal_plan` | Weekly meal plan data |
| `ff_recent_routes` | Mobile bottom nav recent tabs |
| `ff_favorite_recipes` | Saved favorite recipes |
| `ff_cook_history` | Cooking history (last 50) |
| `ff_onboarded` | Whether user has seen onboarding |
| `ff_macros_YYYY-MM-DD` | Daily macro tracking (protein/carbs/fat) |

---

## What's Next (Planned)

- [ ] Push notifications for expiring items
- [ ] Barcode quick-add (one-tap after scan)
- [ ] Recipe sharing (link or image card)
- [ ] Achievements/badges ("Zero Waste Week", "Saved $100", etc.)
- [ ] Weekly digest summary card
- [ ] Grocery price trends
- [ ] Inventory search + sort
- [ ] Duplicate item merging
- [ ] Quick quantity edit (swipe/tap)
- [ ] Export data (CSV/PDF)
- [ ] Household sharing (invite family)
- [ ] WHOOP / wearable integration
- [ ] Editable daily macro targets in settings

---

## Commits This Session (~30 commits)

1. Add recipe images, fix eat-first text contrast, fix inventory OPEN button
2. Fix recipe images — replace deprecated Unsplash Source with CDN URLs
3. Fix AI recipe duplicate images and detail page Not Found
4. Fix recipe images to match by keyword in recipe name
5. Fix detail page hero image for AI/meal-plan recipes
6. Enforce recipe quality: min 3 ingredients, 3 steps, no brand names
7. Enforce steps only reference listed ingredients
8. Fix meal plan caching: replace stale recipes
9. Add server-side recipe post-processing for consistency
10. Add security hardening + weekly meal plan feature
11. Fix meal plan cache: nuke old data on regenerate + add mobile nav
12. Change analytics saved/wasted to percentages
13. Fix mobile layout for analytics and meal plan pages
14. Smart Cook Now: partial vs full ingredient consumption
15. Fix recipes page mobile layout
16. Fix recipes mobile: stack images on top up to 1024px
17. Scale up logo PNG inside sidebar containers
18. Add FridgeMascot throughout the app: 5 moment types
19. Fix mascot: center all, add speech bubbles, add waving arms
20. Fix mascot: wider viewBox for arms, both arms wave, mix animations
21. Improve health score accuracy: add carbs/fat, fix per-serving, flag missing data
22. Add PWA support, receipt OCR tab, freeze nudge cards, meal plan shopping list
23. Fix PWA install: proper square icons + manifest for Chrome
24. Fix PWA: serve manifest and SW via Next.js routes
25. Widen CSP img-src to allow all Unsplash subdomains
26. Proxy recipe images through /api/img to fix broken loading
27. Add recipe favorites and cooking history
28. Add guided onboarding flow for new users
29. Add daily macro tracker + dark mode polish
