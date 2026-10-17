"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  MapPin,
  Navigation,
  Clock,
  Calendar,
  Sparkles,
  ArrowRight,
  Shield,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import {
  CarMiniIcon,
  ExpressMiniIcon,
  BikeIcon,
  AutoRickshawIcon,
} from "@/shared/components/VehicleIcons";

export default function HeroSection({
  onAuthRequired,
}: {
  onAuthRequired: () => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { userData } = useSelector((state: RootState) => state.user);

  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [scheduleTime, setScheduleTime] = useState<"now" | "later">("now");

  /* Auto-detect user current location */
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
            if (data?.address) {
              setPickup(data.address);
            } else {
              setPickup("Current Location");
            }
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

  /* Direct booking / prices transition */
  const handleSeePrices = (e?: React.FormEvent) => {
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
    if (scheduleTime === "later") params.set("reserve", "true");

    router.push(`/book?${params.toString()}`);
  };

  const handleSuggestionClick = (category: string) => {
    if (!userData) {
      onAuthRequired();
      return;
    }
    router.push(`/book?fresh=true&category=${category}`);
  };

  return (
    <section className="w-full bg-white text-zinc-950 px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="max-w-7xl mx-auto">
        {/* ================= TOP SUGGESTIONS ROW (UBER STYLE) ================= */}
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3">
            {t("hero.suggestions", "Suggestions")}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. RIDE */}
            <motion.div
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSuggestionClick("cars")}
              className="relative bg-[#F3F3F3] hover:bg-[#EAEAEA] border border-zinc-200/80 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center cursor-pointer transition shadow-xs group"
            >
              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider">
                Promo
              </div>
              <div className="h-14 sm:h-16 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <CarMiniIcon size={64} />
              </div>
              <span className="font-extrabold text-sm sm:text-base text-zinc-950">Ride</span>
              <span className="text-[11px] text-zinc-500 font-semibold mt-0.5">Anywhere in town</span>
            </motion.div>

            {/* 2. FREIGHT / GOODS */}
            <motion.div
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSuggestionClick("trucks")}
              className="relative bg-[#F3F3F3] hover:bg-[#EAEAEA] border border-zinc-200/80 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center cursor-pointer transition shadow-xs group"
            >
              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider">
                Promo
              </div>
              <div className="h-14 sm:h-16 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                <ExpressMiniIcon size={64} />
              </div>
              <span className="font-extrabold text-sm sm:text-base text-zinc-950">Express Mini</span>
              <span className="text-[11px] text-zinc-500 font-semibold mt-0.5">Fast parcel & cargo</span>
            </motion.div>

            {/* 3. RESERVE */}
            <motion.div
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                setScheduleTime("later");
                handleSeePrices();
              }}
              className="relative bg-[#F3F3F3] hover:bg-[#EAEAEA] border border-zinc-200/80 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center cursor-pointer transition shadow-xs group"
            >
              <div className="h-14 sm:h-16 flex items-center justify-center mb-1 text-zinc-900 group-hover:scale-105 transition-transform">
                <Calendar size={44} strokeWidth={2.2} />
              </div>
              <span className="font-extrabold text-sm sm:text-base text-zinc-950">Reserve</span>
              <span className="text-[11px] text-zinc-500 font-semibold mt-0.5">Plan ahead in peace</span>
            </motion.div>

            {/* 4. RENTALS */}
            <motion.div
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSuggestionClick("all")}
              className="relative bg-[#F3F3F3] hover:bg-[#EAEAEA] border border-zinc-200/80 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center cursor-pointer transition shadow-xs group"
            >
              <div className="h-14 sm:h-16 flex items-center justify-center mb-1 text-zinc-900 group-hover:scale-105 transition-transform">
                <KeyRound size={44} strokeWidth={2.2} />
              </div>
              <span className="font-extrabold text-sm sm:text-base text-zinc-950">Rentals</span>
              <span className="text-[11px] text-zinc-500 font-semibold mt-0.5">Hourly flexibility</span>
            </motion.div>
          </div>
        </div>

        {/* ================= MAIN BOOKING GRID: UBER / RAPIDO LAYOUT ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* LEFT COLUMN: REQUEST A RIDE CARD (7 COLS ON DESKTOP) */}
          <div className="lg:col-span-7 space-y-6">
            {/* CITY & REGION BADGE */}
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-600">
              <MapPin size={17} className="text-zinc-900 fill-zinc-900" />
              <span className="text-zinc-900 font-extrabold">Itanagar, Arunachal Pradesh</span>
              <span className="text-zinc-400">•</span>
              <button
                type="button"
                onClick={handleDetectLocation}
                className="text-black font-extrabold underline hover:text-zinc-700 transition"
              >
                Change city
              </button>
            </div>

            {/* GIANT HEADLINE (300% BOOST) */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-black tracking-tight leading-[1.08]">
                Request a ride
              </h1>
              <p className="mt-2 text-base sm:text-lg text-zinc-600 font-medium">
                Quick, affordable, guaranteed rides right at your doorstep.
              </p>
            </div>

            {/* PICKUP TIMING PILL */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setScheduleTime("now")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-extrabold transition active:scale-95 ${
                  scheduleTime === "now"
                    ? "bg-black text-white shadow-sm"
                    : "bg-[#F3F3F3] text-zinc-700 hover:bg-[#EAEAEA]"
                }`}
              >
                <Clock size={16} />
                <span>Pickup now</span>
              </button>

              <button
                type="button"
                onClick={() => setScheduleTime("later")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-extrabold transition active:scale-95 ${
                  scheduleTime === "later"
                    ? "bg-black text-white shadow-sm"
                    : "bg-[#F3F3F3] text-zinc-700 hover:bg-[#EAEAEA]"
                }`}
              >
                <Calendar size={16} />
                <span>Schedule later</span>
              </button>
            </div>

            {/* CONNECTED TRANSIT INPUT FORM */}
            <form onSubmit={handleSeePrices} className="space-y-3 pt-1">
              <div className="relative bg-[#F3F3F3] rounded-2xl p-2.5 sm:p-3 border border-zinc-200/80">
                {/* VERTICAL TRANSIT CONNECTOR LINE */}
                <div className="absolute left-[27px] sm:left-[31px] top-[34px] bottom-[34px] w-[2px] bg-zinc-900 z-10 pointer-events-none" />

                {/* PICKUP INPUT ROW */}
                <div className="relative flex items-center bg-white rounded-xl border border-zinc-200/60 shadow-xs focus-within:border-black transition">
                  <div className="w-12 sm:w-14 flex items-center justify-center flex-shrink-0 z-20">
                    <span className="w-3.5 h-3.5 rounded-full border-[3px] border-black bg-white" />
                  </div>
                  <input
                    type="text"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                    placeholder="Enter pickup location"
                    className="w-full py-4 text-base sm:text-lg font-bold text-zinc-950 placeholder:text-zinc-400 focus:outline-none bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    title="Use current GPS location"
                    className="p-3 text-zinc-500 hover:text-black transition flex-shrink-0 active:scale-90"
                  >
                    <Navigation
                      size={20}
                      className={isLocating ? "animate-spin text-black" : ""}
                    />
                  </button>
                </div>

                {/* DESTINATION INPUT ROW */}
                <div className="relative flex items-center bg-white rounded-xl border border-zinc-200/60 shadow-xs focus-within:border-black transition mt-2.5">
                  <div className="w-12 sm:w-14 flex items-center justify-center flex-shrink-0 z-20">
                    <span className="w-3 h-3 bg-black" />
                  </div>
                  <input
                    type="text"
                    value={drop}
                    onChange={(e) => setDrop(e.target.value)}
                    placeholder="Enter destination"
                    className="w-full py-4 text-base sm:text-lg font-bold text-zinc-950 placeholder:text-zinc-400 focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              {/* SEE PRICES / BOOK RIDE BUTTON */}
              <button
                type="submit"
                className="w-full py-4 sm:py-4.5 bg-black hover:bg-zinc-800 text-white font-black text-lg sm:text-xl rounded-2xl active:scale-[0.98] transition shadow-lg flex items-center justify-center gap-3 cursor-pointer"
              >
                <span>See prices</span>
                <ArrowRight size={22} strokeWidth={2.5} />
              </button>
            </form>

            {/* TRUST GUARANTEES PILL BAR */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-bold text-zinc-500">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Zero Surge Exploitation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield size={16} className="text-zinc-900" />
                <span>Verified Drivers & Live GPS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Sparkles size={16} className="text-amber-500" />
                <span>Guaranteed Direct Net Driver Pay</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: RAPIDO / UBER VEHICLE SHOWCASE CARD (5 COLS ON DESKTOP) */}
          <div className="lg:col-span-5 hidden lg:block">
            <div className="relative bg-zinc-950 text-white rounded-3xl p-8 overflow-hidden shadow-2xl border border-zinc-800">
              {/* BRAND ACCENT PILL */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-black text-xs font-black uppercase tracking-wider mb-6">
                <span>RideNow Fleet</span>
              </div>

              <h3 className="text-3xl font-black tracking-tight leading-tight">
                India&apos;s #1 Local Booking Platform
              </h3>
              <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
                From bikes navigating tight city traffic to express mini trucks hauling tons of cargo, book instantly with transparent pricing.
              </p>

              {/* VEHICLE SHOWCASE ICONS */}
              <div className="grid grid-cols-2 gap-3 mt-8">
                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-3">
                  <BikeIcon size={44} />
                  <div>
                    <p className="text-sm font-extrabold text-white">Bike Taxi</p>
                    <p className="text-xs text-zinc-400">Beat traffic fast</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-3">
                  <AutoRickshawIcon size={44} />
                  <div>
                    <p className="text-sm font-extrabold text-white">Auto</p>
                    <p className="text-xs text-zinc-400">Everyday rides</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-3">
                  <CarMiniIcon size={44} />
                  <div>
                    <p className="text-sm font-extrabold text-white">Cab Mini</p>
                    <p className="text-xs text-zinc-400">Comfortable AC</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center gap-3">
                  <ExpressMiniIcon size={44} />
                  <div>
                    <p className="text-sm font-extrabold text-white">Express Cargo</p>
                    <p className="text-xs text-zinc-400">Doorstep delivery</p>
                  </div>
                </div>
              </div>

              {/* PARTNER CTA */}
              <div className="mt-8 pt-6 border-t border-zinc-800 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Own a vehicle?</p>
                  <p className="text-sm font-extrabold text-white">Earn with zero commission fees</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/partner/onboard/vehicle")}
                  className="px-4 py-2.5 rounded-full bg-white text-black font-extrabold text-xs hover:bg-zinc-200 transition active:scale-95"
                >
                  Drive with us
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
