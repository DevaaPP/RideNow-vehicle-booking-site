"use client";

import { useEffect, useState, useCallback } from "react";
import { Palette, X, RotateCcw, Check } from "lucide-react";

interface ColorPreset {
  name: string;
  primary: string;
  navBg: string;
  textColor: string;
  accent: string;
}

const PRESETS: ColorPreset[] = [
  {
    name: "Uber Pure Black",
    primary: "#000000",
    navBg: "#000000",
    textColor: "#ffffff",
    accent: "#ffffff",
  },
  {
    name: "Rapido Tactical Yellow",
    primary: "#F59E0B",
    navBg: "#111827",
    textColor: "#000000",
    accent: "#FBBF24",
  },
  {
    name: "Electric Blue",
    primary: "#2563EB",
    navBg: "#0F172A",
    textColor: "#ffffff",
    accent: "#38BDF8",
  },
  {
    name: "Emerald Mobility",
    primary: "#059669",
    navBg: "#064E3B",
    textColor: "#ffffff",
    accent: "#34D399",
  },
  {
    name: "Dark Tech Charcoal",
    primary: "#18181B",
    navBg: "#09090B",
    textColor: "#ffffff",
    accent: "#E4E4E7",
  },
  {
    name: "Crimson Velocity",
    primary: "#DC2626",
    navBg: "#450A0A",
    textColor: "#ffffff",
    accent: "#F87171",
  },
];

export default function ThemeTesterColorWheel() {
  const [open, setOpen] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [navColor, setNavColor] = useState("#000000");
  const [activePreset, setActivePreset] = useState("Uber Pure Black");

  const applyTheme = useCallback((primary: string, nav: string, name?: string) => {
    setCurrentColor(primary);
    setNavColor(nav);
    if (name) setActivePreset(name);

    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty("--theme-primary", primary);
      document.documentElement.style.setProperty("--theme-nav-bg", nav);
    }

    try {
      localStorage.setItem(
        "ridenow_test_theme",
        JSON.stringify({ primary, navBg: nav, name: name || "Custom" })
      );
    } catch {}
  }, []);

  // Load persisted theme on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem("ridenow_test_theme");
        if (saved) {
          const parsed = JSON.parse(saved);
          applyTheme(parsed.primary, parsed.navBg, parsed.name);
        }
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, [applyTheme]);

  const handleCustomPrimary = (color: string) => {
    applyTheme(color, navColor, "Custom");
  };

  const handleCustomNav = (color: string) => {
    applyTheme(currentColor, color, "Custom");
  };

  const handleReset = () => {
    applyTheme("#000000", "#000000", "Uber Pure Black");
  };

  return (
    <aside aria-label="Theme Customizer" className="fixed bottom-6 right-6 z-50">
      {/* FLOATING TRIGGER BUTTON */}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 bg-black text-white hover:bg-zinc-800 rounded-full shadow-2xl border-2 border-white/20 active:scale-95 transition-all text-xs font-black cursor-pointer group"
          title="Open Theme Tester (For Testing Only)"
        >
          <div className="w-5 h-5 rounded-full border border-white/40 flex items-center justify-center p-0.5" style={{ backgroundColor: currentColor }}>
            <Palette size={13} className="text-white mix-blend-difference" />
          </div>
          <span>Theme Wheel</span>
        </button>
      ) : (
        /* FLOATING COLOR WHEEL PANEL */
        <div className="w-[320px] sm:w-[350px] bg-white text-zinc-950 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] border border-zinc-300 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
            <div className="flex items-center gap-2">
              <Palette size={18} className="text-zinc-900" />
              <h4 className="text-sm font-black text-zinc-950">Theme Color Wheel</h4>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                className="p-1.5 text-zinc-500 hover:text-black rounded-lg hover:bg-zinc-100 transition"
                title="Reset to Default Black"
              >
                <RotateCcw size={15} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 text-zinc-500 hover:text-black rounded-lg hover:bg-zinc-100 transition"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          <p className="text-[11px] text-zinc-500 font-semibold leading-relaxed">
            Test and preview different maxed-out color schemes across the navbar, buttons, and accents.
          </p>

          {/* PRESETS LIST */}
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase font-black tracking-wider text-zinc-400">
              Presets
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS.map((p) => {
                const isActive = activePreset === p.name;
                return (
                  <button
                    key={p.name}
                    onClick={() => applyTheme(p.primary, p.navBg, p.name)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold text-left transition active:scale-95 ${
                      isActive
                        ? "border-black bg-zinc-100 text-black shadow-xs"
                        : "border-zinc-200 hover:border-zinc-300 text-zinc-700"
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 flex-shrink-0"
                      style={{ backgroundColor: p.primary }}
                    />
                    <span className="truncate text-[11px]">{p.name.split(" ")[0]}</span>
                    {isActive && <Check size={12} className="ml-auto text-black flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CUSTOM COLOR WHEEL / PICKERS */}
          <div className="pt-2 border-t border-zinc-200 space-y-3">
            <p className="text-[10px] uppercase font-black tracking-wider text-zinc-400">
              Custom Wheel Pickers
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-800">Primary Button / Accent</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => handleCustomPrimary(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="text-xs font-mono font-bold uppercase text-zinc-600">
                  {currentColor}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-800">Navbar Background</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={navColor}
                  onChange={(e) => handleCustomNav(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="text-xs font-mono font-bold uppercase text-zinc-600">
                  {navColor}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-100 flex justify-between items-center text-[10px] text-zinc-400">
            <span>Testing Tool Only</span>
            <button
              onClick={handleReset}
              className="font-bold underline text-zinc-600 hover:text-black"
            >
              Default (Black)
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
