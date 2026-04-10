# Fridge Fitness — Progress Report #1

## What We Built

Fridge Fitness is a food waste reduction + nutrition app that helps users track what's in their kitchen, eat food before it spoils, and make smarter grocery decisions. Built with Next.js 16, Supabase, and a dark liquid-glass UI.

**Live at:** [fridge-fitness-7pfr.vercel.app](https://fridge-fitness-7pfr.vercel.app)

---

## Core Features

### Inventory Management
- Add items via **AI camera detection** (Groq Llama 4 Vision), **barcode scanner** (native BarcodeDetector API), **manual entry**, or **QR code phone-to-desktop upload**
- Each item tracks: name, category, location (fridge/freezer/pantry), quantity, purchase price, expiry date
- **90+ shelf-life rules** with fuzzy name matching — estimates expiry from category defaults when no date provided
- Actions: Mark eaten, freeze, thaw, toss, edit, delete
- Color-coded risk gradients: red (use today), yellow (this week), green (safe), blue (frozen)

### Eat-First Queue
- Prioritized list of what to eat next based on spoilage risk, dollar value, and nutrition fit
- Stats cards: At Risk, In Stock, Saved, Wasted — all from real user data
- Each item shows risk score, days remaining, and action buttons

### Recipe System
- 10 seed recipes scored against your actual inventory
- **AI recipe generation** via Groq — sends your inventory + expiry urgency, gets back 8-12 tailored recipes
- Scoring engine: 30% at-risk coverage, 25% macro match, 15% waste rescue value, 10% inventory coverage, 10% preference, -10% prep friction
- Recipe detail page with ingredients (in-stock/missing/expiring badges), step-by-step instructions, "Cook Now" button that marks ingredients as consumed

### Health Score Scanner (Yuka-style)
- Scan any product barcode for a **0-100 health score**
- Supports both **food/beverages** and **skincare/cosmetics**
- **307 food additives** in database (E100-E1521) with risk levels and concern descriptions
- **40+ skincare ingredient** risk database (parabens, SLS, phthalates, etc.)
- Scoring: nutrition quality + additive penalties + organic bonus
- Heavy penalties for harmful additives — score capped at 50/40/25/20/15 based on high-risk count
- Per-serving / total toggle for nutrition display
- Traffic light indicators for sugar, salt, saturated fat, calories
- "Add to Inventory" from results

### Shopping & External Links
- **Instacart Lists** — create shopping carts, quick-create from recipes with missing ingredients, check off items
- **Too Good To Go** — external link to reduce food waste
- **Monthly +/- Analytics** — saved vs wasted by month (bar chart), all-time totals, category breakdown, items lost detail

### Barcode Scanner
- **Native BarcodeDetector API** on dedicated `/scan` page — no npm library crashes
- Fallback to Groq Vision for older browsers
- Vibrates on detection, auto-redirects with barcode
- Separate scanner for health score (`/health-scan`) with green theme
- Manual number entry fallback

---

## Authentication & Database

### Supabase Auth
- Email/password signup and login
- Forgot password flow (email reset link)
- Auto-profile creation on signup (trigger function)
- Session refresh via middleware
- Sign out from sidebar

### Supabase Postgres (with RLS)
- `profiles` — display name, household size, fitness goal, dietary preferences
- `inventory_items` — all food items per user
- `shopping_carts` + `cart_items` — shopping lists per user
- `food_events` — consumed/discarded tracking for analytics
- `recovery_state` — WHOOP preset per user (coming soon feature)
- Row Level Security on every table — users only see their own data

### Settings Page
- Edit display name, household size (1-6)
- Fitness goal: maintenance, muscle gain, fat loss, endurance
- Dietary preferences: 10 toggleable options (vegetarian, vegan, keto, etc.)

---

## Security

- **Zod input validation** on all API routes
- **HTML tag stripping** + control character sanitization on all string inputs
- **Whitelist-only PATCH** for inventory (prevents prototype pollution)
- **Security headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Body size limits**: 1MB general, 8MB for image routes
- **CORS**: same-origin for API, cross-origin for upload routes
- **File upload validation**: JPEG/PNG/WebP only, max 5MB
- **UUID validation** on all dynamic route params
- **Try-catch** on every route handler — no stack traces leaked

---

## UI/UX

### Design System
- Dark theme with **liquid glass** panels (backdrop-blur, gradient fills, inset highlights)
- **Space Mono** pixel font for labels and stats
- **Bold display typography** (900 weight, -0.04em tracking) for numbers and headings
- Color-coded action buttons: green (eaten), blue (freeze), red (toss) with thin outlines
- White outline `btn` system with hover glow
- Hover: white border glow on all cards

### Mobile
- Bottom nav bar with 5 main icons
- **Pull-up drawer** (tap "Menu" button) showing all nav items + sign out
- Floating camera button on dashboard
- Responsive grids (2-col on mobile, 4-col on desktop)
- Stacked card layouts for inventory and eat-first

### Onboarding
- Empty dashboard shows welcome screen with scan/manual/settings cards
- "How it works" 1-2-3 explainer
- Empty expiring section shows "Add items" prompt
- Loading skeletons on all pages

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Database | Supabase Postgres + RLS |
| Auth | Supabase Auth (email/password) |
| AI Vision | Groq (Llama 4 Scout) — food detection from photos |
| AI Recipes | Groq (Llama 4 Scout) — recipe generation from inventory |
| Food Data | Open Food Facts API (free, no key) |
| Cosmetic Data | Open Beauty Facts API (free, no key) |
| Barcode | Native BarcodeDetector API + Groq fallback |
| Validation | Zod |
| Hosting | Vercel |
| Fonts | Inter + Space Mono (Google Fonts) |

---

## What's Next (Planned)

- [ ] WHOOP / wearable integration (currently "Coming Soon" banner)
- [ ] Meal planner — weekly calendar with recipe scheduling
- [ ] Push notifications for expiring items
- [ ] Household sharing — invite family to shared inventory
- [ ] Kroger API for real store pricing
- [ ] Rate limiting via Redis (removed in-memory version, needs DB-backed)
- [ ] PWA support for mobile install

---

## Commits Summary

~40 commits covering:
1. Initial scaffold + data layer + API routes
2. Full UI with dark theme, liquid glass, pixel typography
3. QR code phone-to-desktop upload flow
4. All buttons functional (eaten/freeze/toss/edit/delete)
5. Instacart lists + Too Good To Go
6. Monthly analytics
7. Security hardening (Zod, CSP, sanitization)
8. Groq AI vision for food detection
9. AI recipe generation
10. Supabase auth + database migration
11. Onboarding, settings, forgot password
12. Barcode scanner (native API)
13. Health score scanner (food + skincare, 307 additives)
14. Mobile responsive + pull-up drawer
15. Expanded shelf-life rules (90+ items)
16. Per-serving/total nutrition toggle
