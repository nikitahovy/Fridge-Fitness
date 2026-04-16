"use client";

import { useState } from "react";
import { Camera, Zap, ChefHat, Sparkles } from "lucide-react";
import FridgeMascot from "@/components/mascot/FridgeMascot";

const STEPS = [
  {
    icon: null, // mascot
    title: "Welcome to Fridge Fitness",
    description: "Your smart kitchen companion that helps you save food, eat better, and waste less money.",
    color: "text-slate-600 dark:text-slate-300",
  },
  {
    icon: Camera,
    title: "Add Your Food",
    description: "Snap a photo of your groceries, scan a receipt, use a barcode, or add items manually. We handle the rest.",
    color: "text-sky-500",
  },
  {
    icon: Zap,
    title: "We Track Freshness",
    description: "See what's expiring first, get freeze nudge alerts before food goes bad, and track how much money you save.",
    color: "text-amber-500",
  },
  {
    icon: ChefHat,
    title: "AI Recipes & Meal Plans",
    description: "Get recipe suggestions that prioritize your expiring ingredients. Generate a full weekly meal plan with one tap.",
    color: "text-emerald-500",
  },
];

export default function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function next() {
    if (isLast) {
      localStorage.setItem("ff_onboarded", "true");
      onComplete();
    } else {
      setStep(step + 1);
    }
  }

  function skip() {
    localStorage.setItem("ff_onboarded", "true");
    onComplete();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={skip} />

      <div className="relative glass rounded-3xl p-6 md:p-10 max-w-md w-full text-center shadow-2xl">
        {/* Illustration */}
        <div className="mb-6">
          {step === 0 ? (
            <div className={current.color}>
              <FridgeMascot size={64} waving />
            </div>
          ) : (
            <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center bg-card border border-card-border ${current.color}`}>
              {current.icon && <current.icon className="w-8 h-8" strokeWidth={1.5} />}
            </div>
          )}
        </div>

        {/* Content */}
        <h3 className="text-display text-2xl md:text-3xl mb-3">{current.title}</h3>
        <p className="text-sm text-muted mb-8 max-w-sm mx-auto leading-relaxed">{current.description}</p>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === step ? "bg-sky-500 w-6" : i < step ? "bg-sky-500/40" : "bg-slate-300 dark:bg-slate-600"
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button onClick={skip} className="btn flex-1 !text-[10px]">
            SKIP
          </button>
          <button onClick={next} className="btn btn-primary flex-1 !text-[10px]">
            {isLast ? "GET STARTED" : "NEXT"}
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          <Sparkles className="w-3 h-3 text-muted" />
          <span className="font-pixel text-[8px] text-muted uppercase">{step + 1} of {STEPS.length}</span>
        </div>
      </div>
    </div>
  );
}
