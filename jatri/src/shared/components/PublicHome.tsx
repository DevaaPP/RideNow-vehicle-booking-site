"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import HeroSection from "@/shared/components/Herosection";
import VehicleCategoriesSlider from "@/features/booking/components/VehicleCategoriesSlider";
import DriveWithJaatri from "@/shared/components/DriveWithJaatri";

const AuthModal = dynamic(() => import("@/features/auth/components/AuthModal"), { ssr: false });

export default function PublicHome() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <main className="w-full pt-0 bg-white">
      <HeroSection onAuthRequired={() => setAuthOpen(true)} />
      <VehicleCategoriesSlider />
      <DriveWithJaatri />

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
      />
    </main>
  );
}
