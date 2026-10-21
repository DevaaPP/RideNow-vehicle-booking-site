"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  Search,
  LocateFixed,
  Car,
  CalendarDays,
  Plane,
  CalendarClock,
  Users,
  Package,
  ArrowRight,
  Sparkles,
  Loader2,
  MapPin,
  X,
} from "lucide-react";
import Nav from "@/shared/components/Nav";
import Footer from "@/shared/components/Footer";
import { useTranslation } from "@/context/LanguageContext";

interface ServiceCardItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  route: string;
}

const EXPLORE_SERVICES: ServiceCardItem[] = [
  {
    id: "daily-rides",
    title: "Daily Rides",
    subtitle: "Quick, safe and reliable",
    image: "/explore/explore_daily_rides.webp",
    icon: Car,
    route: "/book?category=cars",
  },
  {
    id: "outstation",
    title: "Outstation",
    subtitle: "Travel beyond the city",
    image: "/explore/explore_outstation.webp",
    icon: CalendarDays,
    route: "/book?category=cars&service=outstation",
  },
  {
    id: "airport",
    title: "Airport Transfers",
    subtitle: "Hassle-free airport travel",
    image: "/explore/explore_airport.webp",
    icon: Plane,
    route:
      "/book?drop=Lokpriya+Gopinath+Bordoloi+International+Airport,+Guwahati&dropLat=26.1061&dropLng=91.5859&category=cars",
  },
  {
    id: "schedule",
    title: "Schedule Booking",
    subtitle: "For car, rental and cargo",
    image: "/explore/explore_schedule.webp",
    icon: CalendarClock,
    route: "/book?reserve=true",
  },
  {
    id: "group",
    title: "Group Booking",
    subtitle: "Travel together, save more",
    image: "/explore/explore_group.webp",
    icon: Users,
    route: "/group/join",
  },
  {
    id: "cargo",
    title: "Parcel & Cargo",
    subtitle: "Send with trust",
    image: "/explore/explore_cargo.webp",
    icon: Package,
    route: "/book?category=trucks&serviceMode=logistics",
  },
];

