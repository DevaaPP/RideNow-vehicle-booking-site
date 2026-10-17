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
      {/* ================= CRISP CINEMATIC VEHICLE / TRANSIT BACKDROP (LIKE ORIGINAL) ================= */}
      <Image
        src="/heroImage.webp"
        alt="RideNow Mobility Background"
        fill
        priority
        quality={90}
        sizes="100vw"
        className="object-cover object-center pointer-events-none opacity-70 sm:opacity-75"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/75 to-black/45 pointer-events-none" />

      {/* ================= HERO CONTENT CONTAINER ================= */}
      <div className="relative z-10 max-w-7xl mx-auto">
        
        {/* HERO HEADLINE & INTRO (LEFT ALIGNED) */}
        <div className="mb-8 sm:mb-10 text-left max-w-3xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] drop-shadow-md">
            Move anything, <br className="hidden sm:inline" />
            go anywhere.
          </h1>
          <p className="mt-3 text-base sm:text-lg lg:text-xl text-zinc-200 font-medium leading-relaxed drop-shadow-sm">
            Daily city rides, parcel deliveries, and truck rentals at honest, upfront fares.
          </p>
        </div>

        {/* 2-COLUMN BALANCED LAYOUT: FUNCTIONAL BOOKING CARD + ENHANCED PARTNER SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          
          {/* ================= LEFT: ACCESSIBLE, HIGH-CONVERSION BOOKING CARD ================= */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-white text-zinc-950 rounded-xl p-5 sm:p-7 shadow-2xl border border-zinc-200/80">
            <div>
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
          </div>

          {/* ================= RIGHT: ENHANCED DRIVER & PARTNER CARD (ENLARGED BUTTON) ================= */}
          <div className="lg:col-span-5 hidden lg:flex flex-col justify-between bg-zinc-900/85 backdrop-blur-md border border-white/15 rounded-xl p-6 sm:p-7 shadow-2xl">
            <div className="space-y-5">
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                  Drive & Earn <br />
                  with RideNow
                </h3>
                <p className="text-sm text-zinc-300 font-medium mt-2 leading-relaxed">
                  Turn your car, bike, auto, or truck into daily income with guaranteed upfront fares and complete schedule flexibility.
                </p>
              </div>

              {/* 2 CLEAN, HIGH-IMPACT VALUE ROWS */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="flex items-start gap-3.5 p-2 rounded-lg bg-white/5 border border-white/5">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-white">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">100% Direct Driver Fares</h4>
                    <p className="text-xs text-zinc-300 mt-0.5">
                      Keep what customers pay. No surprise platform commission cuts.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-2 rounded-lg bg-white/5 border border-white/5">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-white">
                    <Zap size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Instant Daily Settlements</h4>
                    <p className="text-xs text-zinc-300 mt-0.5">
                      Cash out your ride earnings anytime directly to your UPI or bank.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ENLARGED FULL-WIDTH PROMINENT PARTNER WITH US BUTTON */}
            <div className="pt-5 border-t border-white/10 mt-6">
              <button
                type="button"
                onClick={() => router.push("/partner/onboard/vehicle")}
                className="w-full py-4 rounded-lg bg-white text-zinc-950 font-black text-base hover:bg-zinc-200 transition active:scale-[0.98] shadow-xl flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span>Partner With Us</span>
                <ArrowRight size={20} strokeWidth={2.5} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
