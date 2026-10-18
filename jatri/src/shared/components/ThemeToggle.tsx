"use client";

import { useState, useRef, useEffect } from "react";
import { Sun, Moon, Laptop, ChevronDown, Check } from "lucide-react";
import { useTheme, Theme } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

export default function ThemeToggle({
  variant = "pill",
  className = "",
}: {
  variant?: "pill" | "footer" | "icon";
  className?: string;
}) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const THEME_OPTIONS: { id: Theme; label: string; icon: typeof Sun }[] = [
    { id: "system", label: "Auto (Device)", icon: Laptop },
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
  ];

  const currentOption = THEME_OPTIONS.find((t) => t.id === theme) || THEME_OPTIONS[0];
  const CurrentIcon =
    theme === "system"
      ? resolvedTheme === "dark"
        ? Moon
        : Sun
      : currentOption.icon;

  if (variant === "footer") {
    return (
      <div className={`inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 ${className}`}>
        {THEME_OPTIONS.map((opt) => {
          const isSelected = opt.id === theme;
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition active:scale-95 ${
                isSelected
                  ? "bg-white text-zinc-950 shadow-xs"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
              title={opt.label}
            >
              <Icon size={12} strokeWidth={2.5} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-100 text-xs font-bold transition-all shadow-xs active:scale-95"
        title="Toggle Theme (Device Auto / Light / Dark)"
        aria-expanded={open}
      >
        <CurrentIcon size={13} className="text-zinc-500 dark:text-zinc-400 shrink-0" strokeWidth={2.5} />
        <span className="font-semibold">{currentOption.label}</span>
        <ChevronDown
          size={12}
          className={`text-zinc-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-44 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden z-50 p-1.5"
          >
            <div className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Appearance
            </div>
            {THEME_OPTIONS.map((opt) => {
              const isSelected = opt.id === theme;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTheme(opt.id);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
                    isSelected
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-950 dark:text-white font-black"
                      : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={14} className={isSelected ? "text-emerald-500" : "text-zinc-400"} />
                    <span>{opt.label}</span>
                  </div>
                  {isSelected && <Check size={14} className="text-emerald-500 shrink-0" strokeWidth={3} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
