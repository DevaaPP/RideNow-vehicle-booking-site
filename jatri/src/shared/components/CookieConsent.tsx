"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, ChevronDown, ChevronUp, Check, X, SlidersHorizontal, Lock } from "lucide-react";
import Link from "next/link";

const STORAGE_KEY = "ridenow_cookie_consent_v1";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
}

export default function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        // Show after small delay so initial page paint is uninterrupted
        const timer = setTimeout(() => {
          setMounted(true);
          setVisible(true);
        }, 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // localStorage disabled or private browsing fallback
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore storage error
    }
    setVisible(false);
  };

  const handleAcceptAll = () => {
    savePreferences({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now(),
    });
  };

  const handleRejectNonEssential = () => {
    savePreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
    });
  };

  const handleSaveCustom = () => {
    savePreferences({
      necessary: true,
      analytics,
      marketing,
      timestamp: Date.now(),
    });
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-[420px] z-[9999] isolate"
          role="dialog"
          aria-live="polite"
          aria-label="Cookie consent banner"
        >
          <div className="bg-white/95 backdrop-blur-md border border-zinc-200/90 rounded-2xl shadow-2xl p-4 sm:p-5 text-zinc-900 flex flex-col gap-3.5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-zinc-950 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
                  <Cookie size={18} className="text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black tracking-tight text-zinc-950">Cookie Preferences</h3>
                    <span className="px-1.5 py-0.2 rounded-none bg-zinc-100 border border-zinc-200 text-[9px] font-black uppercase text-zinc-600">
                      Privacy
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 font-medium">Bharat Mobility & Data Choice</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRejectNonEssential}
                className="w-7 h-7 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 flex items-center justify-center transition cursor-pointer"
                aria-label="Dismiss cookie notice with essential cookies only"
              >
                <X size={15} />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-zinc-600 leading-relaxed font-normal">
              RideNow uses cookies and secure local storage to remember your pickup points, calculate verified route fares, maintain session safety, and optimize dispatch times.
            </p>

            {/* Granular Preferences Accordion */}
            <AnimatePresence>
              {showPreferences && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-2.5 pt-2 border-t border-zinc-100 overflow-hidden"
                >
                  {/* Necessary Category */}
                  <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-200/80 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <Lock size={12} className="text-zinc-700" />
                        <span className="text-xs font-bold text-zinc-900">Strictly Necessary</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">
                        Essential for booking checkout, GPS coordinate tracking, authentication, and secure payment processing.
                      </p>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md flex-shrink-0">
                      Always Active
                    </span>
                  </div>

                  {/* Analytics Category */}
                  <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-200/80 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <span className="text-xs font-bold text-zinc-900 block">Performance & Telemetry</span>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">
                        Helps measure map route rendering speed, error logs, and driver dispatch latency to improve ride quality.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAnalytics(!analytics)}
                      className={`w-9 h-5 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                        analytics ? "bg-zinc-950 justify-end" : "bg-zinc-300 justify-start"
                      }`}
                      role="switch"
                      aria-checked={analytics}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                    </button>
                  </div>

                  {/* Personalization Category */}
                  <div className="p-2.5 bg-zinc-50 rounded-xl border border-zinc-200/80 flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <span className="text-xs font-bold text-zinc-900 block">Personalization & Spots</span>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-snug">
                        Saves favorite places, recent pickup history, and language preferences across sessions.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMarketing(!marketing)}
                      className={`w-9 h-5 rounded-full transition-colors flex items-center p-0.5 cursor-pointer ${
                        marketing ? "bg-zinc-950 justify-end" : "bg-zinc-300 justify-start"
                      }`}
                      role="switch"
                      aria-checked={marketing}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-xs" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Toggle Customize */}
            <div className="flex items-center justify-between text-[11px] pt-1">
              <button
                type="button"
                onClick={() => setShowPreferences(!showPreferences)}
                className="inline-flex items-center gap-1 font-bold text-zinc-600 hover:text-zinc-950 transition cursor-pointer"
              >
                <SlidersHorizontal size={12} />
                <span>{showPreferences ? "Hide Options" : "Customize Settings"}</span>
                {showPreferences ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              <Link
                href="/privacy"
                className="text-zinc-400 hover:text-zinc-800 underline transition"
              >
                Privacy Policy
              </Link>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {showPreferences ? (
                <>
                  <button
                    type="button"
                    onClick={handleRejectNonEssential}
                    className="py-2.5 px-3 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 text-xs font-bold transition active:scale-98 cursor-pointer text-center"
                  >
                    Essential Only
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCustom}
                    className="py-2.5 px-3 rounded-xl bg-zinc-950 hover:bg-black text-white text-xs font-black transition active:scale-98 shadow-sm cursor-pointer text-center flex items-center justify-center gap-1"
                  >
                    <Check size={13} className="text-emerald-400" />
                    <span>Save Choice</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleRejectNonEssential}
                    className="py-2.5 px-3 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 text-xs font-bold transition active:scale-98 cursor-pointer text-center"
                  >
                    Essential Only
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptAll}
                    className="py-2.5 px-3 rounded-xl bg-zinc-950 hover:bg-black text-white text-xs font-black transition active:scale-98 shadow-sm cursor-pointer text-center flex items-center justify-center gap-1"
                  >
                    <Check size={13} className="text-emerald-400" />
                    <span>Accept All</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
