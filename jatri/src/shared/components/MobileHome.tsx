"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { useSession } from "next-auth/react";
import { RootState } from "@/redux/store";
import {
  MapPin,
  ArrowRight,
  Home as HomeIcon,
  Briefcase,
  Plane,
  Plus,
  ChevronRight,
  Sparkles,
} from "lucide-react";

interface SavedPlace {
  id: string;
  label: string;
  address: string;
}

const DESTINATIONS = [
  {
    name: "Guwahati",
    tagline: "Gateway of the Northeast",
    image: "/mobile-home/dest_guwahati.webp",
    lat: 26.1445,
    lng: 91.7362,
  },
  {
    name: "Shillong",
    tagline: "Scotland of the East",
    image: "/mobile-home/dest_shillong.webp",
    lat: 25.5788,
    lng: 91.8933,
  },
  {
    name: "Kaziranga",
    tagline: "Rhino Wildlife Sanctuary",
    image: "/mobile-home/dest_kaziranga.webp",
    lat: 26.5775,
    lng: 93.1711,
  },
  {
    name: "Majuli",
    tagline: "World's Largest River Island",
    image: "/mobile-home/dest_majuli.webp",
    lat: 26.9602,
    lng: 94.1973,
  },
];

const SERVICES = [
  {
    id: "car",
    title: "Car Rides",
    subtitle: "Anywhere in Assam",
    image: "/mobile-home/service_car.webp",
    route: "/book?category=cars",
  },
  {
    id: "outstation",
    title: "Outstation",
    subtitle: "Explore beyond",
    image: "/mobile-home/service_outstation.webp",
    route: "/book?category=cars&service=outstation",
  },
  {
    id: "cargo",
    title: "Parcel & Cargo",
    subtitle: "Send with trust",
    image: "/mobile-home/service_cargo.webp",
    route: "/book?category=trucks&serviceMode=logistics",
  },
  {
    id: "bus_ferry",
    title: "Bus & Ferry",
    subtitle: "Travel across",
    image: "/mobile-home/service_bus_ferry.webp",
    route: "/fleet",
  },
];

