"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme";

/**
 * ThemeToggle — a glass pill segmented control with sun + moon icons.
 * The active side has a glossy white pill behind it.
 */
export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-full glass-btn" role="radiogroup" aria-label="Theme">
      <button
        type="button"
        role="radio"
        aria-checked={!isDark}
        onClick={() => setTheme("light")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-pixel text-[10px] uppercase tracking-wider transition-all ${
          !isDark
            ? "bg-white text-slate-900 font-bold shadow-[inset_0_1px_0_rgba(255,255,255,1),0_2px_6px_rgba(31,87,184,0.18)]"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        }`}
      >
        <Sun className="w-3.5 h-3.5" strokeWidth={2} />
        Light
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={isDark}
        onClick={() => setTheme("dark")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-pixel text-[10px] uppercase tracking-wider transition-all ${
          isDark
            ? "bg-slate-800 text-white font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_2px_6px_rgba(0,0,0,0.4)]"
            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        }`}
      >
        <Moon className="w-3.5 h-3.5" strokeWidth={2} />
        Dark
      </button>
    </div>
  );
}
