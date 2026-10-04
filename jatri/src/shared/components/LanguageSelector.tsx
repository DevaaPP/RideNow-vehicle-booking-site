"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useTranslation, SUPPORTED_LANGUAGES, Language } from "@/context/LanguageContext";

export default function LanguageSelector({
  variant = "pill",
  className = "",
}: {
  variant?: "pill" | "minimal" | "footer";
  className?: string;
}) {
  const { language, setLanguage } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentOption =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setOpen(false);
  };

  if (variant === "footer") {
    return (
      <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
        <div className="flex items-center gap-2 flex-wrap">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-all font-medium ${
                  isSelected
                    ? "bg-zinc-800 text-white font-bold"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                }`}
              >
                {lang.nativeName}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-bold transition-all shadow-xs active:scale-95"
        title="Change Language"
      >
        <Globe size={14} className="text-zinc-500" />
        <span className="font-semibold">{currentOption.nativeName}</span>
        <ChevronDown size={12} className={`text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-white shadow-xl border border-zinc-200/90 py-1.5 z-[9999] focus:outline-none animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-400 border-b border-zinc-100 mb-1">
            Select Language
          </div>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelect(lang.code)}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                  isSelected
                    ? "bg-zinc-100 font-bold text-zinc-900"
                    : "text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{lang.nativeName}</span>
                  <span className="text-[11px] text-zinc-400">({lang.name})</span>
                </div>
                {isSelected && <Check size={14} className="text-zinc-900" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