export default function MobileHome({
  onAuthRequired,
}: {
  onAuthRequired?: () => void;
}) {
  const router = useRouter();
  const { userData } = useSelector((state: RootState) => state.user);
  const { data: session } = useSession();

  const currentUser = userData || session?.user;
  const firstName = currentUser?.name?.trim()?.split(" ")[0] || "";

  // Dynamic greeting based on actual time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  // Saved places from localStorage
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("jaatri_saved_places");
        if (stored) {
          setSavedPlaces(JSON.parse(stored));
        }
      } catch (_) {}
    }
  }, []);

  const handleDestinationClick = (dest: typeof DESTINATIONS[number]) => {
    const draftData = {
      drop: dest.name,
      dropLat: dest.lat,
      dropLng: dest.lng,
      category: "cars",
    };
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("ridenow_booking_draft", JSON.stringify(draftData));
        localStorage.setItem("ridenow_booking_draft", JSON.stringify(draftData));
      } catch (_) {}
    }
    router.push(
      `/book?drop=${encodeURIComponent(dest.name)}&dropLat=${dest.lat}&dropLng=${dest.lng}&category=cars`
    );
  };

  const handleShortcutClick = (type: "home" | "work" | "airport" | "add") => {
    if (type === "airport") {
      const airportName = "Lokpriya Gopinath Bordoloi International Airport, Guwahati";
      const draftData = {
        drop: airportName,
        dropLat: 26.1061,
        dropLng: 91.5859,
        category: "cars",
      };
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("ridenow_booking_draft", JSON.stringify(draftData));
          localStorage.setItem("ridenow_booking_draft", JSON.stringify(draftData));
        } catch (_) {}
      }
      router.push(
        `/book?drop=${encodeURIComponent(airportName)}&dropLat=26.1061&dropLng=91.5859&category=cars`
      );
      return;
    }

    if (type === "add") {
      router.push("/settings");
      return;
    }

    // Check saved places for home or work
    const query = type === "home" ? "home" : "work";
    const found = savedPlaces.find((p) =>
      p.label?.toLowerCase().includes(query) ||
      (type === "work" && p.label?.toLowerCase().includes("office"))
    );

    if (found?.address) {
      const draftData = {
        drop: found.address,
        category: "cars",
      };
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("ridenow_booking_draft", JSON.stringify(draftData));
          localStorage.setItem("ridenow_booking_draft", JSON.stringify(draftData));
        } catch (_) {}
      }
      router.push(`/book?drop=${encodeURIComponent(found.address)}&category=cars`);
    } else {
      // If not configured, navigate to settings with hint or direct to booking
      router.push("/settings");
    }
  };

  const handleSearchClick = () => {
    router.push("/book?fresh=true");
  };

  return (
    <div className="w-full bg-[#FAF7F0] dark:bg-[#101713] text-[#10251C] dark:text-[#F3F1E8] pb-10">
      {/* =========================================================================
          SECTION 3B: CINEMATIC ASSAMESE HERO
          Warm sunset sky, Brahmaputra river valley, tea garden hills, road & vehicle
          ========================================================================= */}
      <section className="relative w-full overflow-hidden pt-20 sm:pt-24 pb-7 px-4 sm:px-6">
        {/* Background Scenic Landscape Image */}
        <div className="absolute inset-0 -z-10 w-full h-full">
          <Image
            src="/mobile-home/hero_landscape.webp"
            alt="Scenic Assamese Landscape at Sunset"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center pointer-events-none brightness-[1.02] contrast-[1.01]"
          />
          {/* Subtle gradient vignette to guarantee readable typography without aggressive filter */}
          <div
            className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#FAF7F0]/40 via-transparent to-[#FAF7F0] dark:from-[#101713]/60 dark:via-transparent dark:to-[#101713]"
            aria-hidden="true"
          />
        </div>

        <div className="max-w-md mx-auto">
          {/* Tagline / Eyebrow */}
          <div className="mb-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.14em] uppercase text-[#123D32] dark:text-[#A8E0C0] bg-white/75 dark:bg-[#17261F]/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-[#DED7CA]/70 dark:border-[#2D3E33] shadow-2xs">
              <Sparkles size={11} className="text-[#046A38] dark:text-[#058A48]" />
              <span>EXPLORE ASSAM, YOUR WAY</span>
            </span>
          </div>

          {/* Heading in display serif */}
          <div className="mb-5">
            <h1 className="font-serif text-[32px] sm:text-[36px] leading-[1.12] font-normal tracking-tight text-[#10251C] dark:text-[#F3F1E8] drop-shadow-xs">
              {greeting}
              {firstName ? `, ${firstName}` : ""}
              <br />
              <span className="font-serif italic font-normal text-[#123D32] dark:text-[#D7AC62]">
                Ready to move?
              </span>
            </h1>
          </div>

          {/* =========================================================================
              SECTION 3C: DESTINATION SEARCH BAR
              Elevated, warm-white rounded card with pin icon, placeholder & circular action
              ========================================================================= */}
          <div
            role="button"
            tabIndex={0}
            onClick={handleSearchClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleSearchClick();
            }}
            aria-label="Search destination for booking a ride"
            className="w-full bg-white dark:bg-[#1A261F] rounded-full shadow-[0_8px_25px_rgba(18,61,50,0.1)] dark:shadow-[0_8px_25px_rgba(0,0,0,0.45)] border border-[#DED7CA]/90 dark:border-[#2D3E33] p-1.5 pl-4 sm:pl-5 flex items-center justify-between cursor-pointer transition-all duration-200 active:scale-[0.98] select-none"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <MapPin
                size={20}
                strokeWidth={2.4}
                className="text-[#046A38] dark:text-[#058A48] shrink-0"
              />
              <span className="text-[15px] sm:text-[16px] text-[#10251C]/75 dark:text-[#F3F1E8]/75 font-medium truncate">
                Where are you going?
              </span>
            </div>

            {/* Circular Forest Green Arrow Action */}
            <div
              className="w-10 h-10 rounded-full bg-[#046A38] hover:bg-[#03532C] dark:bg-[#058A48] dark:hover:bg-[#046A38] text-white flex items-center justify-center shrink-0 shadow-sm transition-transform active:scale-95"
              aria-hidden="true"
            >
              <ArrowRight size={18} strokeWidth={2.5} />
            </div>
          </div>

          {/* =========================================================================
              SECTION 3D: SAVED-LOCATION SHORTCUTS
              Four compact shortcut pills: Home, Work, Airport, Add
              ========================================================================= */}
          <div className="mt-4 flex items-center justify-between gap-1.5 sm:gap-2">
            {/* Home Shortcut */}
            <button
              type="button"
              onClick={() => handleShortcutClick("home")}
              className="flex-1 min-w-0 bg-white/90 dark:bg-[#1A261F]/90 backdrop-blur-md rounded-full py-2 px-2.5 sm:px-3 border border-[#DED7CA]/70 dark:border-[#2D3E33] shadow-2xs flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-95 hover:bg-white dark:hover:bg-[#202B24]"
            >
              <HomeIcon size={14} className="text-[#046A38] dark:text-[#A8E0C0] shrink-0" />
              <span className="text-[12px] font-bold text-[#10251C] dark:text-[#F3F1E8] truncate">
                Home
              </span>
            </button>

            {/* Work Shortcut */}
            <button
              type="button"
              onClick={() => handleShortcutClick("work")}
              className="flex-1 min-w-0 bg-white/90 dark:bg-[#1A261F]/90 backdrop-blur-md rounded-full py-2 px-2.5 sm:px-3 border border-[#DED7CA]/70 dark:border-[#2D3E33] shadow-2xs flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-95 hover:bg-white dark:hover:bg-[#202B24]"
            >
              <Briefcase size={14} className="text-[#046A38] dark:text-[#A8E0C0] shrink-0" />
              <span className="text-[12px] font-bold text-[#10251C] dark:text-[#F3F1E8] truncate">
                Work
              </span>
            </button>

            {/* Airport Shortcut */}
            <button
              type="button"
              onClick={() => handleShortcutClick("airport")}
              className="flex-1 min-w-0 bg-white/90 dark:bg-[#1A261F]/90 backdrop-blur-md rounded-full py-2 px-2.5 sm:px-3 border border-[#DED7CA]/70 dark:border-[#2D3E33] shadow-2xs flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-95 hover:bg-white dark:hover:bg-[#202B24]"
            >
              <Plane size={14} className="text-[#046A38] dark:text-[#A8E0C0] shrink-0" />
              <span className="text-[12px] font-bold text-[#10251C] dark:text-[#F3F1E8] truncate">
                Airport
              </span>
            </button>

            {/* Add Shortcut */}
            <button
              type="button"
              onClick={() => handleShortcutClick("add")}
              className="flex-1 min-w-0 bg-white/90 dark:bg-[#1A261F]/90 backdrop-blur-md rounded-full py-2 px-2.5 sm:px-3 border border-[#DED7CA]/70 dark:border-[#2D3E33] shadow-2xs flex items-center justify-center gap-1.5 transition-all duration-150 active:scale-95 hover:bg-white dark:hover:bg-[#202B24]"
            >
              <Plus size={14} className="text-[#046A38] dark:text-[#A8E0C0] shrink-0" />
              <span className="text-[12px] font-bold text-[#10251C] dark:text-[#F3F1E8] truncate">
                Add
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3E: TWO-COLUMN SERVICE CARDS
          Car Rides, Outstation, Parcel & Cargo, Bus & Ferry
          ========================================================================= */}
      <section className="max-w-md mx-auto px-4 sm:px-6 pt-2 pb-5">
        <div className="grid grid-cols-2 gap-3">
          {SERVICES.map((service) => (
            <div
              key={service.id}
              role="button"
              tabIndex={0}
              onClick={() => router.push(service.route)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") router.push(service.route);
              }}
              className="bg-white dark:bg-[#17261F] rounded-[14px] p-3 sm:p-3.5 border border-[#DED7CA]/85 dark:border-[#2D3E33] shadow-[0_2px_8px_rgba(18,61,50,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)] flex items-center justify-between gap-2.5 cursor-pointer transition-all duration-150 active:scale-[0.97] hover:border-[#046A38]/40 dark:hover:border-[#058A48]/40 group select-none"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {/* Service Thumbnail */}
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[10px] bg-[#FAF7F0] dark:bg-[#101713] border border-[#DED7CA]/60 dark:border-[#2D3E33] overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                  <Image
                    src={service.image}
                    alt={service.title}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover object-center rounded-[8px]"
                  />
                </div>

                {/* Text Content */}
                <div className="min-w-0 flex-1">
                  <h2 className="text-[13.5px] sm:text-[14px] font-bold leading-tight text-[#10251C] dark:text-[#F3F1E8] truncate">
                    {service.title}
                  </h2>
                  <p className="text-[11px] text-[#696B64] dark:text-[#929D93] font-medium leading-tight mt-0.5 truncate">
                    {service.subtitle}
                  </p>
                </div>
              </div>

              {/* Discreet Chevron */}
              <ChevronRight
                size={16}
                className="text-[#696B64]/70 dark:text-[#929D93]/70 group-hover:text-[#046A38] dark:group-hover:text-[#058A48] group-hover:translate-x-0.5 transition-all shrink-0"
              />
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: POPULAR DESTINATIONS
          Horizontally scrollable row of portrait image tiles: Guwahati, Shillong, Kaziranga, Majuli
          ========================================================================= */}
      <section className="max-w-md mx-auto pt-3 pb-8">
        <div className="px-4 sm:px-6 flex items-center justify-between mb-3">
          <h2 className="font-serif text-[18px] sm:text-[20px] font-bold text-[#10251C] dark:text-[#F3F1E8] tracking-tight">
            Popular Destinations
          </h2>
          <button
            type="button"
            onClick={() => router.push("/fleet")}
            className="text-[12.5px] font-bold text-[#046A38] dark:text-[#058A48] hover:underline flex items-center gap-0.5 active:scale-95 transition"
          >
            <span>See all</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Horizontal Scroll Track */}
        <div className="flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory px-4 sm:px-6 py-1">
          {DESTINATIONS.map((dest) => (
            <div
              key={dest.name}
              role="button"
              tabIndex={0}
              onClick={() => handleDestinationClick(dest)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleDestinationClick(dest);
              }}
              className="relative w-[130px] sm:w-[145px] h-[175px] sm:h-[195px] rounded-[14px] overflow-hidden shrink-0 snap-start border border-[#DED7CA]/80 dark:border-[#2D3E33] shadow-[0_4px_12px_rgba(18,61,50,0.06)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.4)] cursor-pointer group active:scale-[0.96] transition-transform select-none"
            >
              {/* Destination Image */}
              <Image
                src={dest.image}
                alt={dest.name}
                fill
                sizes="(max-width: 640px) 145px, 160px"
                className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
              />

              {/* Bottom Readability Gradient */}
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none"
                aria-hidden="true"
              />

              {/* Content Label */}
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <p className="font-serif text-[15px] sm:text-[16px] font-bold leading-tight drop-shadow-sm">
                  {dest.name}
                </p>
                <p className="text-[10px] text-white/80 font-medium leading-tight mt-0.5 truncate">
                  {dest.tagline}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
