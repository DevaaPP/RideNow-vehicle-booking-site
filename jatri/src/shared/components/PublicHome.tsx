"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import HeroSection from "@/shared/components/Herosection";
import VehicleCategoriesSlider from "@/features/booking/components/VehicleCategoriesSlider";

const AuthModal = dynamic(() => import("@/features/auth/components/AuthModal"), { ssr: false });

export default function PublicHome() {
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <HeroSection onAuthRequired={() => setAuthOpen(true)} />
      <VehicleCategoriesSlider />

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
      />
    </>
  );
}
