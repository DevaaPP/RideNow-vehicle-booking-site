"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import Image from "next/image";
import {
  Navigation,
  Clock,
  ArrowRight,
  Car,
  Truck,
} from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

type TripMode = "ride" | "cargo" | "rental";

export default function HeroSection({
  onAuthRequired,
}: {
  onAuthRequired: () => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { userData } = useSelector((state: RootState) => state.user);

  const [tripMode, setTripMode] = useState<TripMode>("ride");
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);

  /* Quick auto-detect current location */
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/places?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`
          );
          if (res.ok) {
            const data = await res.json();
            setPickup(data?.address || "Current Location");
          } else {
            setPickup("Current Location");
          }
        } catch {
          setPickup("Current Location");
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        setPickup("Current Location");
      },
      { timeout: 8000 }
    );
  };

  /* Submit booking search */
  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!userData) {
      onAuthRequired();
      return;
    }

    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("ridenow_booking_draft");
        localStorage.removeItem("ridenow_booking_draft");
      } catch (_) {}
    }

    const params = new URLSearchParams();
    params.set("fresh", "true");
    if (pickup.trim()) params.set("pickup", pickup.trim());
    if (drop.trim()) params.set("drop", drop.trim());

    if (tripMode === "cargo") {
      params.set("category", "trucks");
    } else if (tripMode === "rental") {
      params.set("rental", "true");
    } else {
      params.set("category", "cars");
    }

    if (isScheduled) {
      params.set("reserve", "true");
    }

    router.push(`/book?${params.toString()}`);
  };

  return (
    <section className="relative w-full bg-[#0B0F19] text-white px-4 sm:px-6 lg:px-8 pt-10 sm:pt-20 lg:pt-24 pb-12 sm:pb-20 lg:pb-28 overflow-hidden">
      {/* ================= GORGEOUS SUNSET CITY SKYLINE (GUWAHATI / ASSAM) ================= */}
      <Image
        src="/hero-city.webp"
        alt="Northeast Indian Transit Skyline at Sunset"
        fill
        priority
        quality={90}
        sizes="100vw"
        className="object-cover object-center pointer-events-none opacity-90 sm:opacity-95"
      />
      {/* Atmospheric directional overlays: Softened so sunset sky, golden temple & city lights shine through clearly */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/25 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

      {/* ================= HERO CONTENT CONTAINER ================= */}
      <div className="relative z-10 max-w-7xl mx-auto">
        
        {/* HERO HEADLINE */}
        <div className="mb-6 sm:mb-10 text-left max-w-3xl">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] drop-shadow-md">
            Move anything, <br className="hidden sm:inline" />
            go anywhere.
          </h1>
          <p className="mt-2 text-sm sm:text-lg lg:text-xl text-zinc-200 font-bold drop-shadow-sm">
            Honest upfront fares. 100% direct driver pay.
          </p>
        </div>

        {/* 2-COLUMN BALANCED LAYOUT: DIRECT FLOATING BOOKING PANEL + PARTNER HERO (PERFECTLY BALANCED) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-stretch pt-1 sm:pt-2">
          
          {/* ================= LEFT: DIRECT BOOKING PANEL ================= */}
          <div className="lg:col-span-7 flex flex-col justify-between text-white">
            <div>
              {/* TRIP MODE SELECTOR TABS */}
              <div className="inline-flex items-center gap-1 sm:gap-2 p-1 sm:p-1.5 bg-black/50 rounded-xl sm:rounded-2xl mb-4 sm:mb-6 border border-white/15 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setTripMode("ride")}
                  className={`py-2 sm:py-3.5 px-3 sm:px-6 rounded-lg sm:rounded-xl text-xs sm:text-base lg:text-lg font-black transition active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2.5 ${
                    tripMode === "ride"
                      ? "bg-emerald-600 text-white shadow-md"
                      : "text-zinc-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Car className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                  <span>Daily Rides</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTripMode("cargo")}
                  className={`py-2 sm:py-3.5 px-3 sm:px-6 rounded-lg sm:rounded-xl text-xs sm:text-base lg:text-lg font-black transition active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2.5 ${
                    tripMode === "cargo"
                      ? "bg-emerald-600 text-white shadow-md"
                      : "text-zinc-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Truck className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                  <span>Parcel & Cargo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTripMode("rental")}
                  className={`py-2 sm:py-3.5 px-3 sm:px-6 rounded-lg sm:rounded-xl text-xs sm:text-base lg:text-lg font-black transition active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2.5 ${
                    tripMode === "rental"
                      ? "bg-emerald-600 text-white shadow-md"
                      : "text-zinc-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
                  <span>Rentals</span>
                </button>
              </div>

              {/* STREAMLINED LOCATION FORM (UBER/RAPIDO UNIFIED CONTAINER) */}
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div className="relative bg-white border border-stone-200/90 rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20 transition">
                  {/* Left Transit Icons & Continuous Connector */}
                  <div className="absolute left-3.5 sm:left-5 top-0 bottom-0 w-4 sm:w-5 flex flex-col items-center pointer-events-none">
                    <div className="h-[54px] sm:h-[76px] flex items-center justify-center">
                      <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border-[3px] sm:border-[3.5px] border-emerald-600 bg-white shadow-xs" />
                    </div>
                    <div className="w-[2px] sm:w-[2.5px] flex-1 -my-1.5 sm:-my-2 bg-gradient-to-b from-emerald-600 via-amber-500 to-amber-600 rounded-full" />
                    <div className="h-[54px] sm:h-[76px] flex items-center justify-center">
                      <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-amber-600 rounded-xs shadow-xs" />
                    </div>
                  </div>

                  {/* Input Rows */}
                  <div className="pl-10 sm:pl-15 pr-3 sm:pr-4">
                    {/* Pickup Input Row */}
                    <div className="h-[54px] sm:h-[76px] flex items-center border-b border-stone-200/90">
                      <input
                        type="text"
                        value={pickup}
                        onChange={(e) => setPickup(e.target.value)}
                        placeholder="Enter pickup point"
                        className="w-full py-2.5 sm:py-3 text-base sm:text-xl md:text-2xl font-bold sm:font-black text-stone-900 placeholder:text-stone-400 placeholder:font-semibold sm:placeholder:font-bold focus:outline-none bg-transparent"
                      />
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        title="Use current GPS location"
                        className="p-2 sm:p-2.5 text-stone-500 hover:text-emerald-700 transition flex-shrink-0 active:scale-90"
                      >
                        <Navigation
                          className={`w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 ${isLocating ? "animate-spin text-emerald-600" : ""}`}
                        />
                      </button>
                    </div>

                    {/* Dropoff Input Row */}
                    <div className="h-[54px] sm:h-[76px] flex items-center">
                      <input
                        type="text"
                        value={drop}
                        onChange={(e) => setDrop(e.target.value)}
                        placeholder="Enter drop destination"
                        className="w-full py-2.5 sm:py-3 text-base sm:text-xl md:text-2xl font-bold sm:font-black text-stone-900 placeholder:text-stone-400 placeholder:font-semibold sm:placeholder:font-bold focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* TIMING SELECTOR */}
                <div className="flex items-center gap-2.5 sm:gap-3 pt-0.5 sm:pt-1">
                  <button
                    type="button"
                    onClick={() => setIsScheduled(false)}
                    className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-base md:text-lg font-bold sm:font-black transition active:scale-95 ${
                      !isScheduled
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-black/50 border border-white/15 text-zinc-300 hover:bg-white/10 hover:text-white backdrop-blur-sm"
                    }`}
                  >
                    Leave Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsScheduled(true)}
                    className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-base md:text-lg font-bold sm:font-black transition active:scale-95 ${
                      isScheduled
                        ? "bg-emerald-600 text-white shadow-md"
                        : "bg-black/50 border border-white/15 text-zinc-300 hover:bg-white/10 hover:text-white backdrop-blur-sm"
                    }`}
                  >
                    Schedule Later
                  </button>
                </div>

                {/* PRIMARY ACTION BUTTON */}
                <button
                  type="submit"
                  className="w-full py-3.5 sm:py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base sm:text-xl md:text-2xl rounded-xl sm:rounded-2xl active:scale-[0.98] transition shadow-2xl flex items-center justify-center gap-2.5 sm:gap-3 cursor-pointer mt-2.5 sm:mt-3"
                >
                  <span>Search Available Rides</span>
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" strokeWidth={3} />
                </button>
              </form>
            </div>
          </div>

          {/* ================= RIGHT: SUBTLE REFINED PARTNER SHOWCASE (BALANCED WITH LEFT) ================= */}
          <div className="lg:col-span-5 hidden lg:flex flex-col justify-between text-white pl-0 lg:pl-4">
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                  Drive & Earn
                </h2>
                <p className="text-base sm:text-lg text-zinc-200 font-bold mt-2 drop-shadow-sm">
                  Transparent earnings with direct payouts.
                </p>
              </div>

              {/* 3 CLEAN FACTUAL BULLET POINTS (NO ICONS) */}
              <div className="space-y-4 pt-1">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0 shadow-sm" />
                  <span className="text-lg sm:text-xl lg:text-2xl font-black text-white drop-shadow-sm">
                    Direct Cash & UPI Earnings
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0 shadow-sm" />
                  <span className="text-lg sm:text-xl lg:text-2xl font-black text-white drop-shadow-sm">
                    Fast Daily Bank Payouts
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0 shadow-sm" />
                  <span className="text-lg sm:text-xl lg:text-2xl font-black text-white drop-shadow-sm">
                    Drive On Your Own Schedule
                  </span>
                </div>
              </div>
            </div>

            {/* MATCHING ACTION BUTTON (PERFECTLY ALIGNED WITH LEFT SEARCH BUTTON) */}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => router.push("/partner/onboard/vehicle")}
                className="w-full py-3.5 sm:py-5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-base sm:text-xl md:text-2xl rounded-xl sm:rounded-2xl active:scale-[0.98] transition shadow-2xl flex items-center justify-center gap-2.5 sm:gap-3 cursor-pointer"
              >
                <span>Partner With Us</span>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
