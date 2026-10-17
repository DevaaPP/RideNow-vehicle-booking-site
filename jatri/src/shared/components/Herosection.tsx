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
  ShieldCheck,
  Zap,
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
    <section className="relative w-full bg-[#0B0F19] text-white px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20 overflow-hidden">
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
      {/* Atmospheric directional overlays: Left gives solid contrast for the form, Right reveals golden temple & sunset sky */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F19]/85 via-[#0B0F19]/40 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19]/80 via-transparent to-black/25 pointer-events-none" />

      {/* ================= HERO CONTENT CONTAINER ================= */}
      <div className="relative z-10 max-w-7xl mx-auto">
        
        {/* HERO HEADLINE */}
        <div className="mb-8 sm:mb-10 text-left max-w-3xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] drop-shadow-md">
            Move anything, <br className="hidden sm:inline" />
            go anywhere.
          </h1>
          <p className="mt-3 text-base sm:text-lg lg:text-xl text-zinc-200 font-medium leading-relaxed drop-shadow-sm max-w-2xl">
            Daily city rides, parcel deliveries, and truck rentals at honest, upfront fares with 100% direct driver pay.
          </p>
        </div>

        {/* 2-COLUMN BALANCED LAYOUT: WARM IVORY BOOKING PANEL + REFINED PARTNER HERO */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          
          {/* ================= LEFT: REFINED WARM IVORY BOOKING PANEL ================= */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-[#FCFBF7] text-zinc-900 rounded-xl p-5 sm:p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] border border-amber-200/60">
            <div>
              {/* TRIP MODE SELECTOR TABS (EMERALD & WARM IVORY ACCENTS) */}
              <div className="flex items-center gap-1.5 p-1.5 bg-stone-200/60 rounded-lg mb-5 border border-stone-300/40">
                <button
                  type="button"
                  onClick={() => setTripMode("ride")}
                  className={`flex-1 py-3 px-3 rounded-md text-xs sm:text-sm font-extrabold transition active:scale-95 flex items-center justify-center gap-2 ${
                    tripMode === "ride"
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-stone-700 hover:text-black hover:bg-stone-300/50"
                  }`}
                >
                  <Car size={17} />
                  <span>Daily Rides</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTripMode("cargo")}
                  className={`flex-1 py-3 px-3 rounded-md text-xs sm:text-sm font-extrabold transition active:scale-95 flex items-center justify-center gap-2 ${
                    tripMode === "cargo"
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-stone-700 hover:text-black hover:bg-stone-300/50"
                  }`}
                >
                  <Truck size={17} />
                  <span>Parcel & Cargo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTripMode("rental")}
                  className={`flex-1 py-3 px-3 rounded-md text-xs sm:text-sm font-extrabold transition active:scale-95 flex items-center justify-center gap-2 ${
                    tripMode === "rental"
                      ? "bg-emerald-700 text-white shadow-xs"
                      : "text-stone-700 hover:text-black hover:bg-stone-300/50"
                  }`}
                >
                  <Clock size={17} />
                  <span>Rentals</span>
                </button>
              </div>

              {/* STREAMLINED LOCATION FORM (UBER/RAPIDO UNIFIED CONTAINER) */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative bg-white border border-stone-200/90 rounded-xl overflow-hidden shadow-xs focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600/20 transition">
                  {/* Left Transit Icons & Continuous Connector */}
                  <div className="absolute left-4 top-0 bottom-0 w-4 flex flex-col items-center pointer-events-none">
                    <div className="h-[58px] flex items-center justify-center">
                      <span className="w-3.5 h-3.5 rounded-full border-[3px] border-emerald-600 bg-white" />
                    </div>
                    <div className="w-[2px] flex-1 -my-1.5 bg-gradient-to-b from-emerald-600 to-amber-500 rounded-full" />
                    <div className="h-[58px] flex items-center justify-center">
                      <span className="w-3 h-3 bg-amber-600 rounded-xs" />
                    </div>
                  </div>

                  {/* Input Rows */}
                  <div className="pl-11 pr-3.5">
                    {/* Pickup Input Row */}
                    <div className="h-[58px] flex items-center border-b border-stone-200/80">
                      <input
                        type="text"
                        value={pickup}
                        onChange={(e) => setPickup(e.target.value)}
                        placeholder="Enter pickup point"
                        className="w-full py-3 text-base sm:text-lg font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none bg-transparent"
                      />
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        title="Use current GPS location"
                        className="p-2 text-stone-500 hover:text-emerald-700 transition flex-shrink-0 active:scale-90"
                      >
                        <Navigation
                          size={19}
                          className={isLocating ? "animate-spin text-emerald-600" : ""}
                        />
                      </button>
                    </div>

                    {/* Dropoff Input Row */}
                    <div className="h-[58px] flex items-center">
                      <input
                        type="text"
                        value={drop}
                        onChange={(e) => setDrop(e.target.value)}
                        placeholder="Enter drop destination"
                        className="w-full py-3 text-base sm:text-lg font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* TIMING SELECTOR */}
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setIsScheduled(false)}
                    className={`px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition active:scale-95 ${
                      !isScheduled
                        ? "bg-emerald-700 text-white shadow-xs"
                        : "bg-stone-200/80 text-stone-700 hover:bg-stone-300"
                    }`}
                  >
                    Leave Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsScheduled(true)}
                    className={`px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition active:scale-95 ${
                      isScheduled
                        ? "bg-emerald-700 text-white shadow-xs"
                        : "bg-stone-200/80 text-stone-700 hover:bg-stone-300"
                    }`}
                  >
                    Schedule Later
                  </button>
                </div>

                {/* PRIMARY ACTION BUTTON (RICH EMERALD & GOLD ACCENTS) */}
                <button
                  type="submit"
                  className="w-full py-4 sm:py-4.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base sm:text-lg rounded-lg active:scale-[0.98] transition shadow-lg flex items-center justify-center gap-2.5 cursor-pointer mt-2"
                >
                  <span>Search Available Rides</span>
                  <ArrowRight size={20} strokeWidth={2.5} className="text-amber-300" />
                </button>
              </form>
            </div>
          </div>

          {/* ================= RIGHT: SUBTLE REFINED PARTNER SHOWCASE (REVEALS GOLDEN TEMPLE) ================= */}
          <div className="lg:col-span-5 hidden lg:flex flex-col justify-between bg-black/55 backdrop-blur-md border border-amber-500/25 rounded-xl p-6 sm:p-7 shadow-2xl text-white">
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                  Drive & Earn <br />
                  with RideNow
                </h3>
                <p className="text-sm text-zinc-300 font-medium mt-1 leading-relaxed">
                  Join hundreds of drivers across Assam, Meghalaya & Arunachal. Keep 100% of your earnings with zero middleman commissions.
                </p>
              </div>

              {/* 2 HIGH-IMPACT REGIONAL VALUE CARDS */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="flex items-start gap-3.5 p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="w-9 h-9 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white">Zero Platform Commission</h4>
                    <p className="text-xs text-zinc-300 mt-0.5">
                      Keep every rupee of customer fares. No platform cuts.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="w-9 h-9 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white">Daily Bank Settlement</h4>
                    <p className="text-xs text-zinc-300 mt-0.5">
                      Instant daily UPI transfers directly into your bank account.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ENLARGED FULL-WIDTH MUTED GOLD BUTTON */}
            <div className="pt-4 border-t border-white/10 mt-5">
              <button
                type="button"
                onClick={() => router.push("/partner/onboard/vehicle")}
                className="w-full py-4 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-base transition active:scale-[0.98] shadow-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Partner With Us</span>
                <ArrowRight size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
