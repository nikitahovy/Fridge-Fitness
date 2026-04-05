"use client";

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

const MOBILE_ITEMS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/inventory", label: "Inventory", icon: "🧊" },
  { href: "/eat-first", label: "Eat First", icon: "⚡" },
  { href: "/recipes", label: "Recipes", icon: "🍳" },
  { href: "/add-item", label: "Add", icon: "➕" },
  { href: "/analytics", label: "Stats", icon: "📊" },
];

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const navLink = (href: string, icon: string, label: string) => (
    <Link
      key={href}
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 border ${
        isActive(href)
          ? "bg-white text-black font-bold border-white/80"
          : "text-[#999] border-white/[0.08] hover:text-white hover:border-white/25 hover:bg-white/[0.04] font-medium"
      }`}
    >
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
            <div className="w-11 h-11 rounded-[14px] overflow-hidden flex-shrink-0">
              <Image src="/logo.png" alt="Fridge Fitness" width={44} height={44} className="w-11 h-11 object-cover scale-110" />
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

          <a
            href="https://www.toogoodtogo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150 border text-[#999] border-white/[0.08] hover:text-white hover:border-white/25 hover:bg-white/[0.04] font-medium"
          >
            <span className="text-base">🥡</span>
            Too Good To Go
          </a>

          <div className="py-3 px-2"><div className="h-px bg-white/[0.08]" /></div>

          <p className="text-[9px] font-pixel uppercase tracking-[0.2em] text-[#555] px-3 pb-2">ANALYTICS</p>
          {navLink("/analytics", "📊", "Monthly +/−")}

          <div className="py-3 px-2"><div className="h-px bg-white/[0.08]" /></div>

          {navLink("/settings", "⚙️", "Settings")}
        </nav>

        <div className="mx-3 mb-4 space-y-2">
          <button
            onClick={async () => {
              const { createClient } = await import("@/utils/supabase/client");
              const supabase = createClient();
              await supabase.auth.signOut();
              window.location.href = "/login";
            }}
            className="w-full btn btn-danger text-[10px]"
          >
            SIGN OUT
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0e]/95 backdrop-blur-lg border-t border-card-border">
        <div className="flex justify-around items-center py-2 px-1 safe-bottom">
          {MOBILE_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-w-[44px] ${active ? "text-white" : "text-[#555]"}`}>
                <span className="text-lg">{item.icon}</span>
                <span className={`text-[9px] font-pixel ${active ? "text-white" : "text-[#555]"}`}>{item.label}</span>
                {active && <div className="w-1 h-1 rounded-full bg-white mt-0.5" />}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
