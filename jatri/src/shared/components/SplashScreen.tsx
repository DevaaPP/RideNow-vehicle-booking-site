"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // If user already saw the splash screen in this session, hide immediately without blocking navigation
    if (typeof window !== "undefined") {
      try {
        const hasSeen = sessionStorage.getItem("jaatri_splash_seen");
        if (hasSeen) {
          setVisible(false);
          const el = document.getElementById("jaatri-splash-screen");
          if (el) el.remove();
          return;
        }
      } catch (_) {}
    }

    // Display splash for 650ms on cold start, then smoothly fade out
    const timer = setTimeout(() => {
      setFading(true);
      try {
        sessionStorage.setItem("jaatri_splash_seen", "true");
      } catch (_) {}

      const fadeTimer = setTimeout(() => {
        setVisible(false);
        const el = document.getElementById("jaatri-splash-screen");
        if (el) el.remove();
      }, 350);

      return () => clearTimeout(fadeTimer);
    }, 650);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      id="jaatri-splash-screen"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none pointer-events-auto transition-all duration-350 ease-out bg-[#FAF7F0] dark:bg-[#061A16] ${
        fading ? "opacity-0 scale-[1.02] pointer-events-none" : "opacity-100 scale-100"
      }`}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center justify-center text-center px-6 max-w-xs animate-in fade-in zoom-in-95 duration-400">
        {/* Light Theme Logo */}
        <div className="block dark:hidden splash-logo-light">
          <Image
            src="/logojatri.webp"
            alt="Jaatri"
            width={180}
            height={56}
            priority
            className="h-14 sm:h-16 w-auto object-contain"
          />
        </div>

        {/* Dark Theme Logo */}
        <div className="hidden dark:block splash-logo-dark">
          <Image
            src="/logojatri-dark.webp"
            alt="Jaatri"
            width={180}
            height={56}
            priority
            className="h-14 sm:h-16 w-auto object-contain"
          />
        </div>

        {/* Minimalist Subtitle */}
        <p className="mt-4 text-[11px] sm:text-[12px] font-bold tracking-[0.24em] uppercase text-[#696B64] dark:text-[#B9C8BF] splash-subtext">
          MORE THAN A RIDE
        </p>

        {/* Refined Emerald Loading Bar */}
        <div className="w-28 sm:w-32 h-[3px] bg-[#E8E2D8] dark:bg-[#1E3E34] rounded-full overflow-hidden mt-6 relative">
          <div className="absolute inset-0 w-full h-full bg-[#046A38] dark:bg-[#34D399] rounded-full animate-[pulse_1.2s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
