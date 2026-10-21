"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import HeroSection from "@/shared/components/Herosection";
import VehicleCategoriesSlider from "@/features/booking/components/VehicleCategoriesSlider";
import DriveWithJaatri from "@/shared/components/DriveWithJaatri";
import MobileHome from "@/shared/components/MobileHome";

const AuthModal = dynamic(() => import("@/features/auth/components/AuthModal"), { ssr: false });

export default function PublicHome() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <main className="w-full pt-0 bg-[#FAF7F0] dark:bg-[#061A16]">
      {/* 📱 MOBILE HOMEPAGE (<768px): Hero, Shortcuts, 2-Col Services, Popular Destinations */}
      <div className="block md:hidden">
        <MobileHome onAuthRequired={() => setAuthOpen(true)} />
      </div>

      {/* 💻 DESKTOP HOMEPAGE (>=768px): Hero with interactive search widget */}
      <div className="hidden md:block">
        <HeroSection onAuthRequired={() => setAuthOpen(true)} />
      </div>

      {/* 🚗 SHARED SECTIONS (Mobile & Desktop): Single-instance vehicle slider & drive partner banner */}
      <VehicleCategoriesSlider />
      <DriveWithJaatri />

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
      />
    </main>
  );
}
