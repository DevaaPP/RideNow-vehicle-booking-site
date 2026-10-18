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
  Wallet,
  Zap,
  Calendar,
  ShieldCheck,
  Users,
  IndianRupee,
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
    <section className="relative w-full text-[#10251C] px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 lg:pt-32 pb-20 sm:pb-24 lg:pb-28 overflow-visible">
      {/* ================= HERO BACKGROUND (Assam golden-hour river-and-bridge) ================= */}
      <Image
        src="/hero/back.webp"
        alt="Assam Brahmaputra Bridge Golden Hour River Sunset"
        fill
        priority
        quality={94}
        sizes="100vw"
        className="object-cover object-top sm:object-center pointer-events-none"
      />
      {/* Controlled, soft atmospheric gradient overlay to preserve natural golden river tones while ensuring high text contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/35 via-white/10 to-white/40 dark:from-black/75 dark:via-[#101713]/60 dark:to-[#101713] pointer-events-none" />

      {/* ================= HERO CONTENT CONTAINER ================= */}
      <div className="relative z-10 max-w-7xl mx-auto">
        
        {/* EYEBROW & HERO HEADLINE */}
        <div className="mb-5 sm:mb-8 text-left max-w-3xl">
          {/* Eyebrow: MORE THAN A RIDE. — */}
          <div className="flex items-center gap-2.5 sm:gap-3 mb-2 sm:mb-3">
            <span className="text-[10px] sm:text-[12px] font-black uppercase tracking-[0.25em] text-[#6d513a] dark:text-[#D7AC62]">
              MORE THAN A RIDE.
            </span>
            <span className="w-7 sm:w-10 h-[2px] bg-[#6d513a]/80 dark:bg-[#D7AC62]/80 rounded-full" />
          </div>

          {/* Headline: DM Serif Display in dark forest green (#10251C) with Assamese vermilion (#B83A24) brush strokes */}
          <h1
            style={{ fontFamily: "var(--font-serif), 'DM Serif Display', Georgia, serif" }}
            className="text-[38px] xs:text-[42px] sm:text-7xl lg:text-[80px] font-normal text-[#10251C] dark:text-[#F3F1E8] display-headline leading-[1.08] sm:leading-[1.05]"
          >
            Assam moves
            <br />
            <span className="relative inline-block mt-0.5 sm:mt-2">
              <span className="relative inline-block mr-1.5 sm:mr-3">
                with
                {/* Assamese-vermilion (#B83A24) subtle curved brush stroke under 'with' */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 100 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute left-0 -bottom-1.5 sm:-bottom-2 w-[85%] h-2 sm:h-3 text-[#B83A24] dark:text-[#E06A50] pointer-events-none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M4 6.5C24 4.5 76 4.5 96 6.5"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span className="relative inline-block">
                you.
                {/* Assamese-vermilion (#B83A24) subtle curved brush stroke under 'you.' */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 100 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="absolute left-0 -bottom-1.5 sm:-bottom-2 w-[80%] h-2 sm:h-3 text-[#B83A24] dark:text-[#E06A50] pointer-events-none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M4 6.5C24 4.5 76 4.5 96 6.5"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </span>
          </h1>

          <p className="mt-3 sm:mt-5 text-sm sm:text-lg lg:text-xl text-[#10251C]/85 dark:text-[#B8C2B8] font-medium tracking-normal leading-relaxed">
            {t("hero.tagline", "Honest upfront fares. 100% direct driver pay.")}
          </p>
        </div>

        {/* ================= BOOKING CONTAINER ================= */}
        <div className="w-full max-w-[660px]">
          <div className="flex flex-col justify-between">
            {/* TRIP MODE SELECTOR: 2-mode segmented control in warm ivory surface */}
            <div className="grid grid-cols-2 sm:inline-flex sm:self-start items-center gap-1 sm:gap-1.5 p-1 bg-[#F7F1E5] dark:bg-[#17211B] rounded-[10px] mb-3 border border-[#e2dac7] dark:border-[#34443A] shadow-2xs w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setTripMode("ride")}
                className={`py-2 sm:py-2.5 px-3 sm:px-6 rounded-[7px] text-xs sm:text-sm font-bold transition active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2 shrink-0 ${
                  tripMode === "ride"
                    ? "bg-[#123D32] dark:bg-[#28664D] text-white shadow-xs"
                    : "text-[#10251C]/80 dark:text-[#F3F1E8]/80 hover:text-[#10251C] dark:hover:text-[#F3F1E8] hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" strokeWidth={2.5} />
                <span className="truncate">{t("hero.dailyRides", "Daily Rides")}</span>
              </button>

              <button
                type="button"
                onClick={() => setTripMode("cargo")}
                className={`py-2 sm:py-2.5 px-3 sm:px-6 rounded-[7px] text-xs sm:text-sm font-bold transition active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2 shrink-0 ${
                  tripMode === "cargo"
                    ? "bg-[#123D32] dark:bg-[#28664D] text-white shadow-xs"
                    : "text-[#10251C]/80 dark:text-[#F3F1E8]/80 hover:text-[#10251C] dark:hover:text-[#F3F1E8] hover:bg-black/5 dark:hover:bg-white/5"
                }`}
              >
                <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" strokeWidth={2.5} />
                <span className="truncate">{t("hero.parcelCargo", "Parcel & Cargo")}</span>
              </button>
            </div>

            {/* MAIN BOOKING FORM */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div ref={containerRef} className="relative z-30">
                {/* LOCATION PANEL: Restrained ivory surface #F7F1E5, 12px radius, 1px border, minimal shadow */}
                <div className="relative bg-[#F7F1E5] dark:bg-[#17211B] border border-[#e2dac7] dark:border-[#34443A] rounded-[12px] divide-y divide-[#e2dac7] dark:divide-[#29372E] overflow-hidden shadow-2xs">
                  {/* Vertical transit dotted connector line perfectly centered through the 20px marker icon column */}
                  <div className="absolute left-[25px] sm:left-[29px] top-[26px] bottom-[26px] w-[2px] border-l-2 border-dashed border-forest/30 dark:border-forest/50 pointer-events-none z-10" />

                  {/* PICKUP ROW */}
                  <div className="relative flex items-center gap-3.5 px-4 sm:px-5 py-3.5 transition focus-within:bg-[#FAF7F0] dark:focus-within:bg-[#1E2B23] rounded-none">
                    {/* Green pickup marker (fixed 20px column, centered dot) */}
                    <div className="w-5 h-5 flex items-center justify-center shrink-0 z-20">
                      <div className="w-4 h-4 rounded-full border-[3px] border-forest dark:border-[#388463] bg-[#F7F1E5] dark:bg-[#17211B] shadow-2xs" />
                    </div>

                    <div className="min-w-0 flex-1">
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
                        className="w-full text-base sm:text-lg font-bold text-[#10251C] dark:text-[#F3F1E8] placeholder:text-[#10251C]/80 dark:placeholder:text-[#F3F1E8]/60 placeholder:font-bold focus:outline-none bg-transparent"
                      />
                      <p className="text-xs text-[#10251C]/50 dark:text-[#929D93] font-medium leading-tight">
                        {t("hero.pickupHint", "Use current location or search")}
                      </p>
                    </div>

                    {pickup && (
                      <button
                        type="button"
                        onClick={() => {
                          setPickup("");
                          setPickupLat(null);
                          setPickupLng(null);
                          setSuggestions([]);
                        }}
                        className="p-1.5 text-stone-400 dark:text-[#929D93] hover:text-stone-700 dark:hover:text-[#F3F1E8] transition"
                        title="Clear pickup"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    {/* Current-location action right-aligned without overlapping input */}
                    <div className="pl-3 border-l border-[#e2dac7] dark:border-[#29372E]">
                      <button
                        type="button"
                        onClick={handleDetectLocation}
                        title="Use current location"
                        className="px-2.5 py-1 text-forest dark:text-[#388463] hover:text-forest-hover dark:hover:text-emerald-400 text-xs font-bold transition flex items-center gap-1.5 shrink-0 active:scale-95 rounded-[6px] hover:bg-forest/5 dark:hover:bg-white/5"
                      >
                        <Navigation
                          className={`w-3.5 h-3.5 text-forest dark:text-[#388463] ${isLocating ? "animate-spin" : ""}`}
                        />
                        <span>{t("hero.current", "Current")}</span>
                      </button>
                    </div>
                  </div>

                  {/* DROP DESTINATION ROW */}
                  <div className="relative flex items-center gap-3.5 px-4 sm:px-5 py-3.5 transition focus-within:bg-[#FAF7F0] dark:focus-within:bg-[#1E2B23] rounded-none">
                    {/* Vermilion destination marker (fixed 20px column, centered dot) */}
                    <div className="w-5 h-5 flex items-center justify-center shrink-0 z-20">
                      <div className="w-4 h-4 rounded-full border-[3px] border-[#B83A24] dark:border-[#E06A50] bg-[#F7F1E5] dark:bg-[#17211B] shadow-2xs" />
                    </div>

                    <div className="min-w-0 flex-1">
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
                        className="w-full text-base sm:text-lg font-bold text-[#10251C] dark:text-[#F3F1E8] placeholder:text-[#10251C]/80 dark:placeholder:text-[#F3F1E8]/60 placeholder:font-bold focus:outline-none bg-transparent"
                      />
                      <p className="text-xs text-[#10251C]/50 dark:text-[#929D93] font-medium leading-tight">
                        {t("hero.dropHint", "Where are you going?")}
                      </p>
                    </div>

                    {drop && (
                      <button
                        type="button"
                        onClick={() => {
                          setDrop("");
                          setDropLat(null);
                          setDropLng(null);
                          setSuggestions([]);
                        }}
                        className="p-1.5 text-stone-400 dark:text-[#929D93] hover:text-stone-700 dark:hover:text-[#F3F1E8] transition"
                        title="Clear destination"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* AUTOCOMPLETE SUGGESTIONS DROPDOWN */}
                {activeField && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-[#FAF7F0] dark:bg-[#17211B] rounded-[10px] shadow-xl border border-[#e2dac7] dark:border-[#34443A] z-50 overflow-hidden max-h-72 overflow-y-auto">
                    <div className="px-4 py-2 border-b border-[#e2dac7] dark:border-[#29372E] flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-stone-500 dark:text-[#929D93] bg-[#F7F1E5] dark:bg-[#1E2B23]">
                      <span>Suggestions for {activeField === "pickup" ? "Pickup Point" : "Drop Destination"}</span>
                      {isLoadingSuggestions && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-forest dark:text-[#388463]" />
                      )}
                    </div>
                    <div className="divide-y divide-[#e2dac7]/60 dark:divide-[#29372E]">
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
                            className="w-full text-left px-4 py-3 hover:bg-[#F7F1E5] dark:hover:bg-[#1E2B23] transition flex items-start gap-3 cursor-pointer group"
                          >
                            <div className="w-7 h-7 rounded-[8px] bg-forest/10 dark:bg-forest/20 group-hover:bg-forest text-forest dark:text-[#388463] group-hover:text-white flex items-center justify-center shrink-0 mt-0.5 transition">
                              <MapPin size={14} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-sm text-[#10251C] dark:text-[#F3F1E8] truncate">
                                {title}
                              </p>
                              {subtitle && (
                                <p className="text-xs text-stone-500 dark:text-[#929D93] truncate mt-0.5">
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

                {/* BOTTOM ACTION BUTTONS ROW: 8px radius tokens */}
                <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsScheduled((prev) => !prev)}
                    className={`px-5 py-3 rounded-[8px] border text-sm font-bold transition active:scale-[0.97] flex items-center justify-center gap-2 shrink-0 ${
                      isScheduled
                        ? "bg-[#123D32] dark:bg-[#28664D] text-white border-[#123D32] dark:border-[#28664D]"
                        : "bg-white dark:bg-[#17211B] hover:bg-[#FAF7F0] dark:hover:bg-[#1E2B23] text-[#10251C] dark:text-[#F3F1E8] border-[#e2dac7] dark:border-[#34443A] shadow-2xs"
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-[#10251C]/70 dark:text-[#B8C2B8]" />
                    <span>{isScheduled ? "Scheduled" : "Schedule Later"}</span>
                  </button>

                  <button
                    type="submit"
                    className="group flex-1 py-3 px-6 bg-[#123D32] dark:bg-[#28664D] hover:bg-[#0D3027] dark:hover:bg-[#347858] text-white font-bold text-base rounded-[8px] active:scale-[0.97] transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#123D32]"
                  >
                    <span className="text-white font-bold">{t("hero.searchRides", "Search Available Rides")}</span>
                    <ArrowRight className="w-4 h-4 text-[#D7AC62] transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* ================= MOBILE BENEFIT STRIP (Directly beneath booking form on small screens) ================= */}
      <div className="md:hidden mt-5 w-full">
        <div className="bg-[#F7F1E5] dark:bg-[#17211B] border border-[#DED7CA] dark:border-[#34443A] rounded-[12px] p-3 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[6px] bg-[#123D32] dark:bg-[#28664D] text-[#F7F1E5] dark:text-[#F3F1E8] flex items-center justify-center shrink-0">
              <IndianRupee className="w-4 h-4 text-[#F7F1E5] dark:text-[#F3F1E8]" strokeWidth={2.4} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#10251C] dark:text-[#F3F1E8] leading-snug">Transparent Pricing</h4>
              <p className="text-[10px] text-[#10251C]/70 dark:text-[#929D93]">Know your fare before you ride</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[6px] bg-[#123D32] dark:bg-[#28664D] text-[#F7F1E5] dark:text-[#F3F1E8] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#F7F1E5] dark:text-[#F3F1E8]" strokeWidth={2.4} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#10251C] dark:text-[#F3F1E8] leading-snug">100% Direct Driver Pay</h4>
              <p className="text-[10px] text-[#10251C]/70 dark:text-[#929D93]">Fair earnings for driver partners</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[6px] bg-[#123D32] dark:bg-[#28664D] text-[#F7F1E5] dark:text-[#F3F1E8] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-[#F7F1E5] dark:text-[#F3F1E8]" strokeWidth={2.4} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#10251C] dark:text-[#F3F1E8] leading-snug">A Local Service for Our People</h4>
              <p className="text-[10px] text-[#10251C]/70 dark:text-[#929D93]">Built for Assam, by Assam</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= REFINED BENEFITS FEATURE STRIP STRADDLING HERO AND FLEET SECTION (DESKTOP) ================= */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-full max-w-5xl px-4 sm:px-6 z-30 hidden md:block pointer-events-auto">
        <div className="bg-[#F7F1E5] dark:bg-[#17211B] border border-[#DED7CA] dark:border-[#34443A] rounded-[12px] py-3.5 lg:py-4 px-4 sm:px-6 shadow-[0_4px_16px_rgba(18,61,50,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.4)] grid grid-cols-3 divide-x divide-[#DED7CA] dark:divide-[#29372E]">
          {/* Item 1: Transparent Pricing */}
          <div className="flex items-center gap-3 lg:gap-3.5 px-2 sm:px-3 lg:px-4">
            <div className="w-10 h-10 rounded-[8px] bg-[#123D32] dark:bg-[#28664D] text-[#F7F1E5] dark:text-[#F3F1E8] flex items-center justify-center shrink-0 shadow-2xs border border-[#0D3027] dark:border-[#347858]">
              <IndianRupee className="w-4.5 h-4.5 text-[#F7F1E5] dark:text-[#F3F1E8]" strokeWidth={2.4} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm lg:text-[14px] font-bold text-[#10251C] dark:text-[#F3F1E8] leading-snug tracking-tight">
                Transparent Pricing
              </h4>
              <p className="text-[11px] lg:text-xs text-[#10251C]/70 dark:text-[#929D93] font-medium leading-normal mt-0.5">
                Know your fare before you ride
              </p>
            </div>
          </div>

          {/* Item 2: 100% Direct Driver Pay */}
          <div className="flex items-center gap-3 lg:gap-3.5 px-2 sm:px-3 lg:px-4">
            <div className="w-10 h-10 rounded-[8px] bg-[#123D32] dark:bg-[#28664D] text-[#F7F1E5] dark:text-[#F3F1E8] flex items-center justify-center shrink-0 shadow-2xs border border-[#0D3027] dark:border-[#347858]">
              <ShieldCheck className="w-4.5 h-4.5 text-[#F7F1E5] dark:text-[#F3F1E8]" strokeWidth={2.4} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm lg:text-[14px] font-bold text-[#10251C] dark:text-[#F3F1E8] leading-snug tracking-tight">
                100% Direct Driver Pay
              </h4>
              <p className="text-[11px] lg:text-xs text-[#10251C]/70 dark:text-[#929D93] font-medium leading-normal mt-0.5">
                Fair earnings for driver partners
              </p>
            </div>
          </div>

          {/* Item 3: A Local Service for Our People */}
          <div className="flex items-center gap-3 lg:gap-3.5 px-2 sm:px-3 lg:px-4">
            <div className="w-10 h-10 rounded-[8px] bg-[#123D32] dark:bg-[#28664D] text-[#F7F1E5] dark:text-[#F3F1E8] flex items-center justify-center shrink-0 shadow-2xs border border-[#0D3027] dark:border-[#347858]">
              <Users className="w-4.5 h-4.5 text-[#F7F1E5] dark:text-[#F3F1E8]" strokeWidth={2.4} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm lg:text-[14px] font-bold text-[#10251C] dark:text-[#F3F1E8] leading-snug tracking-tight">
                A Local Service for Our People
              </h4>
              <p className="text-[11px] lg:text-xs text-[#10251C]/70 dark:text-[#929D93] font-medium leading-normal mt-0.5">
                Built for Assam, by Assam
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
