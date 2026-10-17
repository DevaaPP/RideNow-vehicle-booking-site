"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { motion } from "framer-motion";
import {
  MapPin,
  Navigation,
  Clock,
  Calendar,
  ArrowRight,
  Car,
  Truck,
  Bike,
  ChevronRight,
} from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import {
  CarMiniIcon,
  ExpressMiniIcon,
  BikeIcon,
  AutoRickshawIcon,
} from "@/shared/components/VehicleIcons";

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
    <section className="w-full bg-white text-zinc-950 px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* ================= LEFT COLUMN: BOOKING INTERFACE ================= */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* HERO TITLE & SUBTITLE */}
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-zinc-100 text-zinc-800 text-xs font-black uppercase tracking-wider mb-3">
                RideNow On-Demand
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-black tracking-tight leading-[1.08]">
                Move anything, <br className="hidden sm:inline" />
                go anywhere.
              </h1>
              <p className="mt-3 text-base sm:text-lg text-zinc-600 font-medium max-w-xl">
                Daily city rides, parcel deliveries, and truck rentals at honest, upfront fares.
              </p>
            </div>

            {/* MAIN BOOKING CARD */}
            <div className="bg-[#F8F8F8] border border-zinc-200 rounded-3xl p-4 sm:p-6 shadow-sm">
              
              {/* TRIP MODE SELECTOR PILLS */}
              <div className="flex items-center gap-1.5 p-1 bg-zinc-200/70 rounded-2xl mb-4 sm:mb-5">
                <button
                  type="button"
                  onClick={() => setTripMode("ride")}
                  className={`flex-1 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition active:scale-95 flex items-center justify-center gap-2 ${
                    tripMode === "ride"
                      ? "bg-black text-white shadow-sm"
                      : "text-zinc-700 hover:text-black hover:bg-zinc-200"
                  }`}
                >
                  <Car size={16} />
                  <span>Daily Rides</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTripMode("cargo")}
                  className={`flex-1 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition active:scale-95 flex items-center justify-center gap-2 ${
                    tripMode === "cargo"
                      ? "bg-black text-white shadow-sm"
                      : "text-zinc-700 hover:text-black hover:bg-zinc-200"
                  }`}
                >
                  <Truck size={16} />
                  <span>Parcel & Cargo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTripMode("rental")}
                  className={`flex-1 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition active:scale-95 flex items-center justify-center gap-2 ${
                    tripMode === "rental"
                      ? "bg-black text-white shadow-sm"
                      : "text-zinc-700 hover:text-black hover:bg-zinc-200"
                  }`}
                >
                  <Clock size={16} />
                  <span>Rentals</span>
                </button>
              </div>

              {/* INPUT FORM */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative bg-white rounded-2xl border border-zinc-300/80 p-2 sm:p-2.5 shadow-xs">
                  {/* Transit line connecting pickup and drop */}
                  <div className="absolute left-[24px] sm:left-[28px] top-[32px] bottom-[32px] w-[2px] bg-zinc-900 pointer-events-none" />

                  {/* PICKUP INPUT */}
                  <div className="relative flex items-center">
                    <div className="w-10 sm:w-12 flex items-center justify-center flex-shrink-0">
                      <span className="w-3.5 h-3.5 rounded-full border-[3px] border-black bg-white" />
                    </div>
                    <input
                      type="text"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      placeholder="Enter pickup point"
                      className="w-full py-3 sm:py-3.5 text-base font-bold text-zinc-950 placeholder:text-zinc-400 focus:outline-none bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      title="Use current location"
                      className="p-2 sm:p-2.5 text-zinc-500 hover:text-black transition flex-shrink-0 active:scale-90"
                    >
                      <Navigation
                        size={18}
                        className={isLocating ? "animate-spin text-black" : ""}
                      />
                    </button>
                  </div>

                  <div className="h-px bg-zinc-100 my-1 mx-3" />

                  {/* DROPOFF INPUT */}
                  <div className="relative flex items-center">
                    <div className="w-10 sm:w-12 flex items-center justify-center flex-shrink-0">
                      <span className="w-3 h-3 bg-black" />
                    </div>
                    <input
                      type="text"
                      value={drop}
                      onChange={(e) => setDrop(e.target.value)}
                      placeholder="Enter drop destination"
                      className="w-full py-3 sm:py-3.5 text-base font-bold text-zinc-950 placeholder:text-zinc-400 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>

                {/* TIMING SELECTOR */}
                <div className="flex items-center justify-between px-1 py-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsScheduled(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        !isScheduled
                          ? "bg-black text-white"
                          : "bg-zinc-200/60 text-zinc-700 hover:bg-zinc-200"
                      }`}
                    >
                      Leave Now
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsScheduled(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                        isScheduled
                          ? "bg-black text-white"
                          : "bg-zinc-200/60 text-zinc-700 hover:bg-zinc-200"
                      }`}
                    >
                      Schedule Later
                    </button>
                  </div>
                </div>

                {/* PRIMARY CTA BUTTON */}
                <button
                  type="submit"
                  className="w-full py-4 bg-black hover:bg-zinc-800 text-white font-extrabold text-base sm:text-lg rounded-2xl active:scale-[0.98] transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Search Available Rides</span>
                  <ArrowRight size={20} strokeWidth={2.5} />
                </button>
              </form>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: VISUAL FLEET SHOWCASE ================= */}
          <div className="lg:col-span-5 hidden lg:block">
            <div className="bg-black text-white rounded-3xl p-7 shadow-2xl border border-zinc-900 space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Available Fleet</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">Ready for booking across your city</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-extrabold">
                  Live Dispatch
                </span>
              </div>

              {/* COMPACT INTERACTIVE FLEET TILES */}
              <div className="space-y-3">
                <div
                  onClick={() => {
                    setTripMode("ride");
                    handleSubmit();
                  }}
                  className="p-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 flex items-center justify-between cursor-pointer transition active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <CarMiniIcon size={38} />
                    <div>
                      <p className="font-extrabold text-sm text-white">City Cabs & Mini</p>
                      <p className="text-xs text-zinc-400">Comfortable AC cars for daily commute</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-zinc-500" />
                </div>

                <div
                  onClick={() => {
                    setTripMode("ride");
                    handleSubmit();
                  }}
                  className="p-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 flex items-center justify-between cursor-pointer transition active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <AutoRickshawIcon size={38} />
                    <div>
                      <p className="font-extrabold text-sm text-white">Auto Rickshaw</p>
                      <p className="text-xs text-zinc-400">Affordable, quick doorstep rides</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-zinc-500" />
                </div>

                <div
                  onClick={() => {
                    setTripMode("ride");
                    handleSubmit();
                  }}
                  className="p-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 flex items-center justify-between cursor-pointer transition active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <BikeIcon size={38} />
                    <div>
                      <p className="font-extrabold text-sm text-white">Bike Taxi</p>
                      <p className="text-xs text-zinc-400">Zip through traffic effortlessly</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-zinc-500" />
                </div>

                <div
                  onClick={() => {
                    setTripMode("cargo");
                    handleSubmit();
                  }}
                  className="p-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 flex items-center justify-between cursor-pointer transition active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <ExpressMiniIcon size={38} />
                    <div>
                      <p className="font-extrabold text-sm text-white">Express Cargo Trucks</p>
                      <p className="text-xs text-zinc-400">Mini trucks for heavy goods & parcels</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-zinc-500" />
                </div>
              </div>

              {/* CLEAN PARTNER CALLOUT */}
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-400">Drive or List Your Vehicle</p>
                  <p className="text-xs text-zinc-500">Keep 100% of your earnings</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/partner/onboard/vehicle")}
                  className="px-3.5 py-1.5 rounded-xl bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition active:scale-95"
                >
                  Partner With Us
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
