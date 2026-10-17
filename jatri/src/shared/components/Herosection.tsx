"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import {
  MapPin,
  Navigation,
  Clock,
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
    <section className="w-full bg-white text-gray-900 px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* ================= LEFT COLUMN: BOOKING INTERFACE ================= */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* HERO TITLE & SUBTITLE */}
            <div>
              <span className="inline-block px-2.5 py-1 rounded-md bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-wider mb-2.5">
                RideNow On-Demand
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-950 tracking-tight leading-[1.12]">
                Move anything, <br className="hidden sm:inline" />
                go anywhere.
              </h1>
              <p className="mt-2 text-sm sm:text-base text-gray-600 font-medium max-w-xl">
                Daily city rides, parcel deliveries, and truck rentals at honest, upfront fares.
              </p>
            </div>

            {/* MAIN BOOKING CARD (MATCHING REST OF WEBSITE: rounded-xl) */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
              
              {/* TRIP MODE SELECTOR TABS (rounded-lg / rounded-md) */}
              <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-lg mb-4">
                <button
                  type="button"
                  onClick={() => setTripMode("ride")}
                  className={`flex-1 py-2 rounded-md text-xs sm:text-sm font-bold transition active:scale-95 flex items-center justify-center gap-1.5 ${
                    tripMode === "ride"
                      ? "bg-black text-white shadow-xs"
                      : "text-gray-600 hover:text-black hover:bg-gray-200/70"
                  }`}
                >
                  <Car size={15} />
                  <span>Daily Rides</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTripMode("cargo")}
                  className={`flex-1 py-2 rounded-md text-xs sm:text-sm font-bold transition active:scale-95 flex items-center justify-center gap-1.5 ${
                    tripMode === "cargo"
                      ? "bg-black text-white shadow-xs"
                      : "text-gray-600 hover:text-black hover:bg-gray-200/70"
                  }`}
                >
                  <Truck size={15} />
                  <span>Parcel & Cargo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTripMode("rental")}
                  className={`flex-1 py-2 rounded-md text-xs sm:text-sm font-bold transition active:scale-95 flex items-center justify-center gap-1.5 ${
                    tripMode === "rental"
                      ? "bg-black text-white shadow-xs"
                      : "text-gray-600 hover:text-black hover:bg-gray-200/70"
                  }`}
                >
                  <Clock size={15} />
                  <span>Rentals</span>
                </button>
              </div>

              {/* INPUT FORM (rounded-lg) */}
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative bg-gray-50 border border-gray-200 rounded-lg p-2 shadow-2xs">
                  {/* Transit line connecting pickup and drop */}
                  <div className="absolute left-[22px] sm:left-[24px] top-[28px] bottom-[28px] w-[2px] bg-gray-400 pointer-events-none" />

                  {/* PICKUP INPUT */}
                  <div className="relative flex items-center bg-white rounded-md border border-gray-200 px-2 py-1 focus-within:border-gray-900 transition">
                    <div className="w-8 flex items-center justify-center flex-shrink-0">
                      <span className="w-3 h-3 rounded-full border-[2.5px] border-black bg-white" />
                    </div>
                    <input
                      type="text"
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      placeholder="Enter pickup point"
                      className="w-full py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      title="Use current location"
                      className="p-1.5 text-gray-500 hover:text-black transition flex-shrink-0 active:scale-90"
                    >
                      <Navigation
                        size={16}
                        className={isLocating ? "animate-spin text-black" : ""}
                      />
                    </button>
                  </div>

                  <div className="my-1.5" />

                  {/* DROPOFF INPUT */}
                  <div className="relative flex items-center bg-white rounded-md border border-gray-200 px-2 py-1 focus-within:border-gray-900 transition">
                    <div className="w-8 flex items-center justify-center flex-shrink-0">
                      <span className="w-2.5 h-2.5 bg-black" />
                    </div>
                    <input
                      type="text"
                      value={drop}
                      onChange={(e) => setDrop(e.target.value)}
                      placeholder="Enter drop destination"
                      className="w-full py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>

                {/* TIMING SELECTOR (rounded-md) */}
                <div className="flex items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setIsScheduled(false)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition active:scale-95 ${
                      !isScheduled
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Leave Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsScheduled(true)}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition active:scale-95 ${
                      isScheduled
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    Schedule Later
                  </button>
                </div>

                {/* PRIMARY CTA BUTTON (rounded-lg) */}
                <button
                  type="submit"
                  className="w-full py-3.5 bg-black hover:bg-gray-800 text-white font-bold text-sm sm:text-base rounded-lg active:scale-[0.98] transition shadow-xs flex items-center justify-center gap-2 cursor-pointer mt-1"
                >
                  <span>Search Available Rides</span>
                  <ArrowRight size={18} strokeWidth={2.5} />
                </button>
              </form>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: LIGHT THEMED FLEET SHOWCASE ================= */}
          <div className="lg:col-span-5 hidden lg:block">
            <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
              
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Available Fleet</h3>
                  <p className="text-xs text-gray-500">Live booking across your city</p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live Dispatch</span>
                </div>
              </div>

              {/* COMPACT LIGHT-THEMED FLEET TILES (rounded-lg) */}
              <div className="space-y-2.5">
                <div
                  onClick={() => {
                    setTripMode("ride");
                    handleSubmit();
                  }}
                  className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200/80 flex items-center justify-between cursor-pointer transition active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <CarMiniIcon size={34} />
                    <div>
                      <p className="font-bold text-sm text-gray-900">City Cabs & Mini</p>
                      <p className="text-xs text-gray-500">Comfortable AC cars for daily commute</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>

                <div
                  onClick={() => {
                    setTripMode("ride");
                    handleSubmit();
                  }}
                  className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200/80 flex items-center justify-between cursor-pointer transition active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <AutoRickshawIcon size={34} />
                    <div>
                      <p className="font-bold text-sm text-gray-900">Auto Rickshaw</p>
                      <p className="text-xs text-gray-500">Affordable, quick doorstep rides</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>

                <div
                  onClick={() => {
                    setTripMode("ride");
                    handleSubmit();
                  }}
                  className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200/80 flex items-center justify-between cursor-pointer transition active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <BikeIcon size={34} />
                    <div>
                      <p className="font-bold text-sm text-gray-900">Bike Taxi</p>
                      <p className="text-xs text-gray-500">Zip through traffic effortlessly</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>

                <div
                  onClick={() => {
                    setTripMode("cargo");
                    handleSubmit();
                  }}
                  className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200/80 flex items-center justify-between cursor-pointer transition active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <ExpressMiniIcon size={34} />
                    <div>
                      <p className="font-bold text-sm text-gray-900">Express Cargo Trucks</p>
                      <p className="text-xs text-gray-500">Mini trucks for heavy goods & parcels</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>

              {/* CLEAN PARTNER CALLOUT (LIGHT THEME) */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-800">Drive or List Your Vehicle</p>
                  <p className="text-[11px] text-gray-500">Keep 100% of your earnings</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/partner/onboard/vehicle")}
                  className="px-3 py-1.5 rounded-lg bg-black text-white font-bold text-xs hover:bg-gray-800 transition active:scale-95"
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
