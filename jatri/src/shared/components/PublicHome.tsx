"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import MobileHome from "@/shared/components/MobileHome";

// Lazy-load desktop-only and below-the-fold components to reduce initial mobile bundle size and CPU execution time
const HeroSection = dynamic(() => import("@/shared/components/Herosection"), {
  ssr: true,
  loading: () => <div className="hidden md:block min-h-[500px]" />,
});

const VehicleCategoriesSlider = dynamic(
  () => import("@/features/booking/components/VehicleCategoriesSlider"),
  { ssr: true }
);

const DriveWithJaatri = dynamic(
  () => import("@/shared/components/DriveWithJaatri"),
  { ssr: true }
);

const AuthModal = dynamic(() => import("@/features/auth/components/AuthModal"), { ssr: false });

export default function PublicHome() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <main className="w-full pt-0 bg-[#FAF7F0] dark:bg-[#061A16]">
      {/* 📱 MOBILE HOMEPAGE (<768px): Lightweight instant hero, shortcuts, 2-col services, destinations */}
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
