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
      <div className={`inline-flex items-center gap-1 bg-[#0D3027]/70 dark:bg-[#1E2B23]/70 border border-[#426457]/80 dark:border-[#34443A] rounded-[8px] p-1 ${className}`}>
        {THEME_OPTIONS.map((opt) => {
          const isSelected = opt.id === theme;
          const Icon = opt.icon;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-semibold transition active:scale-95 ${
                isSelected
                  ? "bg-[#123D32] dark:bg-[#28664D] text-[#F7F1E5] dark:text-[#F3F1E8] shadow-2xs font-bold"
                  : "text-[#C4D2C8] dark:text-[#B8C2B8] hover:text-[#F7F1E5] dark:hover:text-[#F3F1E8] hover:bg-[#123D32]/50 dark:hover:bg-[#17211B]"
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
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-stone-200/90 dark:border-[#34443A] hover:border-stone-300 dark:hover:border-[#426457] bg-white/95 dark:bg-[#17211B] hover:bg-white dark:hover:bg-[#1E2B23] text-stone-800 dark:text-[#F3F1E8] text-xs font-bold transition-all shadow-xs active:scale-95"
        title="Toggle Theme (Device Auto / Light / Dark)"
        aria-expanded={open}
      >
        <CurrentIcon size={13} className="text-stone-500 dark:text-[#B8C2B8] shrink-0" strokeWidth={2.5} />
        <span className="font-semibold">{currentOption.label}</span>
        <ChevronDown
          size={12}
          className={`text-stone-400 dark:text-[#929D93] shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-44 rounded-[12px] bg-white dark:bg-[#17211B] border border-zinc-200 dark:border-[#34443A] shadow-xl overflow-hidden z-50 p-1.5"
          >
            <div className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-[#929D93]">
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
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-xs font-bold transition text-left ${
                    isSelected
                      ? "bg-zinc-100 dark:bg-[#1E2B23] text-zinc-950 dark:text-[#F3F1E8] font-black"
                      : "text-zinc-600 dark:text-[#B8C2B8] hover:bg-zinc-50 dark:hover:bg-[#1E2B23]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={14} className={isSelected ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400 dark:text-[#929D93]"} />
                    <span>{opt.label}</span>
                  </div>
                  {isSelected && <Check size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" strokeWidth={3} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
