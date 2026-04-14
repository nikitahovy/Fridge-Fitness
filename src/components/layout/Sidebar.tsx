"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Refrigerator,
  Zap,
  ChefHat,
  Plus,
  ShoppingCart,
  BarChart3,
  FlaskConical,
  Settings,
  UtensilsCrossed,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/inventory", label: "Inventory", icon: Refrigerator },
  { href: "/eat-first", label: "Eat First", icon: Zap },
  { href: "/recipes", label: "Recipes", icon: ChefHat },
  { href: "/meal-plan", label: "Meal Plan", icon: CalendarDays },
  { href: "/add-item", label: "Add", icon: Plus },
];

const ALL_MOBILE_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/inventory", label: "Inventory", icon: Refrigerator },
  { href: "/eat-first", label: "Eat First", icon: Zap },
  { href: "/recipes", label: "Recipes", icon: ChefHat },
  { href: "/add-item", label: "Add Item", icon: Plus },
  { href: "/health-score", label: "Health Score", icon: FlaskConical },
  { href: "/cart", label: "Instacart Lists", icon: ShoppingCart },
  { href: "/analytics", label: "Monthly +/−", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

const PINNED_MOBILE: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/inventory", label: "Inventory", icon: Refrigerator },
  { href: "/recipes", label: "Recipes", icon: ChefHat },
];

const RECENT_ROUTE_META: Record<string, { label: string; icon: LucideIcon }> = {
  "/eat-first":    { label: "Eat",      icon: Zap },
  "/add-item":     { label: "Add",      icon: Plus },
  "/cart":         { label: "Cart",     icon: ShoppingCart },
  "/health-score": { label: "Health",   icon: FlaskConical },
  "/analytics":    { label: "Stats",    icon: BarChart3 },
  "/settings":     { label: "Settings", icon: Settings },
};

const RECENT_STORAGE_KEY = "ff_recent_routes";

