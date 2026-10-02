"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import HeroSection from "@/components/Herosection";
import VehicleCategoriesSlider from "@/components/VehicleCategoriesSlider";

const AuthModal = dynamic(() => import("@/components/AuthModal"), { ssr: false });

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
