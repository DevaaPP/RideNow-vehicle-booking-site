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
    <section className="relative w-full bg-zinc-950 text-white px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20 overflow-hidden">
      {/* ================= ATMOSPHERIC VEHICLE / TRANSIT BACKDROP (DESIGN 1) ================= */}
      <Image
        src="/heroImage.webp"
        alt="RideNow Mobility Background"
        fill
        priority
        quality={85}
        sizes="100vw"
        className="object-cover object-center pointer-events-none opacity-30 sm:opacity-35"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-zinc-950/75 to-zinc-950 pointer-events-none" />

      {/* ================= HERO CONTENT CONTAINER ================= */}
      <div className="relative z-10 max-w-7xl mx-auto">
        
        {/* HERO HEADLINE & INTRO (LEFT ALIGNED) */}
        <div className="mb-8 sm:mb-10 text-left max-w-3xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] drop-shadow-sm">
            Move anything, <br className="hidden sm:inline" />
            go anywhere.
          </h1>
          <p className="mt-3 text-base sm:text-lg lg:text-xl text-zinc-300 font-medium leading-relaxed">
            Daily city rides, parcel deliveries, and truck rentals at honest, upfront fares.
          </p>
        </div>

        {/* 2-COLUMN BALANCED LAYOUT: FUNCTIONAL BOOKING CARD + SUBTLE REFINEMENT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* ================= LEFT: ACCESSIBLE, HIGH-CONVERSION BOOKING CARD (DESIGN 2) ================= */}
          <div className="lg:col-span-7 bg-white text-zinc-950 rounded-xl p-5 sm:p-7 shadow-2xl border border-zinc-200/80">
            {/* TRIP MODE SELECTOR TABS */}
            <div className="flex items-center gap-1.5 p-1.5 bg-zinc-100 rounded-lg mb-5 border border-zinc-200/50">
              <button
                type="button"
                onClick={() => setTripMode("ride")}
                className={`flex-1 py-3 px-3 rounded-md text-xs sm:text-sm font-extrabold transition active:scale-95 flex items-center justify-center gap-2 ${
                  tripMode === "ride"
                    ? "text-white shadow-xs"
                    : "text-zinc-600 hover:text-black hover:bg-zinc-200/60"
                }`}
                style={{
                  backgroundColor: tripMode === "ride" ? "var(--theme-primary, #000000)" : undefined,
                }}
              >
                <Car size={17} />
                <span>Daily Rides</span>
              </button>

              <button
                type="button"
                onClick={() => setTripMode("cargo")}
                className={`flex-1 py-3 px-3 rounded-md text-xs sm:text-sm font-extrabold transition active:scale-95 flex items-center justify-center gap-2 ${
                  tripMode === "cargo"
                    ? "text-white shadow-xs"
                    : "text-zinc-600 hover:text-black hover:bg-zinc-200/60"
                }`}
                style={{
                  backgroundColor: tripMode === "cargo" ? "var(--theme-primary, #000000)" : undefined,
                }}
              >
                <Truck size={17} />
                <span>Parcel & Cargo</span>
              </button>

              <button
                type="button"
                onClick={() => setTripMode("rental")}
                className={`flex-1 py-3 px-3 rounded-md text-xs sm:text-sm font-extrabold transition active:scale-95 flex items-center justify-center gap-2 ${
                  tripMode === "rental"
                    ? "text-white shadow-xs"
                    : "text-zinc-600 hover:text-black hover:bg-zinc-200/60"
                }`}
                style={{
                  backgroundColor: tripMode === "rental" ? "var(--theme-primary, #000000)" : undefined,
                }}
              >
                <Clock size={17} />
                <span>Rentals</span>
              </button>
            </div>

            {/* CONNECTED LOCATION FORM (SOFTER BORDERS, CONSISTENT PADDING) */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative bg-zinc-50 border border-zinc-200 rounded-lg p-3 sm:p-3.5 shadow-2xs">
                {/* Transit line connecting pickup and drop */}
                <div className="absolute left-[26px] sm:left-[28px] top-[34px] bottom-[34px] w-[2px] bg-zinc-400 pointer-events-none" />

                {/* PICKUP INPUT */}
                <div className="relative flex items-center bg-white rounded-md border border-zinc-200 px-3 py-1.5 focus-within:border-zinc-900 transition shadow-2xs">
                  <div className="w-9 flex items-center justify-center flex-shrink-0">
                    <span className="w-3.5 h-3.5 rounded-full border-[3px] border-black bg-white" />
                  </div>
                  <input
                    type="text"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    placeholder="Enter pickup point"
                    className="w-full py-3.5 text-base sm:text-lg font-bold text-zinc-950 placeholder:text-zinc-400 focus:outline-none bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    title="Use current location"
                    className="p-2 text-zinc-500 hover:text-black transition flex-shrink-0 active:scale-90"
                  >
                    <Navigation
                      size={19}
                      className={isLocating ? "animate-spin text-black" : ""}
                    />
                  </button>
                </div>

                <div className="my-2" />

                {/* DROPOFF INPUT */}
                <div className="relative flex items-center bg-white rounded-md border border-zinc-200 px-3 py-1.5 focus-within:border-zinc-900 transition shadow-2xs">
                  <div className="w-9 flex items-center justify-center flex-shrink-0">
                    <span className="w-3 h-3 bg-black" />
                  </div>
                  <input
                    type="text"
                    value={drop}
                    onChange={(e) => setDrop(e.target.value)}
                    placeholder="Enter drop destination"
                    className="w-full py-3.5 text-base sm:text-lg font-bold text-zinc-950 placeholder:text-zinc-400 focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* TIMING SELECTOR */}
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => setIsScheduled(false)}
                  className={`px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition active:scale-95 ${
                    !isScheduled
                      ? "text-white"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                  style={{
                    backgroundColor: !isScheduled ? "var(--theme-primary, #000000)" : undefined,
                  }}
                >
                  Leave Now
                </button>
                <button
                  type="button"
                  onClick={() => setIsScheduled(true)}
                  className={`px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition active:scale-95 ${
                    isScheduled
                      ? "text-white"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                  }`}
                  style={{
                    backgroundColor: isScheduled ? "var(--theme-primary, #000000)" : undefined,
                  }}
                >
                  Schedule Later
                </button>
              </div>

              {/* PRIMARY ACTION BUTTON */}
              <button
                type="submit"
                className="w-full py-4 sm:py-4.5 text-white font-black text-base sm:text-lg rounded-lg active:scale-[0.98] transition shadow-md flex items-center justify-center gap-2.5 cursor-pointer mt-2"
                style={{ backgroundColor: "var(--theme-primary, #000000)" }}
              >
                <span>Search Available Rides</span>
                <ArrowRight size={20} strokeWidth={2.5} />
              </button>
            </form>
          </div>

          {/* ================= RIGHT: SUBTLE REFINED REASSURANCE CARD (FEWER COMPETING ELEMENTS) ================= */}
          <div className="lg:col-span-5 hidden lg:block space-y-4">
            <div className="bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-xl p-6 sm:p-7 shadow-xl space-y-6">
              <div>
                <span className="inline-block px-2.5 py-1 rounded-md bg-white/10 text-zinc-300 text-xs font-black uppercase tracking-wider mb-2">
                  RideNow Promise
                </span>
                <h3 className="text-2xl font-black text-white tracking-tight leading-snug">
                  Zero Hidden Fees. <br />
                  Direct Driver Pay.
                </h3>
                <p className="text-sm text-zinc-400 font-medium mt-1 leading-relaxed">
                  We believe transportation should be transparent. Fares are calculated upfront with zero surge gouging.
                </p>
              </div>

              {/* 2 CLEAN, REFINED VALUE ROWS */}
              <div className="space-y-3.5 pt-2 border-t border-white/10">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-white">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Upfront Price Guarantee</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      The fare you see before booking is the exact fare you pay.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-white">
                    <Zap size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Instant Direct Settlements</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Drivers keep 100% of ride earnings with immediate bank payouts.
                    </p>
                  </div>
                </div>
              </div>

              {/* CLEAN PARTNER CALLOUT BANNER */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-300">Own a vehicle?</p>
                  <p className="text-xs text-zinc-500">Drive and earn on your schedule</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/partner/onboard/vehicle")}
                  className="px-3.5 py-2 rounded-lg bg-white text-zinc-950 font-extrabold text-xs hover:bg-zinc-200 transition active:scale-95"
                >
                  Partner With Us →
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