function useRecentRoutes(maxRecent = 2): string[] {
  const pathname = usePathname();
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setRecents(parsed.slice(0, maxRecent));
      }
    } catch {}
  }, [maxRecent]);

  useEffect(() => {
    if (!RECENT_ROUTE_META[pathname]) return;
    if (PINNED_MOBILE.some((p) => p.href === pathname)) return;
    setRecents((prev) => {
      if (prev[0] === pathname) return prev;
      const next = [pathname, ...prev.filter((r) => r !== pathname)].slice(0, maxRecent);
      try {
        localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [pathname, maxRecent]);

  return recents;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const touchStartY = useRef(0);
  const recents = useRecentRoutes(2);

  const openDrawer = useCallback(() => {
    setDrawerVisible(true);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => requestAnimationFrame(() => setDrawerOpen(true)));
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setTimeout(() => {
      setDrawerVisible(false);
      document.body.style.overflow = "";
    }, 300);
  }, []);

  useEffect(() => {
    if (drawerOpen) closeDrawer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleDrawerHandleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleDrawerHandleTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY > 50) closeDrawer();
  }, [closeDrawer]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  // Inactive nav link classes — text + border + hover, both themes
  const inactiveLink =
    "text-slate-800 dark:text-slate-300 border-white/40 dark:border-white/15 " +
    "hover:text-slate-950 dark:hover:text-slate-50 " +
    "hover:border-white/80 dark:hover:border-white/25 " +
    "hover:bg-white/60 dark:hover:bg-white/10 " +
    "font-medium";

  // Active pill — light has white→sky gradient, dark has matte neutral.
  // Drop shadow ONLY at the bottom (no inset top highlight).
  const activeLink =
    "bg-gradient-to-br from-white via-sky-50 to-sky-100/80 " +
    "dark:from-neutral-800 dark:via-neutral-800 dark:to-neutral-900 " +
    "text-slate-950 dark:text-neutral-50 font-bold " +
    "border-sky-300/70 dark:border-neutral-600/60 " +
    "shadow-[0_3px_10px_rgba(56,128,200,0.22),0_1px_3px_rgba(56,128,200,0.15)] " +
    "dark:shadow-[0_3px_10px_rgba(0,0,0,0.55),0_1px_3px_rgba(0,0,0,0.4)]";

  const navLink = (href: string, Icon: LucideIcon, label: string) => {
    const active = isActive(href);
    return (
      <Link key={href} href={href}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 border ${
          active ? activeLink : inactiveLink
        }`}>
        <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
        {label}
      </Link>
    );
  };

  return (
    <>
      {/* Desktop sidebar — frosted glass */}
      <aside className="hidden md:flex w-[240px] h-screen flex-col flex-shrink-0 backdrop-blur-2xl bg-slate-100/55 dark:bg-neutral-900/85 border-r border-white/70 dark:border-white/10 shadow-[1px_0_20px_rgba(31,87,184,0.08)] dark:shadow-[1px_0_20px_rgba(0,0,0,0.4)]">
        <div className="p-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-14 h-14 flex-shrink-0 overflow-hidden rounded-[16px] bg-black">
              <Image
                src="/logo.png"
                alt="Fridge Fitness"
                width={112}
                height={112}
                quality={100}
                className="w-14 h-14 object-contain"
              />
            </div>
            <div>
              <h1 className="text-[15px] font-extrabold text-slate-950 dark:text-slate-50 tracking-tight leading-tight">Fridge Fitness</h1>
              <p className="text-[10px] font-pixel text-slate-600 dark:text-slate-400">SAVE FOOD. EAT SMART.</p>
            </div>
          </Link>
        </div>
        <div className="mx-4 h-px bg-slate-300/50 dark:bg-white/10 mb-2" />
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto overscroll-contain min-h-0">
          {NAV_ITEMS.map((item) => navLink(item.href, item.icon, item.label))}
          <div className="py-3 px-2"><div className="h-px bg-slate-300/50 dark:bg-white/10" /></div>
          <p className="text-[9px] font-pixel uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500 px-3 pb-2">SHOPPING</p>
          {navLink("/cart", ShoppingCart, "Instacart Lists")}
          <a href="https://www.toogoodtogo.com" target="_blank" rel="noopener noreferrer"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 border ${inactiveLink}`}>
            <UtensilsCrossed className="w-5 h-5" strokeWidth={1.75} />
            Too Good To Go
          </a>
          <div className="py-3 px-2"><div className="h-px bg-slate-300/50 dark:bg-white/10" /></div>
          <p className="text-[9px] font-pixel uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500 px-3 pb-2">TOOLS</p>
          {navLink("/health-score", FlaskConical, "Health Score")}
          <div className="py-3 px-2"><div className="h-px bg-slate-300/50 dark:bg-white/10" /></div>
          <p className="text-[9px] font-pixel uppercase tracking-[0.2em] text-slate-500 dark:text-slate-500 px-3 pb-2">ANALYTICS</p>
          {navLink("/analytics", BarChart3, "Monthly +/−")}
          <div className="py-3 px-2"><div className="h-px bg-slate-300/50 dark:bg-white/10" /></div>
          {navLink("/settings", Settings, "Settings")}
        </nav>
        <div className="mx-3 mb-4 space-y-2">
          <button onClick={async () => {
            const { createClient } = await import("@/utils/supabase/client");
            await (createClient()).auth.signOut();
            window.location.href = "/login";
          }} className="w-full btn btn-danger text-[10px]">SIGN OUT</button>
        </div>
      </aside>

      {/* Mobile drawer overlay — animated */}
      {drawerVisible && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className={`absolute inset-0 bg-slate-900/30 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${drawerOpen ? "opacity-100" : "opacity-0"}`}
            onClick={closeDrawer}
          />

          <div
            className={`relative backdrop-blur-2xl bg-white/70 dark:bg-neutral-900/85 border-t border-white/80 dark:border-white/15 rounded-t-3xl max-h-[75vh] flex flex-col transition-transform duration-300 ease-out shadow-[0_-8px_32px_rgba(31,87,184,0.18)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.5)] ${
              drawerOpen ? "translate-y-0" : "translate-y-full"
            }`}
          >
            <div className="flex justify-center py-3 cursor-grab"
              onTouchStart={handleDrawerHandleTouchStart}
              onTouchEnd={handleDrawerHandleTouchEnd}>
              <div className="w-12 h-1.5 rounded-full bg-slate-400/60 dark:bg-white/30" />
            </div>

            <div className="flex items-center gap-3 px-5 pb-4">
              <div className="w-12 h-12 flex-shrink-0 overflow-hidden rounded-[14px] bg-black">
                <Image
                  src="/logo.png"
                  alt="Fridge Fitness"
                  width={96}
                  height={96}
                  quality={100}
                  className="w-12 h-12 object-contain"
                />
              </div>
              <div>
                <p className="text-[15px] font-extrabold text-slate-950 dark:text-slate-50 leading-tight">Fridge Fitness</p>
                <p className="font-pixel text-[9px] text-slate-600 dark:text-slate-400">SAVE FOOD. EAT SMART.</p>
              </div>
            </div>

            <div className="px-4 pb-4 space-y-1 overflow-y-auto flex-1 overscroll-contain">
              {ALL_MOBILE_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href} onClick={closeDrawer}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      active
                        ? "bg-white dark:bg-neutral-800 text-slate-950 dark:text-neutral-50 font-bold shadow-sm border border-sky-300/60 dark:border-neutral-600/60"
                        : "text-slate-700 dark:text-slate-300 border border-transparent"
                    }`}>
                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
              <a href="https://www.toogoodtogo.com" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-300">
                <UtensilsCrossed className="w-5 h-5" strokeWidth={1.75} />
                <span className="text-sm">Too Good To Go</span>
              </a>
            </div>

            <div className="px-4 pb-6 safe-bottom">
              <button onClick={async () => {
                const { createClient } = await import("@/utils/supabase/client");
                await (createClient()).auth.signOut();
                window.location.href = "/login";
              }} className="w-full btn btn-danger text-[10px]">SIGN OUT</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom bar — frosted glass */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        <div className="h-3 bg-gradient-to-t from-white/40 dark:from-neutral-900/40 to-transparent pointer-events-none" />

        <div className="bg-white/55 dark:bg-neutral-900/85 backdrop-blur-2xl border-t border-white/70 dark:border-white/10 shadow-[0_-4px_20px_rgba(31,87,184,0.1)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
          <div className="flex justify-center pt-1.5">
            <button onClick={openDrawer}
              className="flex items-center gap-1.5 px-4 py-1 rounded-full bg-white/60 dark:bg-neutral-800/80 border border-white/80 dark:border-white/15 active:bg-white/80 dark:active:bg-neutral-700/80 transition shadow-[inset_0_1px_0_rgba(255,255,255,1),0_1px_3px_rgba(31,87,184,0.1)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_1px_3px_rgba(0,0,0,0.4)]">
              <div className="w-6 h-0.5 rounded-full bg-slate-500/60 dark:bg-slate-400/60" />
              <span className="font-pixel text-[8px] text-slate-600 dark:text-slate-400 uppercase">Menu</span>
              <div className="w-6 h-0.5 rounded-full bg-slate-500/60 dark:bg-slate-400/60" />
            </button>
          </div>

          <div className="flex items-center py-1.5 px-2 safe-bottom gap-1">
            {PINNED_MOBILE.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all flex-1 min-w-[44px] ${active ? "text-slate-900 dark:text-neutral-100" : "text-slate-500 dark:text-slate-400"}`}>
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                  <span className={`text-[8px] font-pixel ${active ? "text-slate-900 dark:text-neutral-100" : "text-slate-500 dark:text-slate-400"}`}>{item.label}</span>
                  {active && <div className="w-1 h-1 rounded-full bg-slate-900 dark:bg-neutral-200" />}
                </Link>
              );
            })}

            {recents.length > 0 && <div className="w-px h-8 bg-slate-400/40 dark:bg-white/15 mx-1" />}

            {recents.map((href) => {
              const meta = RECENT_ROUTE_META[href];
              if (!meta) return null;
              const active = isActive(href);
              const Icon = meta.icon;
              return (
                <Link key={href} href={href}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all flex-1 min-w-[44px] ${active ? "text-slate-900 dark:text-neutral-100" : "text-slate-500 dark:text-slate-400"}`}>
                  <Icon className="w-5 h-5" strokeWidth={1.75} />
                  <span className={`text-[8px] font-pixel ${active ? "text-slate-900 dark:text-neutral-100" : "text-slate-500 dark:text-slate-400"}`}>{meta.label}</span>
                  {active && <div className="w-1 h-1 rounded-full bg-slate-900 dark:bg-neutral-200" />}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
