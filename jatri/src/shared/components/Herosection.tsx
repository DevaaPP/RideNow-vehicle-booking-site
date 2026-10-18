"use client";

import { useState, useEffect, useRef } from "react";
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
  MapPin,
  X,
  Loader2,
} from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

type TripMode = "ride" | "cargo";

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
  const [pickupLat, setPickupLat] = useState<number | null>(null);
  const [pickupLng, setPickupLng] = useState<number | null>(null);
  const [dropLat, setDropLat] = useState<number | null>(null);
  const [dropLng, setDropLng] = useState<number | null>(null);

  const [activeField, setActiveField] = useState<"pickup" | "drop" | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveField(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions for active input with debounce
  useEffect(() => {
    const query = activeField === "pickup" ? pickup : activeField === "drop" ? drop : "";
    if (!activeField || !query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const res = await fetch(`/api/places?action=autocomplete&input=${encodeURIComponent(query.trim())}&country=in`);
        const data = await res.json();
        if (data?.predictions && Array.isArray(data.predictions)) {
          setSuggestions(data.predictions);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.warn("Hero places autocomplete error:", err);
        setSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [pickup, drop, activeField]);

  // Handle selecting a place suggestion
  const handleSelectSuggestion = async (item: any, field: "pickup" | "drop") => {
    const formatted = item.subtitle ? `${item.title || item.name || item.description}, ${item.subtitle}` : (item.title || item.name || item.description);
    let lat = item.lat;
    let lng = item.lng;

    if ((lat === undefined || lng === undefined) && item.place_id) {
      try {
        const res = await fetch(`/api/places?action=details&placeId=${item.place_id}`);
        const data = await res.json();
        if (data?.result?.geometry?.location) {
          lat = data.result.geometry.location.lat;
          lng = data.result.geometry.location.lng;
        }
      } catch (err) {
        console.warn("Could not fetch details for place", err);
      }
    }

    if (field === "pickup") {
      setPickup(formatted);
      if (typeof lat === "number" && typeof lng === "number") {
        setPickupLat(lat);
        setPickupLng(lng);
      }
    } else {
      setDrop(formatted);
      if (typeof lat === "number" && typeof lng === "number") {
        setDropLat(lat);
        setDropLng(lng);
      }
    }

    setSuggestions([]);
    setActiveField(null);
  };

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
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setPickupLat(lat);
          setPickupLng(lng);
          const res = await fetch(`/api/places?lat=${lat}&lng=${lng}`);
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

    const trimmedPickup = pickup.trim();
    const trimmedDrop = drop.trim();

    // Prepare draft to persist in storage so /book always remembers it
    const draftData: any = {
      pickup: trimmedPickup || undefined,
      drop: trimmedDrop || undefined,
      pickupLat: pickupLat ?? undefined,
      pickupLng: pickupLng ?? undefined,
      dropLat: dropLat ?? undefined,
      dropLng: dropLng ?? undefined,
      vehicle: tripMode === "cargo" ? "trucks" : "car",
      category: tripMode === "cargo" ? "trucks" : "cars",
      isScheduled,
    };

    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("ridenow_booking_draft", JSON.stringify(draftData));
        localStorage.setItem("ridenow_booking_draft", JSON.stringify(draftData));
      } catch (_) {}
    }

    const params = new URLSearchParams();
    if (trimmedPickup) params.set("pickup", trimmedPickup);
    if (trimmedDrop) params.set("drop", trimmedDrop);
    if (pickupLat !== null) params.set("pickupLat", String(pickupLat));
    if (pickupLng !== null) params.set("pickupLng", String(pickupLng));
    if (dropLat !== null) params.set("dropLat", String(dropLat));
    if (dropLng !== null) params.set("dropLng", String(dropLng));

    if (tripMode === "cargo") {
      params.set("category", "trucks");
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
            {t("hero.headlinePart1", "Move anything,")}{" "}
            <br className="hidden sm:inline" />
            {t("hero.headlinePart2", "go anywhere.")}
          </h1>
          <p className="mt-2 text-sm sm:text-lg lg:text-xl text-zinc-200 font-bold drop-shadow-sm">
            {t("hero.tagline", "Honest upfront fares. 100% direct driver pay.")}
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
                  <span>{t("hero.dailyRides", "Daily Rides")}</span>
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
                  <span>{t("hero.parcelCargo", "Parcel & Cargo")}</span>
                </button>
              </div>

              {/* STREAMLINED LOCATION FORM (UBER/RAPIDO UNIFIED CONTAINER) */}
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div ref={containerRef} className="relative z-30">
                  <div className="relative bg-white border border-stone-200/90 rounded-xl sm:rounded-2xl shadow-2xl focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/20 transition">
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
                      <div className="h-[54px] sm:h-[76px] flex items-center border-b border-stone-200/90 gap-1">
                        <input
                          type="text"
                          value={pickup}
                          onFocus={() => setActiveField("pickup")}
                          onChange={(e) => {
                            setPickup(e.target.value);
                            setPickupLat(null);
                            setPickupLng(null);
                            setActiveField("pickup");
                          }}
                          placeholder={t("hero.enterPickup", "Enter pickup point")}
                          className="w-full py-2.5 sm:py-3 text-base sm:text-xl md:text-2xl font-bold sm:font-black text-stone-900 placeholder:text-stone-400 placeholder:font-semibold sm:placeholder:font-bold focus:outline-none bg-transparent"
                        />
                        {pickup && (
                          <button
                            type="button"
                            onClick={() => {
                              setPickup("");
                              setPickupLat(null);
                              setPickupLng(null);
                              setSuggestions([]);
                            }}
                            className="p-1.5 text-stone-400 hover:text-stone-700 transition"
                            title="Clear pickup"
                          >
                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        )}
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
                      <div className="h-[54px] sm:h-[76px] flex items-center gap-1">
                        <input
                          type="text"
                          value={drop}
                          onFocus={() => setActiveField("drop")}
                          onChange={(e) => {
                            setDrop(e.target.value);
                            setDropLat(null);
                            setDropLng(null);
                            setActiveField("drop");
                          }}
                          placeholder={t("hero.enterDrop", "Enter drop destination")}
                          className="w-full py-2.5 sm:py-3 text-base sm:text-xl md:text-2xl font-bold sm:font-black text-stone-900 placeholder:text-stone-400 placeholder:font-semibold sm:placeholder:font-bold focus:outline-none bg-transparent"
                        />
                        {drop && (
                          <button
                            type="button"
                            onClick={() => {
                              setDrop("");
                              setDropLat(null);
                              setDropLng(null);
                              setSuggestions([]);
                            }}
                            className="p-1.5 text-stone-400 hover:text-stone-700 transition"
                            title="Clear destination"
                          >
                            <X className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* AUTOCOMPLETE SUGGESTIONS DROPDOWN */}
                  {activeField && suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-stone-200 z-50 overflow-hidden max-h-72 overflow-y-auto">
                      <div className="px-4 py-2 border-b border-stone-100 flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-stone-500 bg-stone-50">
                        <span>Suggestions for {activeField === "pickup" ? "Pickup Point" : "Drop Destination"}</span>
                        {isLoadingSuggestions && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                        )}
                      </div>
                      <div className="divide-y divide-stone-100">
                        {suggestions.map((item, idx) => {
                          const title = item.title || item.name || item.description?.split(",")[0] || "Location";
                          const subtitle = item.subtitle || item.description?.split(",").slice(1).join(",").trim() || "";
                          return (
                            <button
                              key={item.place_id || item.id || idx}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectSuggestion(item, activeField);
                              }}
                              className="w-full text-left px-4 py-3 hover:bg-emerald-50/80 transition flex items-start gap-3 cursor-pointer group"
                            >
                              <div className="w-8 h-8 rounded-full bg-emerald-100/80 group-hover:bg-emerald-600 text-emerald-700 group-hover:text-white flex items-center justify-center shrink-0 mt-0.5 transition">
                                <MapPin size={15} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-sm text-stone-900 group-hover:text-emerald-950 truncate">
                                  {title}
                                </p>
                                {subtitle && (
                                  <p className="text-xs text-stone-500 group-hover:text-emerald-800/80 truncate mt-0.5">
                                    {subtitle}
                                  </p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
                    {t("hero.leaveNow", "Leave Now")}
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
                    {t("hero.scheduleLater", "Schedule Later")}
                  </button>
                </div>

                {/* PRIMARY ACTION BUTTON */}
                <button
                  type="submit"
                  className="w-full py-3.5 sm:py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base sm:text-xl md:text-2xl rounded-xl sm:rounded-2xl active:scale-[0.98] transition shadow-2xl flex items-center justify-center gap-2.5 sm:gap-3 cursor-pointer mt-2.5 sm:mt-3"
                >
                  <span>{t("hero.searchRides", "Search Available Rides")}</span>
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
                  {t("hero.partnerTitle", "Drive & Earn")}
                </h2>
                <p className="text-base sm:text-lg text-zinc-200 font-bold mt-2 drop-shadow-sm">
                  {t("hero.partnerSubtitle", "Transparent earnings with direct payouts.")}
                </p>
              </div>

              {/* 3 CLEAN FACTUAL BULLET POINTS (NO ICONS) */}
              <div className="space-y-4 pt-1">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0 shadow-sm" />
                  <span className="text-lg sm:text-xl lg:text-2xl font-black text-white drop-shadow-sm">
                    {t("hero.partnerPoint1", "Direct Cash & UPI Earnings")}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0 shadow-sm" />
                  <span className="text-lg sm:text-xl lg:text-2xl font-black text-white drop-shadow-sm">
                    {t("hero.partnerPoint2", "Fast Daily Bank Payouts")}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0 shadow-sm" />
                  <span className="text-lg sm:text-xl lg:text-2xl font-black text-white drop-shadow-sm">
                    {t("hero.partnerPoint3", "Drive On Your Own Schedule")}
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
                <span>{t("hero.partnerCta", "Partner With Us")}</span>
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