export default function ExplorePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const shouldReduceMotion = useReducedMotion();

  const [query, setQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Places autocomplete debounced search
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/places?action=autocomplete&input=${encodeURIComponent(trimmed)}&country=in`
        );
        const data = await res.json();
        if (data?.predictions && Array.isArray(data.predictions)) {
          setSuggestions(data.predictions);
          setShowDropdown(true);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.warn("Explore search autocomplete error:", err);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle current GPS location click
  const handleCurrentLocationClick = () => {
    if (!navigator.geolocation) {
      router.push("/book?fresh=true");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`/api/places?action=reverse&lat=${latitude}&lng=${longitude}`);
          const data = await res.json();
          const placeName = data?.name || data?.address || "Current Location";

          const draftData = {
            pickup: placeName,
            pickupLat: latitude,
            pickupLng: longitude,
            category: "cars",
          };

          if (typeof window !== "undefined") {
            try {
              sessionStorage.setItem("ridenow_booking_draft", JSON.stringify(draftData));
              localStorage.setItem("ridenow_booking_draft", JSON.stringify(draftData));
            } catch (_) {}
          }

          router.push(
            `/book?pickup=${encodeURIComponent(placeName)}&pickupLat=${latitude}&pickupLng=${longitude}&category=cars`
          );
        } catch (_) {
          router.push(`/book?pickupLat=${latitude}&pickupLng=${longitude}&category=cars`);
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        router.push("/book?fresh=true");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Handle selecting a search suggestion
  const handleSelectSuggestion = (item: any) => {
    const placeName = item.title || item.name || item.description;
    const draftData: any = {
      drop: placeName,
      category: "cars",
    };
    if (item.lat && item.lng) {
      draftData.dropLat = item.lat;
      draftData.dropLng = item.lng;
    }
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("ridenow_booking_draft", JSON.stringify(draftData));
        localStorage.setItem("ridenow_booking_draft", JSON.stringify(draftData));
      } catch (_) {}
    }
    const params = new URLSearchParams();
    params.set("drop", placeName);
    if (item.lat && item.lng) {
      params.set("dropLat", String(item.lat));
      params.set("dropLng", String(item.lng));
    }
    params.set("category", "cars");
    setShowDropdown(false);
    router.push(`/book?${params.toString()}`);
  };

  // Submit search query
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      router.push("/book?fresh=true");
      return;
    }
    const draftData = {
      drop: query.trim(),
      category: "cars",
    };
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("ridenow_booking_draft", JSON.stringify(draftData));
        localStorage.setItem("ridenow_booking_draft", JSON.stringify(draftData));
      } catch (_) {}
    }
    router.push(`/book?drop=${encodeURIComponent(query.trim())}&category=cars`);
  };

  const handleGetawaysClick = () => {
    const getawayName = "Kaziranga National Park, Assam";
    const draftData = {
      drop: getawayName,
      dropLat: 26.5775,
      dropLng: 93.1711,
      category: "cars",
      service: "outstation",
    };
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("ridenow_booking_draft", JSON.stringify(draftData));
        localStorage.setItem("ridenow_booking_draft", JSON.stringify(draftData));
      } catch (_) {}
    }
    router.push(
      `/book?drop=${encodeURIComponent(getawayName)}&dropLat=26.5775&dropLng=93.1711&category=cars&service=outstation`
    );
  };

  return (
    <div className="w-full min-h-screen bg-[#FAF7F0] dark:bg-[#061A16] text-[#10251C] dark:text-[#F7F5ED] flex flex-col justify-between font-sans transition-colors duration-300">
      {/* Top Navbar */}
      <Nav />

      {/* Main Explore Experience */}
      <main className="w-full max-w-xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-28 pb-[calc(6.5rem+env(safe-area-inset-bottom,0px))] flex-1">
        {/* =========================================================================
            SECTION A: PROMINENT EXPLORE SEARCH BAR
            Search places, services or routes with GPS crosshairs icon
            ========================================================================= */}
        <div ref={searchContainerRef} className="relative mb-6">
          <form
            onSubmit={handleSearchSubmit}
            className="w-full bg-white dark:bg-[#FAF7F0] rounded-full shadow-[0_4px_20px_rgba(18,61,50,0.08)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.6)] border border-[#DED7CA]/90 dark:border-white/30 p-1.5 pl-4 sm:pl-5 flex items-center justify-between transition-all select-none"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Search size={19} className="text-[#696B64] dark:text-[#10251C]/70 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowDropdown(true);
                }}
                placeholder="Search places, services or routes"
                aria-label="Search places, services or routes"
                className="w-full bg-transparent text-[14px] sm:text-[15px] font-medium text-[#10251C] placeholder:text-[#696B64] dark:placeholder:text-[#10251C]/65 outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setSuggestions([]);
                    setShowDropdown(false);
                  }}
                  className="p-1 text-[#696B64] hover:text-[#10251C] shrink-0 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Location / Current GPS Crosshair Action */}
            <button
              type="button"
              onClick={handleCurrentLocationClick}
              disabled={isLocating}
              aria-label="Use current location"
              title="Use current location"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FAF7F0] dark:bg-white text-[#046A38] hover:bg-[#E5EBDD] flex items-center justify-center shrink-0 border border-[#DED7CA]/80 transition active:scale-90 cursor-pointer"
            >
              {isLocating ? (
                <Loader2 size={18} className="animate-spin text-[#046A38]" />
              ) : (
                <LocateFixed size={18} strokeWidth={2.4} />
              )}
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#0B2822] rounded-[16px] shadow-xl border border-[#DED7CA] dark:border-[#24483D] overflow-hidden z-30 max-h-60 overflow-y-auto">
              {suggestions.map((item, idx) => (
                <div
                  key={item.place_id || idx}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectSuggestion(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") handleSelectSuggestion(item);
                  }}
                  className="px-4 py-3 border-b border-[#DED7CA]/60 dark:border-[#24483D]/60 last:border-b-0 hover:bg-[#FAF7F0] dark:hover:bg-[#10352C] flex items-center gap-3 cursor-pointer transition select-none"
                >
                  <MapPin size={17} className="text-[#046A38] dark:text-[#34D399] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#10251C] dark:text-[#F7F5ED] truncate">
                      {item.title || item.name || item.description}
                    </p>
                    {item.subtitle && (
                      <p className="text-[11px] text-[#696B64] dark:text-[#B9C8BF] truncate">
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* =========================================================================
            SECTION B: EDITORIAL HEADLINE
            "Not just a ride / A fuller journey."
            "EXPLORE ASSAM, YOUR WAY"
            ========================================================================= */}
        <div className="mb-6">
          {/* Eyebrow Tagline */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="mb-2"
          >
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.14em] uppercase text-[#123D32] dark:text-[#B9C8BF] bg-white/80 dark:bg-[#0B2822]/85 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#DED7CA]/70 dark:border-[#24483D] shadow-2xs">
              <Sparkles size={11} className="text-[#046A38] dark:text-[#34D399]" />
              <span>EXPLORE ASSAM, YOUR WAY</span>
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: [0.32, 0.72, 0, 1] }}
            className="font-serif text-[32px] sm:text-[38px] leading-[1.1] font-normal tracking-tight text-[#10251C] dark:text-[#FFFFFF]"
          >
            Not just a ride
            <br />
            <span className="font-serif italic text-[#123D32] dark:text-[#F7F5ED]">
              A fuller journey.
            </span>
          </motion.h1>
        </div>

        {/* =========================================================================
            SECTION C: 2-COLUMN SERVICE DISCOVERY GRID (6 CARDS)
            Daily Rides, Outstation, Airport Transfers, Schedule, Group, Cargo
            (No bus or ferry ticket services)
            ========================================================================= */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {EXPLORE_SERVICES.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.div
                key={service.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.35,
                  delay: 0.08 + index * 0.04,
                  ease: [0.32, 0.72, 0, 1],
                }}
                role="button"
                tabIndex={0}
                onClick={() => router.push(service.route)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") router.push(service.route);
                }}
                aria-label={`${service.title} - ${service.subtitle}`}
                className="relative h-[168px] sm:h-[195px] rounded-[16px] overflow-hidden shadow-[0_4px_14px_rgba(18,61,50,0.06)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.5)] border border-[#DED7CA]/80 dark:border-[#24483D] cursor-pointer group active:scale-[0.97] transition-all select-none"
              >
                {/* Background Image */}
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  sizes="(max-width: 640px) 180px, 240px"
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                />

                {/* Bottom Readability Gradient Overlay */}
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent pointer-events-none"
                  aria-hidden="true"
                />

                {/* Card Content at Bottom */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between gap-1.5 z-10">
                  <div className="min-w-0 flex-1 text-white">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <Icon size={16} strokeWidth={2.4} className="text-white shrink-0" />
                      <p className="text-[13px] sm:text-[14px] font-bold leading-tight truncate drop-shadow-sm">
                        {service.title}
                      </p>
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-white/85 font-medium leading-tight truncate">
                      {service.subtitle}
                    </p>
                  </div>

                  {/* Circular Action Arrow Button */}
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white text-[#10251C] flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 active:scale-95 transition-transform"
                    aria-hidden="true"
                  >
                    <ArrowRight size={14} strokeWidth={2.5} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* =========================================================================
            SECTION D: WEEKEND GETAWAYS BANNER
            Wide scenic banner navigating to destination discovery / getaway bookings
            ========================================================================= */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35, ease: [0.32, 0.72, 0, 1] }}
          role="button"
          tabIndex={0}
          onClick={handleGetawaysClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleGetawaysClick();
          }}
          aria-label="Weekend Getaways - Explore Assam's hidden gems"
          className="relative w-full h-[145px] sm:h-[165px] rounded-[16px] overflow-hidden shadow-[0_6px_20px_rgba(18,61,50,0.08)] dark:shadow-[0_6px_22px_rgba(0,0,0,0.55)] border border-[#DED7CA]/80 dark:border-[#24483D] cursor-pointer group active:scale-[0.98] transition-all mt-4 select-none"
        >
          {/* Panoramic Assam Landscape Background */}
          <Image
            src="/explore/explore_weekend_getaways.webp"
            alt="Weekend Getaways in Assam"
            fill
            sizes="(max-width: 640px) 100vw, 600px"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-300 pointer-events-none"
          />

          {/* Panoramic Readability Gradient */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-transparent pointer-events-none"
            aria-hidden="true"
          />

          {/* Banner Text & Arrow Action */}
          <div className="absolute inset-0 p-4 sm:p-5 flex items-center justify-between z-10">
            <div className="text-white max-w-[75%]">
              <h2 className="font-serif text-[20px] sm:text-[23px] font-bold leading-tight drop-shadow-sm">
                Weekend Getaways
              </h2>
              <p className="text-[12px] sm:text-[13px] text-white/90 font-medium leading-tight mt-1">
                Explore Assam’s hidden gems.
              </p>
            </div>

            {/* Circular Arrow Button */}
            <div
              className="w-10 h-10 rounded-full bg-white text-[#10251C] flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 active:scale-95 transition-transform"
              aria-hidden="true"
            >
              <ArrowRight size={18} strokeWidth={2.4} />
            </div>
          </div>
        </motion.div>
      </main>

      {/* Desktop Footer (hidden on mobile, visible on desktop) */}
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
}
