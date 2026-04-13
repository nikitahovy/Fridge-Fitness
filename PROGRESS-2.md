# Fridge Fitness — Progress Report #2

## What Changed Since Progress Report #1

This session focused on **UI/UX design overhaul**, **feature improvements**, and **bug fixes** across the entire application. The app went from a purely dark-themed matte UI to a dual-theme system with a polished Frutiger Aero light mode and the original matte dark mode, with many quality-of-life improvements along the way.

**Live at:** [fridge-fitness-7pfr.vercel.app](https://fridge-fitness-7pfr.vercel.app)

---

## New Features

### Dark/Light Mode Toggle
- **ThemeProvider** React Context in `src/lib/theme.tsx` manages theme state
- Adds/removes `.dark` class on `<html>` via `useEffect` (avoids React reconciliation race)
- Inline init script in `src/app/layout.tsx` runs before hydration — reads localStorage and sets the class synchronously so there's **no flash** on page load
- `@custom-variant dark (&:where(.dark, .dark *))` in Tailwind v4 enables `dark:` utility prefixes
- **ThemeToggle** component (`src/components/ThemeToggle.tsx`) — sun/moon glass segmented control in `/settings`
- Persists to `localStorage` under key `ff_theme`

#### Light Mode (Frutiger Aero / Apple Liquid Glass)
- Translucent white glass surfaces with heavy `backdrop-blur` + `saturate(1.8)`
- Subtle off-white body background with very faint blue/green radial-gradient ambient auras
- Sky-blue active sidebar pill
- Inventory risk cards: bright pastel gradients (rose/amber/sky/emerald) with colored borders
- Action buttons (EATEN/FREEZE/TOSS): pastel tinted backgrounds — green-100 for eat, blue-100 for freeze, red-100 for danger
- Form inputs: bright white `bg-white/75` with `border-slate-300/70`, `focus:border-sky-400` focus ring

#### Dark Mode (Matte Neutral)
- Pure neutral palette (`#08080a` body, `#141417` cards, `#26262a` borders) — **no blue/teal tint**
- Solid (non-blur) `.glass` surfaces for matte instrument-panel feel
- Risk cards: subtle dark colored gradients (red-950/yellow-900/blue-950/emerald-950) at low opacity over `#141417` dark base, fading to transparent at 70%
- Sidebar: `neutral-900` (not `slate-900`) — pure grey with no blue cast
- Form inputs: `bg-neutral-900/70` with `border-neutral-700`

#### Semantic Risk Classes (globals.css)
- `.risk-urgent`, `.risk-week`, `.risk-frozen`, `.risk-safe` defined once in CSS with both light AND dark variants
- Used by `inventory/page.tsx` and `eat-first/page.tsx` — single source of truth
- Dark mode restores the OG subtle gradients from Progress Report #1

### Lucide Icons + Emoji Removal
- Installed `lucide-react` (~14 icons imported, tree-shakeable)
- Replaced **all UI emojis** (🏠🧊⚡🍳➕🛒📊🔬⚙️🥡📷📸✏️✅) with consistent lucide line icons across 8 files
- Icons use `currentColor` + `strokeWidth={2}` (inactive) / `strokeWidth={2.5}` (active) for both themes
- AI prompt emojis in `generate-recipes/route.ts` kept (semantic markers for the LLM, not displayed)

### Dynamic Mobile Bottom Nav (Recents)
- **3 pinned tabs** always on the left: Home, Inventory, Recipes
- **2 dynamic recent slots** on the right: populated as the user navigates (e.g., visit Eat First → it appears in recents)
- `useRecentRoutes(2)` hook in `Sidebar.tsx` — tracks via `localStorage` key `ff_recent_routes`, dedupes, filters pinned routes, caps at 2
- Subtle vertical divider between pinned and recents
- Menu button above the bar still opens the full drawer

### FridgeMascot Character
- Cute anthropomorphized fridge SVG (eyes, smile, two legs) at `src/components/mascot/FridgeMascot.tsx`
- Canonical source of truth — `RunningFridge` loading component imports it
- Standalone vector at `public/mascot.svg` for marketing/design use
- Props: `size`, `running` (animated legs), `className` (for color via `currentColor`)
- Used in the AI photo analysis loading bar — the running fridge slides across a dashed track

### Route Transition Loaders
- `src/app/(app)/loading.tsx` + `src/app/(auth)/loading.tsx` — Next.js Suspense boundaries
- `LoadingVariants.tsx` exports 3 swappable variants: `LogoPulse`, `LogoOrbit`, `MinimalDots`
- Default is `LogoPulse` (logo with gentle animate-pulse)
- Easy to swap by changing one import line

### RunningFridge AI Photo Loader
- `src/components/loading/RunningFridge.tsx` — appears under the camera preview while the vision API call is in flight
- SVG fridge mascot runs across a horizontal dashed "track" bar via CSS keyframes (`fridge-run`, `fridge-bob`, `leg-step-a/b`, `track-scroll`)
- All keyframes defined in `globals.css`

### Cross-Platform Scan Feedback
- `src/lib/scan-feedback.ts` — `playScanFeedback()` fires both vibration AND audio beep
- **Vibration**: `navigator.vibrate([40, 30, 80])` — Android only, short-gap-long pattern
- **Audio beep**: 880Hz→1320Hz Web Audio ding — **works on iOS Safari** where vibration doesn't
- Used in `/scan` and `/health-scan` barcode pages

---

## Bug Fixes

### Health Score Cap (60 → 100)
- `src/app/api/health-score/route.ts:420` — nutrition score formula was `Math.min(60, ...)`, hard-capping even perfectly healthy foods at 60/100
- Changed to `Math.min(100, ...)` with multiplier scaled to 100 — healthy whole foods can now reach 80-100

### Skincare Discoverability
- The backend already supported skincare via Open Beauty Facts + `isCosmetic()` + `calculateSkincareScore()` + 47+ ingredient risk database
- The UI never mentioned it — updated `health-score/page.tsx` landing with "Scan Food or Skincare Barcode" + info cards explaining both scanner types
- Redesigned the scan CTA as a sky-blue gradient primary action button with camera icon + arrow indicator

### Shelf-Life Engine Improvements

#### Word-Level Fuzzy Matcher (3 passes)
- **Pass 1**: exact key match (`"chicken breast"`)
- **Pass 2**: substring match in either direction (`"organic baby spinach"` contains `"baby spinach"`)
- **Pass 3 (new)**: requires the **first word** of a multi-word key to be in the input. So `"raw chicken"` matches `"chicken breast"` (shared word "chicken"), but `"Korean BBQ sauce"` does NOT falsely match `"soy sauce"` (the word "sauce" alone is ambiguous)
- Items that now match named rules no longer show the `~estimate` suffix

#### Opened-Life Clamped by Sealed-Life
- Bug: opening an already-expired item granted fresh `rules.opened` days (expired chicken → click Opened → "2 days remaining")
- Fix: `expiryDays = Math.min(openedLife, sealedLife)` — opening can never EXTEND life past the purchase-based timer

#### OPENED Button Visibility
- Hidden for `produce` (fruits/vegetables don't have opened state)
- Hidden for `protein` (whole chicken/steak/fish don't have opened state)
- Hidden when `riskTier === "use-today"` (already expired — opening doesn't help)

### Mobile Vision API Fix
- Modern phone cameras produce 5-12 MB JPEGs → base64 inflates to 8-15 MB → exceeded Vercel's ~4.5 MB body limit
- Added client-side `compressImage()` in `add-item/page.tsx` — resizes to max 1600px + re-encodes as JPEG at 0.82 quality via Canvas → typically 200-500 KB
- Vision model doesn't need high resolution; Llama 4 Scout processes at lower internal res anyway

### AI Recipe Detail Page
- Bug: `/api/generate-recipes` returned recipes but never persisted them. When clicking an AI recipe card → detail page called `/api/recipes` → not found → blank page
- Fix: AI recipes now saved to `localStorage` (`ff_ai_recipes` key) on generation. Detail page detects `ai-*` IDs, loads from storage, fetches inventory + recovery, runs `scoreRecipe()` inline → full-feature detail page with matchedItems, Cook Now button, etc.

### Mobile Scroll Fix
- `pb-24` (96px) wasn't enough clearance for the redesigned mobile bottom nav → last inventory items hidden behind the bar
- Bumped to `pb-36` (144px) on mobile only (`md:pb-8` desktop unchanged)

### Sidebar Scroll Fix
- Sticky sidebar (`h-screen overflow-hidden` body) clipped the sidebar nav when it was too tall
- Added `overflow-y-auto overscroll-contain min-h-0` to the `<nav>` element so it scrolls internally while the logo header and sign-out button stay locked

---

## UI Polish

### Sidebar Logo
- New snowflake+leaf logo (`public/logo.png`, 1024×950 RGBA)
- Wrapper: `w-14 h-14 rounded-[14px] overflow-hidden bg-black` — solid black bg hides the PNG's transparent padding, so no visible gap between the icon's rounded square and the wrapper
- `object-cover scale-[1.28]` crops the PNG's internal whitespace edge
- `quality={100}` + 2× source resolution hints for retina sharpness
- Mobile drawer: `w-12 h-12 rounded-[12px]`

### Active Sidebar Item
- Light mode: white→sky-50 gradient pill, `text-slate-950`, no inset top highlight (drop shadow only at bottom)
- Dark mode: neutral-800 matte pill, `text-neutral-50`

### Inventory Row Styling
- Status badge text: `-700` shade colors (rose-700, amber-700, sky-700, emerald-700) for light mode readability, `-300` shade for dark mode

### Fridge Track (RunningFridge loader)
- Light mode: dark dashes (`rgba(0,0,0,0.25)`)
- Dark mode: light dashes (`rgba(255,255,255,0.20)`)

---

## Layout Architecture

### Fixed Sidebar Shell
- `<body className="h-screen flex overflow-hidden">` — body is exactly viewport height, does not scroll
- Sidebar has `h-screen` and `overflow-y-auto` on `<nav>` — scrolls internally
- `<main>` has `h-screen overflow-y-auto` — only the content area scrolls
- Background gradient is `background-attachment: fixed` so it stays anchored

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
| Food Data | Open Food Facts API (free, no key) |
| Cosmetic Data | Open Beauty Facts API (free, no key) |
| Barcode | Native BarcodeDetector API + Groq fallback |
| Icons | Lucide React (line icons, tree-shakeable) |
| Validation | Zod |
| Hosting | Vercel |
| Fonts | Inter + Space Mono (Google Fonts) |
| Theme | ThemeProvider Context + localStorage + inline init script |

---

## What's Next (Planned)

- [ ] WHOOP / wearable integration (currently "Coming Soon" banner)
- [ ] Meal planner — weekly calendar with recipe scheduling
- [ ] Push notifications for expiring items
- [ ] Household sharing — invite family to shared inventory
- [ ] Kroger API for real store pricing
- [ ] Rate limiting via Redis (removed in-memory version, needs DB-backed)
- [ ] PWA support for mobile install
- [ ] Receipt OCR ingestion (Groq vision can already do it; needs thin wrapper)
- [ ] "Freeze now" proactive nudge cards on dashboard
- [ ] Polish remaining dark-mode gaps (analytics charts, some auth page inputs)

---

## Commits This Session (~15 commits)

1. Loss-aversion dashboard hero + dynamic state-aware shelf life
2. Route transition loaders + running fridge AI photo loader
3. Visual identity refresh: new logo, mascot, matte palette, aura rings
4. Fix health score cap, surface skincare, lucide icons, dynamic mobile nav
5. Cross-platform scan feedback (audio beep + stronger vibration)
6. Add Frutiger Aero light theme + matte dark theme with toggle
7. Fix mobile vision API + mobile inventory scroll
8. Fix camera storage selector dark mode + redesign health score CTA
9. Fix AI recipe detail page returning Not Found
10. Multiple iterative UI polish commits (sidebar, inventory rows, recipe cards, buttons, logo, form inputs)
