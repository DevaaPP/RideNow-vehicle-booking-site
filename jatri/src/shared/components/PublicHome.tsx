"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import HeroSection from "@/shared/components/Herosection";
import VehicleCategoriesSlider from "@/features/booking/components/VehicleCategoriesSlider";
import ThemeTesterColorWheel from "@/shared/components/ThemeTesterColorWheel";

const AuthModal = dynamic(() => import("@/features/auth/components/AuthModal"), { ssr: false });

export default function PublicHome() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <main className="w-full pt-18 sm:pt-20 bg-white">
      <HeroSection onAuthRequired={() => setAuthOpen(true)} />
      <VehicleCategoriesSlider />

      {/* Temporary Theme Tester Color Wheel for live testing */}
      <ThemeTesterColorWheel />

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
      />
    </main>
  );
}
