"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    setMounted(true);

    // If user already saw the splash screen in this browser session, unmount immediately via React state
    try {
      if (sessionStorage.getItem("jaatri_splash_seen")) {
        setVisible(false);
        return;
      }
    } catch (_) {}

    let unmountTimer: ReturnType<typeof setTimeout> | undefined;

    // Display splash for 650ms on cold start, then smoothly fade out
    const fadeTimer = setTimeout(() => {
      setFading(true);
      try {
        sessionStorage.setItem("jaatri_splash_seen", "true");
      } catch (_) {}

      // Once fade animation completes (350ms), unmount safely via React state
      unmountTimer = setTimeout(() => {
        setVisible(false);
      }, 350);
    }, 650);

    return () => {
      clearTimeout(fadeTimer);
      if (unmountTimer) clearTimeout(unmountTimer);
    };
  }, []);

  // Avoid SSR hydration discrepancy and safely unmount when finished
  if (!mounted || !visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none bg-[#FAF7F0] dark:bg-[#061A16] transition-all duration-350 ease-out ${
        fading ? "opacity-0 scale-[1.02] pointer-events-none" : "opacity-100 scale-100 pointer-events-auto"
      }`}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center justify-center text-center px-6 max-w-xs animate-in fade-in zoom-in-95 duration-300">
        {/* Light Theme Logo */}
        <div className="block dark:hidden">
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
        <div className="hidden dark:block">
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
        <p className="mt-4 text-[11px] sm:text-[12px] font-bold tracking-[0.24em] uppercase text-[#696B64] dark:text-[#B9C8BF]">
          MORE THAN A RIDE
        </p>

        {/* Refined Emerald Loading Bar */}
        <div className="w-28 sm:w-32 h-[3px] bg-[#E8E2D8] dark:bg-[#1E3E34] rounded-full overflow-hidden mt-6 relative">
          <div className="absolute inset-0 w-full h-full bg-[#046A38] dark:bg-[#34D399] rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
