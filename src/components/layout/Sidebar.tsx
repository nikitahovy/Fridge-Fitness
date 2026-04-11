"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/inventory", label: "Inventory", icon: "🧊" },
  { href: "/eat-first", label: "Eat First", icon: "⚡" },
  { href: "/recipes", label: "Recipes", icon: "🍳" },
  { href: "/add-item", label: "Add", icon: "➕" },
  { href: "/cart", label: "Cart", icon: "🛒" },
  { href: "/analytics", label: "Monthly", icon: "📊" },
];

const MOBILE_BAR = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/inventory", label: "Inventory", icon: "🧊" },
  { href: "/eat-first", label: "Eat", icon: "⚡" },
  { href: "/add-item", label: "Add", icon: "➕" },
  { href: "/recipes", label: "Recipes", icon: "🍳" },
];

const ALL_MOBILE_ITEMS = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/inventory", label: "Inventory", icon: "🧊" },
  { href: "/eat-first", label: "Eat First", icon: "⚡" },
  { href: "/recipes", label: "Recipes", icon: "🍳" },
  { href: "/add-item", label: "Add Item", icon: "➕" },
  { href: "/health-score", label: "Health Score", icon: "🔬" },
  { href: "/cart", label: "Instacart Lists", icon: "🛒" },
  { href: "/analytics", label: "Monthly +/−", icon: "📊" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false); // for animation
  const touchStartY = useRef(0);

  const openDrawer = useCallback(() => {
    setDrawerVisible(true);
    document.body.style.overflow = "hidden";
    // Tiny delay for CSS transition to kick in
    requestAnimationFrame(() => requestAnimationFrame(() => setDrawerOpen(true)));
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    // Wait for close animation then unmount
    setTimeout(() => {
      setDrawerVisible(false);
      document.body.style.overflow = "";
    }, 300);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    if (drawerOpen) closeDrawer();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Drawer handle swipe down to close
  const handleDrawerHandleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleDrawerHandleTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY > 50) closeDrawer(); // swipe down
  }, [closeDrawer]);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const navLink = (href: string, icon: string, label: string) => (
    <Link key={href} href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 border ${
        isActive(href) ? "bg-white text-black font-bold border-white/80"
        : "text-[#999] border-white/[0.08] hover:text-white hover:border-white/25 hover:bg-white/[0.04] font-medium"
      }`}>
      <span className="text-base">{icon}</span>
      {label}
    </Link>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-[240px] min-h-screen bg-sidebar-bg border-r border-card-border flex-col flex-shrink-0">
        <div className="p-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[14px] overflow-hidden flex-shrink-0 ring-1 ring-white/20">
              <Image src="/logo.png" alt="Fridge Fitness" width={44} height={44} className="w-11 h-11 object-contain" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">Fridge Fitness</h1>
              <p className="text-[10px] font-pixel text-[#666]">SAVE FOOD. EAT SMART.</p>
            </div>
          </Link>
        </div>
        <div className="mx-4 h-px bg-white/[0.08] mb-2" />
        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.slice(0, 5).map((item) => navLink(item.href, item.icon, item.label))}
          <div className="py-3 px-2"><div className="h-px bg-white/[0.08]" /></div>
          <p className="text-[9px] font-pixel uppercase tracking-[0.2em] text-[#555] px-3 pb-2">SHOPPING</p>
          {navLink("/cart", "🛒", "Instacart Lists")}
          <a href="https://www.toogoodtogo.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 border text-[#999] border-white/[0.08] hover:text-white hover:border-white/25 hover:bg-white/[0.04] font-medium">
            <span className="text-base">🥡</span>Too Good To Go
          </a>
          <div className="py-3 px-2"><div className="h-px bg-white/[0.08]" /></div>
          <p className="text-[9px] font-pixel uppercase tracking-[0.2em] text-[#555] px-3 pb-2">TOOLS</p>
          {navLink("/health-score", "🔬", "Health Score")}
          <div className="py-3 px-2"><div className="h-px bg-white/[0.08]" /></div>
          <p className="text-[9px] font-pixel uppercase tracking-[0.2em] text-[#555] px-3 pb-2">ANALYTICS</p>
          {navLink("/analytics", "📊", "Monthly +/−")}
          <div className="py-3 px-2"><div className="h-px bg-white/[0.08]" /></div>
          {navLink("/settings", "⚙️", "Settings")}
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
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${drawerOpen ? "opacity-100" : "opacity-0"}`}
            onClick={closeDrawer}
          />

          {/* Drawer — slides up */}
          <div
            className={`relative bg-[#0a0a0e] border-t border-white/[0.08] rounded-t-3xl max-h-[75vh] flex flex-col transition-transform duration-300 ease-out ${
              drawerOpen ? "translate-y-0" : "translate-y-full"
            }`}
          >
            {/* Drag handle — swipe down to close */}
            <div className="flex justify-center py-3 cursor-grab"
              onTouchStart={handleDrawerHandleTouchStart}
              onTouchEnd={handleDrawerHandleTouchEnd}>
              <div className="w-12 h-1.5 rounded-full bg-white/30" />
            </div>

            {/* Logo */}
            <div className="flex items-center gap-3 px-5 pb-4">
              <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-white/20">
                <Image src="/logo.png" alt="Fridge Fitness" width={36} height={36} className="w-9 h-9 object-contain" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Fridge Fitness</p>
                <p className="font-pixel text-[9px] text-[#666]">SAVE FOOD. EAT SMART.</p>
              </div>
            </div>

            {/* Nav items — scrollable */}
            <div className="px-4 pb-4 space-y-1 overflow-y-auto flex-1 overscroll-contain">
              {ALL_MOBILE_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} onClick={closeDrawer}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive(item.href) ? "bg-white text-black font-bold" : "text-[#999]"
                  }`}>
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                </Link>
              ))}
              <a href="https://www.toogoodtogo.com" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#999]">
                <span className="text-lg">🥡</span>
                <span className="text-sm">Too Good To Go</span>
              </a>
            </div>

            {/* Sign out */}
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

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        <div className="h-3 bg-gradient-to-t from-[#0a0a0e] to-transparent pointer-events-none" />

        <div className="bg-[#0a0a0e]/95 backdrop-blur-lg border-t border-white/[0.08]">
          {/* Menu button — simple tap, no swipe */}
          <div className="flex justify-center pt-1.5">
            <button onClick={openDrawer}
              className="flex items-center gap-1.5 px-4 py-1 rounded-full bg-white/[0.08] border border-white/[0.12] active:bg-white/[0.15] transition">
              <div className="w-6 h-0.5 rounded-full bg-white/40" />
              <span className="font-pixel text-[8px] text-white/40 uppercase">Menu</span>
              <div className="w-6 h-0.5 rounded-full bg-white/40" />
            </button>
          </div>

          <div className="flex justify-around items-center py-1.5 px-1 safe-bottom">
            {MOBILE_BAR.map((item) => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all min-w-[44px] ${active ? "text-white" : "text-[#555]"}`}>
                  <span className="text-lg">{item.icon}</span>
                  <span className={`text-[8px] font-pixel ${active ? "text-white" : "text-[#555]"}`}>{item.label}</span>
                  {active && <div className="w-1 h-1 rounded-full bg-white" />}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </>
  );
}
