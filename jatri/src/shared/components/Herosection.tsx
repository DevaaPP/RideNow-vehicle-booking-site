"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
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
    <section className="w-full bg-white text-gray-900 px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="max-w-7xl mx-auto">
        
        {/* ================= HERO HEADER (LEFT ALIGNED) ================= */}
        <div className="mb-6 sm:mb-8 text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-950 tracking-tight leading-[1.08]">
            Move anything, <br className="hidden sm:inline" />
            go anywhere.
          </h1>
          <p className="mt-3 text-base sm:text-lg lg:text-xl text-gray-600 font-medium max-w-2xl">
            Daily city rides, parcel deliveries, and truck rentals at honest, upfront fares.
          </p>
        </div>

        {/* ================= 2-COLUMN BALANCED SPLIT: RIDER VS DRIVER ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          
          {/* ================= LEFT: EXPANDED BOOKING CARD ================= */}
          <div className="lg:col-span-7 flex flex-col justify-between bg-white border-2 border-gray-200 rounded-xl p-5 sm:p-7 shadow-sm">
            <div>
              {/* TRIP MODE SELECTOR TABS */}
              <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-lg mb-5">
                <button
                  type="button"
                  onClick={() => setTripMode("ride")}
                  className={`flex-1 py-3 px-3 rounded-md text-sm sm:text-base font-extrabold transition active:scale-95 flex items-center justify-center gap-2 ${
                    tripMode === "ride"
                      ? "text-white shadow-xs"
                      : "text-gray-600 hover:text-black hover:bg-gray-200/70"
                  }`}
                  style={{
                    backgroundColor: tripMode === "ride" ? "var(--theme-primary, #000000)" : undefined,
                  }}
                >
                  <Car size={18} />
                  <span>Daily Rides</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTripMode("cargo")}
                  className={`flex-1 py-3 px-3 rounded-md text-sm sm:text-base font-extrabold transition active:scale-95 flex items-center justify-center gap-2 ${
                    tripMode === "cargo"
                      ? "text-white shadow-xs"
                      : "text-gray-600 hover:text-black hover:bg-gray-200/70"
                  }`}
                  style={{
                    backgroundColor: tripMode === "cargo" ? "var(--theme-primary, #000000)" : undefined,
                  }}
                >
                  <Truck size={18} />
                  <span>Parcel & Cargo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTripMode("rental")}
                  className={`flex-1 py-3 px-3 rounded-md text-sm sm:text-base font-extrabold transition active:scale-95 flex items-center justify-center gap-2 ${
                    tripMode === "rental"
                      ? "text-white shadow-xs"
                      : "text-gray-600 hover:text-black hover:bg-gray-200/70"
                  }`}
                  style={{
                    backgroundColor: tripMode === "rental" ? "var(--theme-primary, #000000)" : undefined,
                  }}
                >
                  <Clock size={18} />
                  <span>Rentals</span>
                </button>
              </div>

              {/* INPUT FORM */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative bg-gray-50 border-2 border-gray-200 rounded-lg p-3 shadow-2xs">
                  {/* Transit line connecting pickup and drop */}
                  <div className="absolute left-[26px] sm:left-[28px] top-[34px] bottom-[34px] w-[2px] bg-gray-400 pointer-events-none" />

                  {/* PICKUP INPUT */}
                  <div className="relative flex items-center bg-white rounded-md border border-gray-200 px-3 py-1.5 focus-within:border-gray-900 transition shadow-2xs">
                    <div className="w-9 flex items-center justify-center flex-shrink-0">
                      <span className="w-3.5 h-3.5 rounded-full border-[3px] border-black bg-white" />
                    </div>
                    <input
                      type="text"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      placeholder="Enter pickup point"
                      className="w-full py-3.5 text-base sm:text-lg font-bold text-gray-950 placeholder:text-gray-400 focus:outline-none bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      title="Use current location"
                      className="p-2 text-gray-500 hover:text-black transition flex-shrink-0 active:scale-90"
                    >
                      <Navigation
                        size={19}
                        className={isLocating ? "animate-spin text-black" : ""}
                      />
                    </button>
                  </div>

                  <div className="my-2" />

                  {/* DROPOFF INPUT */}
                  <div className="relative flex items-center bg-white rounded-md border border-gray-200 px-3 py-1.5 focus-within:border-gray-900 transition shadow-2xs">
                    <div className="w-9 flex items-center justify-center flex-shrink-0">
                      <span className="w-3 h-3 bg-black" />
                    </div>
                    <input
                      type="text"
                      value={drop}
                      onChange={(e) => setDrop(e.target.value)}
                      placeholder="Enter drop destination"
                      className="w-full py-3.5 text-base sm:text-lg font-bold text-gray-950 placeholder:text-gray-400 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>

                {/* TIMING SELECTOR */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsScheduled(false)}
                    className={`px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition active:scale-95 ${
                      !isScheduled
                        ? "text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    style={{
                      backgroundColor: isScheduled ? "var(--theme-primary, #000000)" : undefined,
                    }}
                  >
                    Schedule Later
                  </button>
                </div>

                {/* PRIMARY CTA BUTTON */}
                <button
                  type="submit"
                  className="w-full py-4 sm:py-4.5 text-white font-black text-base sm:text-lg rounded-lg active:scale-[0.98] transition shadow-sm flex items-center justify-center gap-2.5 cursor-pointer mt-2"
                  style={{ backgroundColor: "var(--theme-primary, #000000)" }}
                >
                  <span>Search Available Rides</span>
                  <ArrowRight size={20} strokeWidth={2.5} />
                </button>
              </form>
            </div>
          </div>

          {/* ================= RIGHT: PARTNER / DRIVER EQUAL WEIGHT CARD ================= */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-white border-2 border-gray-200 rounded-xl p-5 sm:p-7 shadow-sm">
            <div>
              <div className="pb-4 border-b border-gray-100">
                <span className="inline-block px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-800 text-xs font-black uppercase tracking-wider mb-2">
                  Partner Ecosystem
                </span>
                <h3 className="text-2xl font-black text-gray-950 tracking-tight">
                  Drive & Earn on Your Terms
                </h3>
                <p className="text-sm text-gray-600 font-medium mt-1 leading-relaxed">
                  Turn your vehicle into daily income. Zero commission cuts, transparent direct payments.
                </p>
              </div>

              {/* 4 BESPOKE FEATURE ROWS WITH CUSTOM VECTOR SVGS */}
              <div className="space-y-3.5 pt-4">
                {/* 1. 100% EARNINGS */}
                <div className="flex items-start gap-3.5 p-2 rounded-lg hover:bg-gray-50 transition">
                  <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center">
                    <ShieldRupeeSvg />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 leading-tight">100% Direct Driver Pay</h4>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                      No surprise cuts. The fare you see is what you take home.
                    </p>
                  </div>
                </div>

                {/* 2. INSTANT WITHDRAWAL */}
                <div className="flex items-start gap-3.5 p-2 rounded-lg hover:bg-gray-50 transition">
                  <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center">
                    <InstantSettlementSvg />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 leading-tight">Instant Bank Settlement</h4>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                      Transfer your ride earnings to your UPI or bank on the same day.
                    </p>
                  </div>
                </div>

                {/* 3. FLEXIBLE TIMING */}
                <div className="flex items-start gap-3.5 p-2 rounded-lg hover:bg-gray-50 transition">
                  <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center">
                    <SteeringClockSvg />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 leading-tight">Complete Schedule Freedom</h4>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                      Drive full-time or pick up trips on your commute. No mandatory hours.
                    </p>
                  </div>
                </div>

                {/* 4. FAST 5-MIN ONBOARDING */}
                <div className="flex items-start gap-3.5 p-2 rounded-lg hover:bg-gray-50 transition">
                  <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center">
                    <DocumentVerificationSvg />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 leading-tight">5-Minute Digital Onboarding</h4>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                      Upload your license and vehicle RC online for quick approval.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* PARTNER CTA BUTTON (MATCHING LEFT BUTTON IN SIZE & STATURE) */}
            <div className="pt-4 border-t border-gray-100 mt-4">
              <button
                type="button"
                onClick={() => router.push("/partner/onboard/vehicle")}
                className="w-full py-4 sm:py-4.5 text-white font-black text-base sm:text-lg rounded-lg active:scale-[0.98] transition shadow-sm flex items-center justify-center gap-2.5 cursor-pointer"
                style={{ backgroundColor: "var(--theme-primary, #000000)" }}
              >
                <span>Register Your Vehicle Now</span>
                <ArrowRight size={20} strokeWidth={2.5} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

/* ================= BESPOKE VECTOR SVGS FOR DRIVER BENEFITS ================= */

function ShieldRupeeSvg() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2L4 6V11C4 16.55 7.41 21.74 12 23C16.59 21.74 20 16.55 20 11V6L12 2Z"
        fill="#18181B"
      />
      <path
        d="M9 8H15M9 11H13M11 11C13 11 13 8 13 8M10 13L13.5 17"
        stroke="#FFFFFF"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InstantSettlementSvg() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="5" width="18" height="14" rx="3" fill="#18181B" />
      <path d="M3 10H21" stroke="#FFFFFF" strokeWidth="1.8" />
      <path
        d="M13 13.5L11.5 16H14.5L13 18.5"
        stroke="#FACC15"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="15" r="1.5" fill="#FFFFFF" />
    </svg>
  );
}

function SteeringClockSvg() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke="#18181B" strokeWidth="2.2" />
      <circle cx="12" cy="12" r="3" fill="#18181B" />
      <path d="M12 3V9" stroke="#18181B" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 14L9.5 12.5" stroke="#18181B" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 14L14.5 12.5" stroke="#18181B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function DocumentVerificationSvg() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
        fill="#18181B"
      />
      <path d="M14 2V8H20" fill="#27272A" />
      <path
        d="M8.5 14.5L10.5 16.5L15.5 11.5"
        stroke="#10B981"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
