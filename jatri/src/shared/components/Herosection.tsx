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
    <section className="w-full bg-white text-gray-900 px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6 sm:space-y-8">
          
          {/* ================= HERO HEADER ================= */}
          <div>
            <span className="inline-block px-3 py-1 rounded-md bg-gray-100 text-gray-800 text-xs sm:text-sm font-extrabold uppercase tracking-wider mb-3">
              RideNow On-Demand
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-950 tracking-tight leading-[1.08]">
              Move anything, <br className="hidden sm:inline" />
              go anywhere.
            </h1>
            <p className="mt-3 text-base sm:text-lg lg:text-xl text-gray-600 font-medium max-w-2xl">
              Daily city rides, parcel deliveries, and truck rentals at honest, upfront fares.
            </p>
          </div>

          {/* ================= EXPANDED HIGH-CONTRAST BOOKING CARD ================= */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-5 sm:p-8 shadow-sm">
            
            {/* TRIP MODE SELECTOR TABS (EXPANDED FONTS & SIZES) */}
            <div className="flex items-center gap-2 p-1.5 bg-gray-100 rounded-lg mb-6">
              <button
                type="button"
                onClick={() => setTripMode("ride")}
                className={`flex-1 py-3 sm:py-3.5 px-3 rounded-md text-sm sm:text-base font-extrabold transition active:scale-95 flex items-center justify-center gap-2 ${
                  tripMode === "ride"
                    ? "bg-black text-white shadow-xs"
                    : "text-gray-600 hover:text-black hover:bg-gray-200/70"
                }`}
              >
                <Car size={18} />
                <span>Daily Rides</span>
              </button>

              <button
                type="button"
                onClick={() => setTripMode("cargo")}
                className={`flex-1 py-3 sm:py-3.5 px-3 rounded-md text-sm sm:text-base font-extrabold transition active:scale-95 flex items-center justify-center gap-2 ${
                  tripMode === "cargo"
                    ? "bg-black text-white shadow-xs"
                    : "text-gray-600 hover:text-black hover:bg-gray-200/70"
                }`}
              >
                <Truck size={18} />
                <span>Parcel & Cargo</span>
              </button>

              <button
                type="button"
                onClick={() => setTripMode("rental")}
                className={`flex-1 py-3 sm:py-3.5 px-3 rounded-md text-sm sm:text-base font-extrabold transition active:scale-95 flex items-center justify-center gap-2 ${
                  tripMode === "rental"
                    ? "bg-black text-white shadow-xs"
                    : "text-gray-600 hover:text-black hover:bg-gray-200/70"
                }`}
              >
                <Clock size={18} />
                <span>Rentals</span>
              </button>
            </div>

            {/* INPUT FORM (ENLARGED INPUTS & FONTS) */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative bg-gray-50 border-2 border-gray-200 rounded-lg p-3 sm:p-3.5 shadow-2xs">
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
                    className="w-full py-3.5 sm:py-4 text-base sm:text-lg font-bold text-gray-950 placeholder:text-gray-400 focus:outline-none bg-transparent"
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
                    className="w-full py-3.5 sm:py-4 text-base sm:text-lg font-bold text-gray-950 placeholder:text-gray-400 focus:outline-none bg-transparent"
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
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Leave Now
                </button>
                <button
                  type="button"
                  onClick={() => setIsScheduled(true)}
                  className={`px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition active:scale-95 ${
                    isScheduled
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Schedule Later
                </button>
              </div>

              {/* PRIMARY CTA BUTTON (EXPANDED TO LARGE BOLD CTA) */}
              <button
                type="submit"
                className="w-full py-4 sm:py-5 bg-black hover:bg-gray-800 text-white font-black text-base sm:text-lg lg:text-xl rounded-lg active:scale-[0.98] transition shadow-sm flex items-center justify-center gap-2.5 cursor-pointer mt-2"
              >
                <span>Search Available Rides</span>
                <ArrowRight size={22} strokeWidth={2.5} />
              </button>
            </form>
          </div>

        </div>
      </div>
    </section>
  );
}
