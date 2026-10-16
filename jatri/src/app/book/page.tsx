"use client";



import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, MapPin, Navigation,
  Bike, Car, Truck, LocateFixed, Phone,
  CheckCircle2, ChevronRight, GraduationCap,
  Plus, X, Users, Clock, Calendar,
  Search, Edit2, Info, ChevronDown, ChevronUp,
  User, UserPlus, Check, Package, Sparkles, SlidersHorizontal, AlertTriangle, Loader2,
  Plane, Train, Building2, HeartPulse, AlertCircle, RotateCcw,
  Zap, ArrowDownUp, Settings, FileText, GripVertical
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import nextDynamic from "next/dynamic";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import useGetMe from "@/shared/hooks/useGetMe";
import { calculateFareBreakdown } from "@/lib/fareEngine";
import { haversineKm as getHaversineDistance, DEFAULT_ROAD_TORTUOSITY_FACTOR } from "@/lib/routeUtils";
import { validateServiceArea, getRecentDestinations, saveRecentDestination, RecentLocation } from "@/lib/serviceArea";
import { useTranslation } from "@/context/LanguageContext";
import FamilyRiderSelector from "@/features/booking/components/FamilyRiderSelector";
import StudentPassModal from "@/features/booking/components/StudentPassModal";
import ScheduleRidePicker from "@/features/booking/components/ScheduleRidePicker";
import WaypointsManager from "@/features/booking/components/WaypointsManager";
import ActiveRideBanner from "@/features/rides/components/ActiveRideBanner";
import {
  VEHICLE_OPTIONS,
  PASSENGER_VEHICLES,
  LOGISTICS_VEHICLES,
  VehicleType,
  ServiceMode,
  recommendVehicle,
  VehicleOption,
} from "@/lib/vehicleConfig";

const RouteMap = nextDynamic(() => import("@/features/maps/components/RouteMap"), { ssr: false });

type Place = {
  id: string;
  name: string;
  title?: string;
  subtitle?: string;
  category?: string;
  lat?: number;
  lng?: number;
  countrycode?: string;
  locality?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  distanceKm?: number;
};

import { VEHICLE_SVG_ICONS } from "@/shared/components/VehicleIcons";

const VEHICLE_ICONS: Record<VehicleType, any> = {
  scooty: VEHICLE_SVG_ICONS.scooty,
  bike: VEHICLE_SVG_ICONS.bike,
  auto: VEHICLE_SVG_ICONS.auto,
  mini: VEHICLE_SVG_ICONS.mini,
  car: VEHICLE_SVG_ICONS.car,
  priority: VEHICLE_SVG_ICONS.priority,
  loading: VEHICLE_SVG_ICONS.loading,
  truck: VEHICLE_SVG_ICONS.truck,
};

const getCategoryIcon = (category?: string, name?: string) => {
  const c = (category || "").toLowerCase();
  const n = (name || "").toLowerCase();
  if (c.includes("aeroway") || c.includes("airport") || n.includes("airport") || n.includes("aerodrome")) return "✈️";
  if (c.includes("station") || c.includes("railway") || n.includes("station") || n.includes("train")) return "🚆";
  if (c.includes("subway") || c.includes("metro") || n.includes("metro")) return "🚇";
  if (c.includes("bus") || n.includes("bus") || n.includes("isbt") || n.includes("stand")) return "🚌";
  if (c.includes("hospital") || c.includes("clinic") || c.includes("health") || n.includes("hospital") || n.includes("pharmacy")) return "🏥";
  if (c.includes("university") || c.includes("college") || c.includes("school") || n.includes("college") || n.includes("university") || n.includes("institute")) return "🎓";
  if (c.includes("shop") || c.includes("mall") || c.includes("supermarket") || n.includes("mall") || n.includes("bazaar") || n.includes("market")) return "🛍️";
  if (c.includes("hotel") || n.includes("hotel") || n.includes("resort") || n.includes("inn")) return "🏨";
  if (c.includes("restaurant") || n.includes("restaurant") || n.includes("dhaba") || n.includes("cafe")) return "🍽️";
  return "📍";
};

const getCategoryBadgeStyle = (category?: string, name?: string) => {
  const c = (category || "").toLowerCase();
  const n = (name || "").toLowerCase();
  if (c.includes("airport") || n.includes("airport")) return "bg-sky-50 text-sky-700 border-sky-200/80";
  if (c.includes("station") || c.includes("railway") || c.includes("metro") || n.includes("station") || n.includes("train")) return "bg-indigo-50 text-indigo-700 border-indigo-200/80";
  if (c.includes("bus") || n.includes("bus") || n.includes("isbt")) return "bg-blue-50 text-blue-700 border-blue-200/80";
  if (c.includes("hospital") || c.includes("clinic") || n.includes("hospital")) return "bg-rose-50 text-rose-700 border-rose-200/80";
  if (c.includes("university") || c.includes("college") || c.includes("school") || n.includes("college")) return "bg-amber-50 text-amber-700 border-amber-200/80";
  if (c.includes("mall") || c.includes("market") || c.includes("shop") || n.includes("mall")) return "bg-purple-50 text-purple-700 border-purple-200/80";
  if (c.includes("hotel") || n.includes("hotel")) return "bg-teal-50 text-teal-700 border-teal-200/80";
  if (c.includes("restaurant") || n.includes("restaurant")) return "bg-orange-50 text-orange-700 border-orange-200/80";
  return "bg-zinc-100 text-zinc-700 border-zinc-200";
};

/** Single source of truth for per-vehicle distance bounds (km). */
const VEHICLE_DISTANCE_LIMITS: Record<string, { minDistance: number; maxDistance: number }> = {
  bike:    { minDistance: 0, maxDistance: 15 },
  auto:    { minDistance: 0, maxDistance: 30 },
  car:     { minDistance: 0, maxDistance: 500 }, // intercity up to 500 km
  loading: { minDistance: 0, maxDistance: 250 },
  truck:   { minDistance: 0, maxDistance: 500 },
};

export default function BookPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const { userData } = useSelector((state: RootState) => state.user);
  useGetMe(true);

  const [pickup,   setPickup]   = useState("");
  const [drop,     setDrop]     = useState("");
  const [pickupDetails, setPickupDetails] = useState<any | null>(null);
  const [dropDetails, setDropDetails] = useState<any | null>(null);
  const [mapSelectionMode, setMapSelectionMode] = useState<"none" | "pickup" | "drop">("none");
  const [showServiceUnavailableModal, setShowServiceUnavailableModal] = useState(false);
  const [serviceUnavailableMessage, setServiceUnavailableMessage] = useState("");

  const [vehicle,  setVehicle]  = useState<VehicleType>("car");
  const [serviceMode, setServiceMode] = useState<ServiceMode>("passenger");
  const [mobile,   setMobile]   = useState("");

  /* ── GOODS TRANSPORT (LOGISTICS) CARGO STATE ── */
  const [cargoType, setCargoType] = useState<string>("Boxes & Cartons");
  const [cargoWeightKg, setCargoWeightKg] = useState<number>(100);
  const [receiverContact, setReceiverContact] = useState<string>("");
  const [deliveryNotes, setDeliveryNotes] = useState<string>("");

  /* ── SMART VEHICLE MATCHING STATE ── */
  const [showSmartMatcher, setShowSmartMatcher] = useState<boolean>(false);
  const [smartPassengers, setSmartPassengers] = useState<number>(1);
  const [smartLuggage, setSmartLuggage] = useState<"none" | "small" | "large">("none");
  const [smartPreference, setSmartPreference] = useState<"budget" | "comfort">("budget");
  const [smartMatchResult, setSmartMatchResult] = useState<{ vehicleId: VehicleType; matchScore: number; reason: string } | null>(null);

  useEffect(() => {
    if (showSmartMatcher) {
      const rec = recommendVehicle({
        passengers: smartPassengers,
        luggage: smartLuggage,
        preference: smartPreference,
        isGoods: serviceMode === "logistics",
        cargoWeightKg,
      });
      setSmartMatchResult(rec);
    } else {
      setSmartMatchResult(null);
    }
  }, [showSmartMatcher, smartPassengers, smartLuggage, smartPreference, serviceMode, cargoWeightKg]);

  const [rates, setRates] = useState<any>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [activeExistingRide, setActiveExistingRide] = useState<any | null>(null);

  /* ── SEARCH & UI STATE ── */
  const [activeSearchField, setActiveSearchField] = useState<"pickup" | "drop" | null>(null);
  const [isEditingRoute, setIsEditingRoute] = useState(false);
  const [showFareReceipt, setShowFareReceipt] = useState(false);
  const [mobileSheetState, setMobileSheetState] = useState<"down" | "half" | "up">("half");
  const mobileSheetExpanded = mobileSheetState === "up";
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(typeof window !== "undefined" && window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  /* ── STUDENT MODE STATE ── */
  const [isStudent, setIsStudent] = useState<boolean>(false);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [showStudentForm, setShowStudentForm] = useState(false);

  /* ── FAMILY ACCOUNT & RIDER CONTACT STATE ── */
  const [familyAccount, setFamilyAccount] = useState<any>(null);
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<any | null>(null);

  useEffect(() => {
    const fetchFamily = async () => {
      try {
        const res = await fetch("/api/user/family");
        const data = await res.json();
        if (data.success && data.family) {
          setFamilyAccount(data.family);
        }
      } catch (err) {
        console.error("Failed to load family account:", err);
      }
    };
    fetchFamily();
  }, []);

  const handleSelectRider = (member: any | null) => {
    setSelectedFamilyMember(member);
    if (member?.phone) {
      const cleaned = member.phone.replace(/\D/g, "");
      const tenDigits = cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;
      setMobile(tenDigits);
    } else if (!member && userData?.mobileNumber) {
      const cleaned = userData.mobileNumber.replace(/\D/g, "");
      const tenDigits = cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;
      setMobile(tenDigits);
    }
  };

  useEffect(() => {
    if (userData?.mobileNumber && !mobile) {
      const cleaned = userData.mobileNumber.replace(/\D/g, "");
      const tenDigits = cleaned.length >= 10 ? cleaned.slice(-10) : cleaned;
      setMobile(tenDigits);
    }
    if (userData?.isStudent !== undefined) {
      setIsStudent(Boolean(userData.isStudent));
      setStudentDetails((userData as any).studentDetails || null);
    }
  }, [userData]);

  /* ── SCHEDULED RIDE (ADVANCE BOOKING) STATE ── */
  const [bookingMode, setBookingMode] = useState<"now" | "schedule">("now");

  const getDefaultScheduledTime = () => {
    const d = new Date(Date.now() + 60 * 60 * 1000);
    const minutes = d.getMinutes();
    const rounded = Math.ceil(minutes / 15) * 15;
    d.setMinutes(rounded);
    d.setSeconds(0);
    d.setMilliseconds(0);
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const [scheduledDateTime, setScheduledDateTime] = useState<string>(getDefaultScheduledTime());

  const getMinScheduledDateTime = () => {
    const minD = new Date(Date.now() + 30 * 60 * 1000);
    const tzOffset = minD.getTimezoneOffset() * 60000;
    return new Date(minD.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const getMaxScheduledDateTime = () => {
    const maxD = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const tzOffset = maxD.getTimezoneOffset() * 60000;
    return new Date(maxD.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const formatEtaTime = (etaMinutesStr: string) => {
    const match = etaMinutesStr.match(/\d+/);
    const minutes = match ? parseInt(match[0], 10) : 3;
    const d = new Date(Date.now() + minutes * 60000);
    let hours = d.getHours();
    const mins = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12 || 12;
    return `${hours}:${mins}${ampm} · ${minutes} min`;
  };

  const isScheduleValid = bookingMode === "now" || (
    Boolean(scheduledDateTime) &&
    new Date(scheduledDateTime).getTime() >= Date.now() + 25 * 60 * 1000
  );

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch(`/api/vehicles/pricing?t=${Date.now()}`, { cache: "no-store" });
        const data = await res.json();
        if (data.success && data.rates) {
          setRates(data.rates);
        }
      } catch (err) {
        console.error("Failed to fetch dynamic rates:", err);
      }
    };
    fetchRates();
  }, []);

  const estimateFare = (type: string, distanceKm: number) => {
    const bd = calculateFareBreakdown(type, distanceKm, rates, undefined, 0, isStudent);
    return bd.totalFare;
  };

  const checkLimit = (type: string, dist: number) => {
    const cfg = (rates?.[type.toLowerCase()] ?? VEHICLE_DISTANCE_LIMITS[type.toLowerCase()]) ?? VEHICLE_DISTANCE_LIMITS.car;
    const min = cfg.minDistance ?? 0;
    const max = type.toLowerCase() === "car" ? 500 : (cfg.maxDistance ?? 9999);
    return dist >= min && dist <= max;
  };

  const [pickupResults, setPickupResults] = useState<Place[]>([]);
  const [dropResults,   setDropResults]   = useState<Place[]>([]);
  const [isSearchingPickup, setIsSearchingPickup] = useState(false);
  const [isSearchingDrop,   setIsSearchingDrop]   = useState(false);
  const [pickupCountry, setPickupCountry] = useState<string | null>("in");

  const [pickupLat, setPickupLat] = useState<number | null>(null);
  const [pickupLng, setPickupLng] = useState<number | null>(null);
  const [dropLat,   setDropLat]   = useState<number | null>(null);
  const [dropLng,   setDropLng]   = useState<number | null>(null);
  const [locating,  setLocating]  = useState(false);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showLocationSettingsGuide, setShowLocationSettingsGuide] = useState(false);
  const [recentDestinations, setRecentDestinations] = useState<RecentLocation[]>([]);
  const [vehicles,  setVehicles]  = useState<any[]>([]);

  useEffect(() => {
    setRecentDestinations(getRecentDestinations());
  }, []);

  /* ── SMART PICKUP STATE ── */
  const [smartPickups, setSmartPickups] = useState<any[]>([]);
  const [selectedSmartPickup, setSelectedSmartPickup] = useState<any | null>(null);

  useEffect(() => {
    if (!pickupLat || !pickupLng) {
      setSmartPickups([]);
      setSelectedSmartPickup(null);
      return;
    }
    const fetchSmartPickups = async () => {
      try {
        const res = await fetch(`/api/places/smart-pickups?lat=${pickupLat}&lng=${pickupLng}`);
        const data = await res.json();
        if (data.success && data.spots) {
          setSmartPickups(data.spots);
        }
      } catch (err) {
        console.error("Smart pickups fetch error:", err);
      }
    };
    fetchSmartPickups();
  }, [pickupLat, pickupLng]);

  const handleSelectSmartPickup = (spot: any) => {
    setPickupLat(spot.lat);
    setPickupLng(spot.lng);
    setPickup(`${spot.venueName} - ${spot.spotName}`);
    setSelectedSmartPickup(spot);
    setPickupResults([]);
  };

  /* ── MULTI-STOP TRIP STATE ── */
  type StopItem = {
    id: string;
    address: string;
    lat: number | null;
    lng: number | null;
    results: Place[];
  };
  const [stops, setStops] = useState<StopItem[]>([]);

  const handleAddStop = () => {
    if (stops.length >= 2) return;
    setStops(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        address: "",
        lat: null,
        lng: null,
        results: [],
      },
    ]);
  };

  const handleRemoveStop = (id: string) => {
    setStops(prev => prev.filter(s => s.id !== id));
  };

  const handleStopChange = (id: string, value: string) => {
    setStops(prev =>
      prev.map(s => {
        if (s.id !== id) return s;
        return { ...s, address: value, lat: null, lng: null };
      })
    );
    if (!value || value.trim().length < 2) {
      setStops(prev => prev.map(s => (s.id === id ? { ...s, results: [] } : s)));
    } else {
      debouncedSearchAddress(
        "stop-" + id,
        value,
        (res) => {
          setStops(prev => prev.map(s => (s.id === id ? { ...s, results: res } : s)));
        },
        pickupCountry || "in"
      );
    }
  };

  const selectStopPlace = async (stopId: string, p: Place) => {
    if (typeof p.lat === "number" && typeof p.lng === "number") {
      setStops(prev =>
        prev.map(s =>
          s.id === stopId
            ? {
                ...s,
                address: p.title || p.name,
                lat: p.lat!,
                lng: p.lng!,
                results: [],
              }
            : s
        )
      );
      return;
    }

    try {
      const res = await fetch(`/api/places?action=details&placeId=${p.id}`);
      const data = await res.json();
      if (data.status === "OK" && data.result) {
        const result = data.result;
        setStops(prev =>
          prev.map(s =>
            s.id === stopId
              ? {
                  ...s,
                  address: result.formatted_address || p.name,
                  lat: result.geometry.location.lat,
                  lng: result.geometry.location.lng,
                  results: [],
                }
              : s
          )
        );
      }
    } catch (err) {
      console.error("Error fetching stop place details:", err);
    }
  };

  const handleReorderWaypoint = (fromIdx: number, toIdx: number) => {
    const currentPoints = [
      {
        address: pickup,
        lat: pickupLat,
        lng: pickupLng,
        country: pickupCountry,
        details: pickupDetails,
      },
      ...stops.map((s) => ({
        id: s.id,
        address: s.address,
        lat: s.lat,
        lng: s.lng,
        country: pickupCountry,
        details: null,
      })),
      {
        address: drop,
        lat: dropLat,
        lng: dropLng,
        country: pickupCountry,
        details: dropDetails,
      },
    ];

    if (fromIdx < 0 || fromIdx >= currentPoints.length || toIdx < 0 || toIdx >= currentPoints.length || fromIdx === toIdx) return;

    const nextPoints = [...currentPoints];
    const [moved] = nextPoints.splice(fromIdx, 1);
    nextPoints.splice(toIdx, 0, moved);

    const newPickup = nextPoints[0];
    const newDrop = nextPoints[nextPoints.length - 1];
    const newStops = nextPoints.slice(1, nextPoints.length - 1);

    setPickup(newPickup.address || "");
    setPickupLat(newPickup.lat);
    setPickupLng(newPickup.lng);
    setPickupCountry(newPickup.country || "in");
    setPickupDetails(newPickup.details || null);

    setDrop(newDrop.address || "");
    setDropLat(newDrop.lat);
    setDropLng(newDrop.lng);
    setDropDetails(newDrop.details || null);

    setStops(
      newStops.map((s, idx) => ({
        id: (s as any).id || `stop-${idx}-${Date.now()}`,
        address: s.address || "",
        lat: s.lat,
        lng: s.lng,
        results: [],
      }))
    );

    setPickupResults([]);
    setDropResults([]);
  };

  const handleMoveStopUp = (stopIdx: number) => {
    handleReorderWaypoint(1 + stopIdx, stopIdx);
  };

  const handleMoveStopDown = (stopIdx: number) => {
    handleReorderWaypoint(1 + stopIdx, 2 + stopIdx);
  };

  const handleSwapLocations = () => {
    if (stops.length > 0) {
      const allAddresses = [pickup, ...stops.map((s) => s.address), drop].reverse();
      const allLats = [pickupLat, ...stops.map((s) => s.lat), dropLat].reverse();
      const allLngs = [pickupLng, ...stops.map((s) => s.lng), dropLng].reverse();

      setPickup(allAddresses[0] || "");
      setPickupLat(allLats[0] || null);
      setPickupLng(allLngs[0] || null);

      setDrop(allAddresses[allAddresses.length - 1] || "");
      setDropLat(allLats[allAddresses.length - 1] || null);
      setDropLng(allLngs[allAddresses.length - 1] || null);

      const updatedStops = stops.map((s, idx) => ({
        ...s,
        address: allAddresses[idx + 1] || "",
        lat: allLats[idx + 1] || null,
        lng: allLngs[idx + 1] || null,
        results: [],
      }));
      setStops(updatedStops);
    } else {
      const prevPickup = pickup;
      const prevLat = pickupLat;
      const prevLng = pickupLng;
      const prevDetails = pickupDetails;

      setPickup(drop);
      setPickupLat(dropLat);
      setPickupLng(dropLng);

      setDrop(prevPickup);
      setDropLat(prevLat);
      setDropLng(prevLng);

      if (!prevPickup && prevDetails) {
        setPickupDetails(null);
      }
    }
    setPickupResults([]);
    setDropResults([]);
  };

  const getMultiStopHaversineDistance = () => {
    if (!pickupLat || !pickupLng || !dropLat || !dropLng) return null;
    let total = 0;
    const validStops = stops.filter(s => s.lat !== null && s.lng !== null);
    const pts: [number, number][] = [
      [pickupLat, pickupLng],
      ...validStops.map(s => [s.lat!, s.lng!] as [number, number]),
      [dropLat, dropLng],
    ];
    for (let i = 0; i < pts.length - 1; i++) {
      total += getHaversineDistance(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    }
    return Number(total.toFixed(1));
  };

  /* ── MEMOIZED GEOMETRIES (FROM NIYAR18 PERF COMMIT 595564b) ── */
  const validStopsForMap = useMemo(() => {
    return stops
      .filter((s) => s.lat !== null && s.lng !== null)
      .map((s) => ({ address: s.address, lat: s.lat!, lng: s.lng! }));
  }, [stops]);

  const memoizedPickupCoords = useMemo<[number, number] | null>(
    () => (pickupLat && pickupLng ? [pickupLat, pickupLng] : null),
    [pickupLat, pickupLng]
  );

  const memoizedDropCoords = useMemo<[number, number] | null>(
    () => (dropLat && dropLng ? [dropLat, dropLng] : null),
    [dropLat, dropLng]
  );

  const getDistanceValidity = () => {
    if (pickupLat && pickupLng) {
      const pCheck = validateServiceArea(pickupLat, pickupLng);
      if (!pCheck.isSupported) {
        return {
          valid: false,
          isServiceUnavailable: true,
          message: `Pickup area: ${pCheck.message || "Outside operational bounds"}`
        };
      }
    }
    if (dropLat && dropLng) {
      const dCheck = validateServiceArea(dropLat, dropLng);
      if (!dCheck.isSupported) {
        return {
          valid: false,
          isServiceUnavailable: true,
          message: `Drop area: ${dCheck.message || "Outside operational bounds"}`
        };
      }
    }

    if (routeDistance === -1) {
      return {
        valid: false,
        isServiceUnavailable: true,
        message: "No rides available (no road connection found)"
      };
    }
    const dist = (routeDistance !== null && routeDistance >= 0)
      ? routeDistance
      : ((pickupLat && pickupLng && dropLat && dropLng) ? getHaversineDistance(pickupLat, pickupLng, dropLat, dropLng) : null);

    if (!pickupLat || !pickupLng || !dropLat || !dropLng || !vehicle || dist === null) return { valid: true };

    if (dist > 500) {
      return {
        valid: false,
        isServiceUnavailable: true,
        message: "Route exceeds maximum 500 km intercity coverage area. Please adjust your destination."
      };
    }

    // For Bike / Auto: If distance > 100 km, prompt switch to RideNow Intercity Car
    if (dist > 100 && (vehicle === "bike" || vehicle === "auto")) {
      return {
        valid: false,
        isIntercityPrompt: true,
        message: "Distance exceeds 100 km. Please select RideNow Intercity (Car/SUV) for outstation travel."
      };
    }

    const cfg = (rates?.[vehicle.toLowerCase()] ?? VEHICLE_DISTANCE_LIMITS[vehicle.toLowerCase()]) ?? VEHICLE_DISTANCE_LIMITS.car;
    const min = cfg.minDistance ?? 0;
    const max = vehicle === "car" ? 500 : (cfg.maxDistance ?? 9999);
    
    if (dist < min) {
      return { valid: false, message: `${VEHICLE_OPTIONS[vehicle]?.label || "Vehicle"} requires min ${min} km (Current: ${dist.toFixed(1)} km)` };
    }
    if (dist > max) {
      return {
        valid: false,
        isServiceUnavailable: dist > 100,
        message: dist > 100
          ? "Service not available for this vehicle type for long distance. Please select RideNow Intercity."
          : `${VEHICLE_OPTIONS[vehicle]?.label || "Vehicle"} is limited to max ${max} km`
      };
    }
    return { valid: true };
  };

  const allStopsValid = stops.every(s => s.address.trim().length > 0 && s.lat !== null && s.lng !== null);
  const distanceValidity = getDistanceValidity();
  const canContinue = !!(
    !activeExistingRide &&
    pickup &&
    drop &&
    vehicle &&
    mobile.length === 10 &&
    pickupLat &&
    pickupLng &&
    dropLat &&
    dropLng &&
    allStopsValid &&
    distanceValidity.valid &&
    routeDistance !== -1 &&
    isScheduleValid
  );

  /* ── AUTOCOMPLETE SEARCH WITH 260ms DEBOUNCE & LIVE LOADING STATE ── */
  const searchDebounceRef = useRef<Record<string, NodeJS.Timeout>>({});

  const debouncedSearchAddress = (
    key: string,
    q: string,
    setResults: (r: Place[]) => void,
    restrict?: string | null
  ) => {
    if (searchDebounceRef.current[key]) {
      clearTimeout(searchDebounceRef.current[key]);
    }
    if (!q || q.trim().length < 2) {
      setResults([]);
      if (key === "pickup") setIsSearchingPickup(false);
      else setIsSearchingDrop(false);
      return;
    }
    if (key === "pickup") setIsSearchingPickup(true);
    else setIsSearchingDrop(true);

    searchDebounceRef.current[key] = setTimeout(async () => {
      try {
        await searchAddress(q, setResults, restrict);
      } finally {
        if (key === "pickup") setIsSearchingPickup(false);
        else setIsSearchingDrop(false);
      }
    }, 260);
  };

  const searchAddress = async (q: string, setResults: (r: Place[]) => void, restrict?: string | null) => {
    if (!q || q.trim().length < 2) { setResults([]); return; }
    try {
      const countryFilter = restrict || pickupCountry || "in";
      let url = `/api/places?action=autocomplete&input=${encodeURIComponent(q.trim())}&country=${countryFilter}`;
      
      // Pass soft proximity bias so nearby places rank first without restricting distant destinations
      if (pickupLat !== null && pickupLng !== null) {
        url += `&lat=${pickupLat}&lng=${pickupLng}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.status === "OK" && Array.isArray(data.predictions)) {
        const results: Place[] = data.predictions.map((p: any) => ({
          id: p.place_id,
          name: p.description,
          title: p.title || p.description,
          subtitle: p.subtitle,
          category: p.category,
          lat: p.lat,
          lng: p.lng,
          countrycode: p.countrycode,
          locality: p.locality,
          city: p.city,
          state: p.state,
          postalCode: p.postalCode,
          distanceKm: p.distanceKm,
        }));
        setResults(results);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error("Autocomplete error:", err);
      setResults([]);
    }
  };

  const selectPlace = async (p: Place, isPickup: boolean) => {
    let lat = p.lat;
    let lng = p.lng;
    let formattedAddress = p.subtitle ? `${p.title || p.name}, ${p.subtitle}` : (p.title || p.name);
    let locality = p.locality || "";
    let city = p.city || "";
    let state = p.state || "";
    let postalCode = p.postalCode || "";
    let countrycode = p.countrycode || "in";
    let name = p.title || p.name.split(",")[0];

    // 1. If place ID exists and isn't a synthetic chip, fetch authoritative details
    if (p.id && !p.id.startsWith("recent-") && !p.id.startsWith("chip-")) {
      try {
        const res = await fetch(`/api/places?action=details&placeId=${p.id}`);
        const data = await res.json();
        if (data.status === "OK" && data.result) {
          const result = data.result;
          if (result.formatted_address) formattedAddress = result.formatted_address;
          if (result.name) name = result.name;
          if (result.geometry?.location) {
            lat = result.geometry.location.lat;
            lng = result.geometry.location.lng;
          }
          if (result.locality) locality = result.locality;
          if (result.city) city = result.city;
          if (result.state) state = result.state;
          if (result.postalCode) postalCode = result.postalCode;
          if (result.address_components) {
            const countryComp = result.address_components.find((c: any) => c.types.includes("country"));
            if (countryComp) countrycode = String(countryComp.short_name || "in").toLowerCase();
          }
        }
      } catch (err) {
        console.error("Error fetching place details:", err);
      }
    }

    // 2. If coordinates exist but components are sparse (like from Photon autocomplete),
    // enrich via reverse geocode just like pin location selection does!
    if (typeof lat === "number" && typeof lng === "number" && (!city || !state || !postalCode)) {
      try {
        const enrichRes = await fetch(`/api/places?action=geocode&lat=${lat}&lng=${lng}`);
        const enrichData = await enrichRes.json();
        if (enrichData?.results?.length) {
          const first = enrichData.results[0];
          if (!formattedAddress || !formattedAddress.includes(",")) {
            formattedAddress = first.formatted_address || formattedAddress;
          }
          if (first.locality && !locality) locality = first.locality;
          if (first.city && !city) city = first.city;
          if (first.state && !state) state = first.state;
          if (first.postalCode && !postalCode) postalCode = first.postalCode;
          if (first.address_components) {
            const countryComp = first.address_components.find((c: any) => c.types.includes("country"));
            if (countryComp) countrycode = String(countryComp.short_name || "in").toLowerCase();
          }
        }
      } catch (e) {
        // Fallback gracefully
      }
    }

    if (typeof lat === "number" && typeof lng === "number") {
      const structuredDetails = {
        name,
        formattedAddress,
        locality,
        city,
        state,
        postalCode,
        countrycode,
        coordinates: [lat, lng] as [number, number],
      };

      saveRecentDestination({
        name: formattedAddress,
        subtitle: p.subtitle,
        lat,
        lng,
      });
      setRecentDestinations(getRecentDestinations());

      if (isPickup) {
        setPickup(formattedAddress);
        setPickupCountry(countrycode);
        setPickupLat(lat);
        setPickupLng(lng);
        setPickupDetails(structuredDetails);
        setPickupResults([]);
      } else {
        setDrop(formattedAddress);
        setDropLat(lat);
        setDropLng(lng);
        setDropDetails(structuredDetails);
        setDropResults([]);
      }
    }

    setActiveSearchField(null);
    setIsEditingRoute(false);
  };

  const handleGeolocationSuccess = async (coords: GeolocationCoordinates) => {
    const lat = coords.latitude;
    const lng = coords.longitude;

    setLocationError(null);
    setUserCoords([lat, lng]);
    setPickupLat(lat);
    setPickupLng(lng);
    setPickupResults([]);

    try {
      const res = await fetch(`/api/places?action=geocode&lat=${lat}&lng=${lng}`);
      const data = await res.json();
      if (data?.results?.length) {
        const first = data.results[0];
        const addr = first.formatted_address || `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        let countryCode = "in";
        if (first.address_components) {
          const countryComp = first.address_components.find((c: any) => c.types.includes("country"));
          if (countryComp) {
            countryCode = String(countryComp.short_name || "in").toLowerCase();
          }
        }
        const structuredDetails = {
          name: first.name || addr.split(",")[0] || "Current Location",
          formattedAddress: addr,
          locality: first.locality || "",
          city: first.city || "",
          state: first.state || "",
          postalCode: first.postalCode || "",
          countrycode: countryCode,
          coordinates: [lat, lng] as [number, number],
        };
        setPickup(addr);
        setPickupCountry(countryCode);
        setPickupDetails(structuredDetails);
      } else {
        const fallbackAddr = `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
        setPickup(fallbackAddr);
        setPickupCountry("in");
        setPickupDetails({
          name: "Current Location",
          formattedAddress: fallbackAddr,
          coordinates: [lat, lng],
        });
      }
    } catch (err) {
      console.error("Failed to reverse geocode current location:", err);
      const fallbackAddr = `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      setPickup(fallbackAddr);
      setPickupDetails({
        name: "Current Location",
        formattedAddress: fallbackAddr,
        coordinates: [lat, lng],
      });
    } finally {
      setLocating(false);
    }
  };

  const handleGeolocationError = (err: GeolocationPositionError) => {
    let msg = "Could not retrieve current location. Please select manually.";
    if (err.code === 1) {
      msg = "Location permission denied. Please allow location access or pick on map.";
    } else if (err.code === 2) {
      msg = "GPS signal unavailable. Please ensure location services are enabled.";
    } else if (err.code === 3) {
      msg = "Location request timed out. Please try again or search manually.";
    }
    setLocationError(msg);
    setLocating(false);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setLocationError(null);
    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => handleGeolocationSuccess(coords),
      (err) => {
        console.warn("High accuracy geolocation failed, attempting standard accuracy:", err);
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => handleGeolocationSuccess(coords),
          (err2) => {
            console.error("Standard geolocation failed:", err2);
            handleGeolocationError(err2);
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
        );
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
    );
  };

  const resetAllTripData = () => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("ridenow_booking_draft");
        localStorage.removeItem("ridenow_booking_draft");
      } catch (_) {}
    }
    setDrop("");
    setDropLat(null);
    setDropLng(null);
    setDropDetails(null);
    setDropResults([]);
    setStops([]);
    setRouteDistance(null);
    setSelectedSmartPickup(null);
    setSelectedFamilyMember(null);
    useCurrentLocation();
  };

  /* ── INITIAL MOUNT: FRESH SESSION VS CHECKOUT EDIT ── */
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const urlParams = new URLSearchParams(window.location.search);
      const isFresh = urlParams.get("fresh") === "true";
      const isEdit = urlParams.get("edit") === "true";

      // If fresh requested explicitly, clear stale draft and start fresh!
      if (isFresh) {
        try {
          sessionStorage.removeItem("ridenow_booking_draft");
          localStorage.removeItem("ridenow_booking_draft");
        } catch (_) {}
        useCurrentLocation();
        if (window.location.search) {
          window.history.replaceState({}, "", "/book");
        }
        return;
      }

      // Explicit edit returning from checkout or active session fallback
      const raw = sessionStorage.getItem("ridenow_booking_draft") || localStorage.getItem("ridenow_booking_draft");
      let draft: any = null;
      if (raw) {
        try {
          draft = JSON.parse(raw);
        } catch (_) {}
      }

      const p = (draft?.pickup && draft.pickup !== "Pickup Location") ? draft.pickup : urlParams.get("pickup");
      const d = (draft?.drop && draft.drop !== "Drop Location") ? draft.drop : urlParams.get("drop");
      const v = draft?.vehicle || urlParams.get("vehicle");
      const m = draft?.mobileNumber || draft?.mobile || urlParams.get("mobileNumber");
      const pLat = typeof draft?.pickupLat === "number" ? draft.pickupLat : urlParams.get("pickupLat") ? Number(urlParams.get("pickupLat")) : null;
      const pLng = typeof draft?.pickupLng === "number" ? draft.pickupLng : urlParams.get("pickupLng") ? Number(urlParams.get("pickupLng")) : null;
      const dLat = typeof draft?.dropLat === "number" ? draft.dropLat : urlParams.get("dropLat") ? Number(urlParams.get("dropLat")) : null;
      const dLng = typeof draft?.dropLng === "number" ? draft.dropLng : urlParams.get("dropLng") ? Number(urlParams.get("dropLng")) : null;

      const hasValidDraftOrParams = Boolean((p && d) || (pLat && dLat) || isEdit);

      if (!hasValidDraftOrParams) {
        useCurrentLocation();
        return;
      }

      if (p) setPickup(p);
      if (d) setDrop(d);
      if (v) setVehicle(v);
      if (m) setMobile(m);
      if (typeof pLat === "number" && !isNaN(pLat)) setPickupLat(pLat);
      if (typeof pLng === "number" && !isNaN(pLng)) setPickupLng(pLng);
      if (typeof dLat === "number" && !isNaN(dLat)) setDropLat(dLat);
      if (typeof dLng === "number" && !isNaN(dLng)) setDropLng(dLng);

      if (Array.isArray(draft?.stops) && draft.stops.length > 0) {
        setStops(
          draft.stops.map((s: any, idx: number) => ({
            id: s.id || `stop-${idx}`,
            address: s.address || "",
            lat: typeof s.lat === "number" ? s.lat : null,
            lng: typeof s.lng === "number" ? s.lng : null,
            results: [],
          }))
        );
      }
      if (draft?.smartPickupDetails) setSelectedSmartPickup(draft.smartPickupDetails);
      if (draft?.familyMemberDetails) setSelectedFamilyMember(draft.familyMemberDetails);
      if (draft?.pickupDetails) setPickupDetails(draft.pickupDetails);
      if (draft?.dropDetails) setDropDetails(draft.dropDetails);
      if (draft?.isScheduled || urlParams.get("isScheduled") === "true") {
        setBookingMode("schedule");
        const sched = draft?.scheduledTime || urlParams.get("scheduledTime");
        if (sched) setScheduledDateTime(sched);
      }

      if (typeof window !== "undefined" && window.location.search) {
        window.history.replaceState({}, "", "/book");
      }
    } catch (e) {
      console.warn("Failed to restore booking draft from storage:", e);
      useCurrentLocation();
    }
  }, []);

  /* ── FETCH NEARBY VEHICLES ── */
  useEffect(() => {
    if (!pickupLat || !pickupLng) {
      setVehicles([]);
      return;
    }
    const fetchVehicles = async () => {
      try {
        const res = await fetch("/api/vehicles/nearby", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: pickupLat,
            longitude: pickupLng,
            vehicleType: vehicle || undefined
          })
        });
        const data = await res.json();
        if (data.success) setVehicles(data.vehicles);
      } catch (err) {
        console.error(err);
      }
    };
    fetchVehicles();
    const interval = setInterval(fetchVehicles, 15000);
    return () => clearInterval(interval);
  }, [pickupLat, pickupLng, vehicle]);

  const handleMapChange = (
    p: string,
    d: string,
    c1?: [number, number] | null,
    c2?: [number, number] | null,
    countryCode?: string | null,
    p1Details?: any,
    p2Details?: any
  ) => {
    if (p) setPickup(p);
    if (d) setDrop(d);
    if (c1) {
      setPickupLat(c1[0]);
      setPickupLng(c1[1]);
      if (p1Details) {
        setPickupDetails(p1Details);
      } else {
        setPickupDetails({
          name: p.split(",")[0],
          formattedAddress: p,
          coordinates: [c1[0], c1[1]],
        });
      }
    }
    if (c2) {
      setDropLat(c2[0]);
      setDropLng(c2[1]);
      if (p2Details) {
        setDropDetails(p2Details);
      } else {
        setDropDetails({
          name: d.split(",")[0],
          formattedAddress: d,
          coordinates: [c2[0], c2[1]],
        });
      }
    }
    if (countryCode) {
      setPickupCountry(countryCode);
    }
  };

  const handleConfirmPinSelection = (
    mode: "pickup" | "drop",
    coords: [number, number],
    address: string,
    details?: any
  ) => {
    const struct = details || {
      name: address.split(",")[0],
      formattedAddress: address,
      coordinates: coords,
    };
    if (mode === "pickup") {
      setPickup(address);
      setPickupLat(coords[0]);
      setPickupLng(coords[1]);
      setPickupDetails(struct);
    } else {
      setDrop(address);
      setDropLat(coords[0]);
      setDropLng(coords[1]);
      setDropDetails(struct);
    }
    setMapSelectionMode("none");
    setActiveSearchField(null);
    setIsEditingRoute(false);
  };

  const handleCoordinatesChange = (c1?: [number, number] | null, c2?: [number, number] | null) => {
    if (c1) {
      setPickupLat(c1[0]);
      setPickupLng(c1[1]);
    }
    if (c2) {
      setDropLat(c2[0]);
      setDropLng(c2[1]);
    }
  };

  const hasRoute = Boolean(pickupLat && pickupLng && dropLat && dropLng);
  const haversineDist =
    getMultiStopHaversineDistance() ||
    (pickupLat && pickupLng && dropLat && dropLng
      ? getHaversineDistance(pickupLat, pickupLng, dropLat, dropLng)
      : null);
  const effectiveDistance = useMemo(() => {
    if (routeDistance !== null && routeDistance > 0) {
      return Number(routeDistance.toFixed(1));
    }
    if (haversineDist !== null && haversineDist > 0) {
      return Number((haversineDist * DEFAULT_ROAD_TORTUOSITY_FACTOR).toFixed(1));
    }
    return 0;
  }, [routeDistance, haversineDist]);

  // Invalidate previous route road distance whenever coordinates change
  useEffect(() => {
    setRouteDistance(null);
  }, [pickupLat, pickupLng, dropLat, dropLng, stops.length]);

  const currentBreakdown = calculateFareBreakdown(vehicle, effectiveDistance, rates, undefined, 0, isStudent);

  const handleConfirmRide = () => {
    if (!pickupLat || !pickupLng || !dropLat || !dropLng || !vehicle) return;

    const validity = getDistanceValidity();
    if (!validity.valid) {
      if (validity.isServiceUnavailable) {
        setServiceUnavailableMessage(
          validity.message ||
            "No rides available for this route or distance exceeds active coverage area. Try adjusting your pickup or destination."
        );
        setShowServiceUnavailableModal(true);
        return;
      }
      if (validity.isIntercityPrompt) {
        setVehicle("car");
        return;
      }
      setLocationError(validity.message || "Please select a valid route");
      return;
    }

    const estFare = estimateFare(vehicle, effectiveDistance);

    const validStops = stops
      .filter((s) => s.address && s.lat !== null && s.lng !== null)
      .map((s, idx) => ({
        address: s.address,
        lat: s.lat,
        lng: s.lng,
        order: idx + 1,
      }));

    const finalPickupDetails = pickupDetails || {
      name: pickup.split(",")[0],
      formattedAddress: pickup,
      coordinates: [pickupLat, pickupLng],
    };

    const finalDropDetails = dropDetails || {
      name: drop.split(",")[0],
      formattedAddress: drop,
      coordinates: [dropLat, dropLng],
    };

    const draftData = {
      pickup,
      drop,
      vehicle,
      fare: estFare,
      fareBreakdown: currentBreakdown,
      mobileNumber: mobile,
      pickupLat,
      pickupLng,
      dropLat,
      dropLng,
      distanceKm: effectiveDistance,
      pickupDetails: finalPickupDetails,
      dropDetails: finalDropDetails,
      isSmartPickup: Boolean(selectedSmartPickup),
      smartPickupDetails: selectedSmartPickup || null,
      stops: validStops,
      isFamilyRide: Boolean(selectedFamilyMember),
      familyMemberDetails: selectedFamilyMember || null,
      isScheduled: bookingMode === "schedule" && Boolean(scheduledDateTime),
      scheduledTime:
        bookingMode === "schedule" && scheduledDateTime
          ? new Date(scheduledDateTime).toISOString()
          : null,
      serviceMode,
      cargoDetails:
        serviceMode === "logistics"
          ? {
              cargoType,
              cargoWeightKg,
              receiverContact,
              deliveryNotes,
            }
          : null,
    };

    try {
      if (typeof window !== "undefined") {
        const serialized = JSON.stringify(draftData);
        sessionStorage.setItem("ridenow_booking_draft", serialized);
        localStorage.setItem("ridenow_booking_draft", serialized);
      }
    } catch (e) {
      console.warn("booking draft save error:", e);
    }

    router.push("/checkout");
  };

  /* ── SHARED FORM SECTIONS (REUSABLE ACROSS UNIFIED PANEL) ── */
  const renderLocationInputs = () => (
    <div className="space-y-2.5 relative z-40">
      {locationError && (
        <div className="p-3.5 bg-zinc-950 border border-zinc-800 text-white rounded-none text-xs space-y-2.5 shadow-md">
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-6 h-6 rounded-none bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <LocateFixed size={13} />
              </div>
              <div className="min-w-0">
                <p className="font-extrabold text-[11px] uppercase tracking-wider text-white">Location Access Needed</p>
                <p className="text-[11px] text-zinc-300 leading-snug mt-0.5">
                  Allow location access to auto-detect your pickup point, or update your browser site settings.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setLocationError(null);
                setShowLocationSettingsGuide(false);
              }}
              className="text-zinc-400 hover:text-white transition p-1 cursor-pointer flex-shrink-0"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-800">
            <button
              type="button"
              onClick={useCurrentLocation}
              disabled={locating}
              className="px-3 py-1.5 bg-white text-zinc-950 hover:bg-zinc-200 text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <LocateFixed size={11} className={locating ? "animate-spin" : ""} />
              <span>{locating ? "Detecting..." : "Ask Permission Again"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowLocationSettingsGuide(true)}
              className="px-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
            >
              <Settings size={11} className="text-zinc-400" />
              <span>Site Settings Guide</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLocationError(null);
                setActiveSearchField(null);
                setMapSelectionMode("pickup");
              }}
              className="px-3 py-1.5 bg-transparent hover:bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
            >
              <MapPin size={11} />
              <span>Set on Map</span>
            </button>
          </div>
        </div>
      )}

      {/* Pickup Row */}
      <div className="relative">
        <div className="flex items-center gap-2.5 bg-zinc-50 border border-zinc-300 rounded-none px-3.5 py-2 min-h-[46px] focus-within:border-zinc-950 focus-within:bg-white transition-all shadow-none">
          <div className="w-2.5 h-2.5 rounded-none bg-zinc-950 flex-shrink-0" />
          
          {/* Reorder controls for Pickup */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => handleReorderWaypoint(0, 1)}
              title="Move pickup down"
              className="w-4 h-5 flex items-center justify-center text-zinc-600 hover:text-black transition cursor-pointer"
            >
              <ChevronDown size={12} />
            </button>
            <GripVertical size={12} className="text-zinc-400 select-none flex-shrink-0" />
          </div>

          <input
            aria-label="Pickup location"
            value={pickup}
            onFocus={() => setActiveSearchField("pickup")}
            onChange={(e) => {
              setPickup(e.target.value);
              setPickupLat(null);
              setPickupLng(null);
              debouncedSearchAddress("pickup", e.target.value, setPickupResults, pickupCountry || "in");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && pickupResults.length > 0) {
                e.preventDefault();
                selectPlace(pickupResults[0], true);
              }
            }}
            placeholder={t("booking.pickup", "Pickup location")}
            className="flex-1 min-w-0 bg-transparent text-sm sm:text-[15px] font-bold text-zinc-900 placeholder:text-zinc-400 outline-none truncate tracking-tight"
          />
          {isSearchingPickup ? (
            <Loader2 size={13} className="animate-spin text-zinc-400 flex-shrink-0" />
          ) : pickup ? (
            <button
              type="button"
              onClick={() => {
                setPickup("");
                setPickupLat(null);
                setPickupLng(null);
                setPickupResults([]);
              }}
              className="p-1 text-zinc-400 hover:text-zinc-700"
            >
              <X size={14} />
            </button>
          ) : null}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={useCurrentLocation}
            disabled={locating}
            title="Use current location"
            className="w-7 h-7 rounded-none border border-zinc-300 bg-zinc-100 hover:bg-zinc-200 transition flex items-center justify-center flex-shrink-0"
          >
            <LocateFixed size={13} className={`text-zinc-700 ${locating ? "animate-spin" : ""}`} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setActiveSearchField(null);
              setMapSelectionMode("pickup");
            }}
            title="Choose pickup on map"
            className="w-7 h-7 rounded-none border border-zinc-950 bg-zinc-950 text-white hover:bg-black transition flex items-center justify-center flex-shrink-0"
          >
            <MapPin size={13} className="text-white" />
          </motion.button>
        </div>

        {/* Pickup Autocomplete Results */}
        <AnimatePresence>
          {activeSearchField === "pickup" && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute left-0 right-0 top-full mt-2 bg-white border border-zinc-200/90 rounded-2xl shadow-2xl max-h-72 overflow-y-auto z-50 divide-y divide-zinc-100 ring-1 ring-black/5"
            >
              {/* Option to set location on interactive map */}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setActiveSearchField(null);
                  setMapSelectionMode("pickup");
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-left bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-950 transition"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
                  <MapPin size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-emerald-900 leading-none">Set pickup point on map</p>
                  <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">Move map to pinpoint exact location</p>
                </div>
                <span className="text-[10px] font-black uppercase text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-200 flex-shrink-0">
                  Pinpoint
                </span>
              </button>

              {/* Use current GPS location */}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setActiveSearchField(null);
                  useCurrentLocation();
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-zinc-50 transition"
              >
                <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-800 flex items-center justify-center flex-shrink-0 border border-zinc-200">
                  <LocateFixed size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-zinc-900 leading-none">Current Location (GPS)</p>
                  <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Use device geolocation</p>
                </div>
              </button>

              {/* Live search loading feedback */}
              {isSearchingPickup && (
                <div className="flex items-center gap-2.5 px-4 py-3 text-zinc-500">
                  <Loader2 size={14} className="animate-spin text-zinc-700 shrink-0" />
                  <span className="text-xs font-semibold">Searching nearby places...</span>
                </div>
              )}

              {/* Suggestions List */}
              {pickupResults.map((p) => {
                const distToPoint =
                  typeof p.distanceKm === "number"
                    ? p.distanceKm
                    : (typeof p.lat === "number" && typeof p.lng === "number" && dropLat && dropLng
                        ? getHaversineDistance(dropLat, dropLng, p.lat, p.lng)
                        : null);

                return (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectPlace(p, true);
                    }}
                    className="group flex items-center gap-3 w-full px-3.5 py-2.5 text-left hover:bg-zinc-50 active:bg-zinc-100 transition rounded-xl cursor-pointer"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 border shadow-2xs transition-transform group-hover:scale-105 ${getCategoryBadgeStyle(p.category, p.title || p.name)}`}>
                      {getCategoryIcon(p.category, p.title || p.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-zinc-900 truncate group-hover:text-black">
                        {p.title || p.name}
                      </p>
                      {p.subtitle && (
                        <p className="text-[11px] text-zinc-500 font-medium truncate mt-0.5">
                          {p.subtitle}
                        </p>
                      )}
                    </div>

                    {distToPoint !== null && (
                      <span className="text-[10px] font-bold text-zinc-600 bg-zinc-100/90 border border-zinc-200/80 px-2 py-0.5 rounded-full flex-shrink-0">
                        {typeof distToPoint === "number" ? distToPoint.toFixed(1) : distToPoint} km
                      </span>
                    )}
                    <ChevronRight size={13} className="text-zinc-300 group-hover:text-zinc-500 transition-colors flex-shrink-0" />
                  </button>
                );
              })}

              {/* No results fallback */}
              {!isSearchingPickup && pickup.trim().length >= 2 && pickupResults.length === 0 && (
                <div className="px-4 py-4 text-center space-y-2">
                  <p className="text-xs font-bold text-zinc-700">No exact places found for &quot;{pickup}&quot;</p>
                  <p className="text-[11px] text-zinc-400">Can&apos;t find your place? Move the pin to pick on the interactive map.</p>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setActiveSearchField(null);
                      setMapSelectionMode("pickup");
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-bold shadow-xs hover:bg-black transition"
                  >
                    <MapPin size={12} />
                    <span>Set pickup on map</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Intermediate Stops */}
      {stops.length > 0 && (
        <WaypointsManager
          stops={stops}
          onAddStop={handleAddStop}
          onRemoveStop={handleRemoveStop}
          onStopChange={handleStopChange}
          onSelectStopPlace={selectStopPlace}
          onMoveStopUp={handleMoveStopUp}
          onMoveStopDown={handleMoveStopDown}
          maxStops={2}
          hideAddButton={true}
        />
      )}

      {/* Unified Route Actions Row: Add Stop + Swap */}
      <div className="flex items-center justify-between px-0.5 py-1 relative z-20">
        {stops.length < 2 ? (
          <button
            type="button"
            onClick={handleAddStop}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none border border-dashed border-zinc-300 hover:border-zinc-500 bg-white hover:bg-zinc-50 text-zinc-800 text-[10px] font-bold tracking-tight transition cursor-pointer"
          >
            <Plus size={12} className="text-zinc-700" />
            <span>Add stop (max 2)</span>
          </button>
        ) : (
          <span className="text-[10px] font-semibold text-zinc-400">Max 2 stops</span>
        )}

        <div className="h-[1px] bg-zinc-200 flex-1 mx-3" />

        <button
          type="button"
          onClick={handleSwapLocations}
          title="Swap pickup and destination"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-none border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-900 text-[10px] font-extrabold uppercase tracking-wider shadow-2xs transition active:scale-95 cursor-pointer"
        >
          <ArrowDownUp size={11} className="text-zinc-800" />
          <span>Swap</span>
        </button>
      </div>

      {/* Destination Row */}
      <div className="relative">
        <div className="flex items-center gap-2.5 bg-zinc-50 border border-zinc-300 rounded-none px-3.5 py-2 min-h-[46px] focus-within:border-zinc-950 focus-within:bg-white transition-all shadow-none">
          <div className="w-2.5 h-2.5 rounded-none border-2 border-zinc-950 bg-white flex-shrink-0" />

          {/* Reorder controls for Drop */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => handleReorderWaypoint(stops.length + 1, stops.length)}
              title="Move destination up"
              className="w-4 h-5 flex items-center justify-center text-zinc-600 hover:text-black transition cursor-pointer"
            >
              <ChevronUp size={12} />
            </button>
            <GripVertical size={12} className="text-zinc-400 select-none flex-shrink-0" />
          </div>

          <input
            aria-label="Drop location"
            value={drop}
            onFocus={() => setActiveSearchField("drop")}
            onChange={(e) => {
              setDrop(e.target.value);
              setDropLat(null);
              setDropLng(null);
              debouncedSearchAddress("drop", e.target.value, setDropResults, pickupCountry || "in");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && dropResults.length > 0) {
                e.preventDefault();
                selectPlace(dropResults[0], false);
              }
            }}
            placeholder={t("booking.whereTo", "Where to?")}
            className="flex-1 min-w-0 bg-transparent text-sm sm:text-[15px] font-black text-zinc-900 placeholder:text-zinc-400 outline-none truncate tracking-tight"
          />
          {isSearchingDrop ? (
            <Loader2 size={13} className="animate-spin text-zinc-400 flex-shrink-0" />
          ) : drop ? (
            <button
              type="button"
              onClick={() => {
                setDrop("");
                setDropLat(null);
                setDropLng(null);
                setDropResults([]);
              }}
              className="p-1 text-zinc-400 hover:text-zinc-700"
            >
              <X size={14} />
            </button>
          ) : null}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setActiveSearchField(null);
              setMapSelectionMode("drop");
            }}
            title="Choose destination on map"
            className="w-7 h-7 rounded-none border border-zinc-950 bg-white hover:bg-zinc-100 transition flex items-center justify-center flex-shrink-0"
          >
            <MapPin size={13} className="text-zinc-950" />
          </motion.button>
        </div>

        {/* Drop Autocomplete Results & Recent Destinations */}
        <AnimatePresence>
          {activeSearchField === "drop" && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute left-0 right-0 top-full mt-2 bg-white border border-zinc-200/90 rounded-2xl shadow-2xl max-h-72 overflow-y-auto z-50 divide-y divide-zinc-100 ring-1 ring-black/5"
            >
              {/* Option to set location on interactive map */}
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setActiveSearchField(null);
                  setMapSelectionMode("drop");
                }}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-left bg-rose-50/70 hover:bg-rose-100/70 text-rose-950 transition"
              >
                <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xs flex-shrink-0">
                  <MapPin size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-rose-900 leading-none">Set destination point on map</p>
                  <p className="text-[10px] text-rose-700 font-semibold mt-0.5">Move map to pinpoint exact location</p>
                </div>
                <span className="text-[10px] font-black uppercase text-rose-700 bg-white px-2 py-0.5 rounded-full border border-rose-200 flex-shrink-0">
                  Pinpoint
                </span>
              </button>

              {/* Live search loading feedback */}
              {isSearchingDrop && (
                <div className="flex items-center gap-2.5 px-4 py-3 text-zinc-500">
                  <Loader2 size={14} className="animate-spin text-zinc-700 shrink-0" />
                  <span className="text-xs font-semibold">Searching nearby places...</span>
                </div>
              )}

              {/* Suggestions List */}
              {dropResults.map((p) => {
                const distToPoint =
                  typeof p.distanceKm === "number"
                    ? p.distanceKm
                    : (typeof p.lat === "number" && typeof p.lng === "number" && pickupLat && pickupLng
                        ? getHaversineDistance(pickupLat, pickupLng, p.lat, p.lng)
                        : null);

                return (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectPlace(p, false);
                    }}
                    className="group flex items-center gap-3 w-full px-3.5 py-2.5 text-left hover:bg-zinc-50 active:bg-zinc-100 transition rounded-xl cursor-pointer"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 border shadow-2xs transition-transform group-hover:scale-105 ${getCategoryBadgeStyle(p.category, p.title || p.name)}`}>
                      {getCategoryIcon(p.category, p.title || p.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-zinc-900 truncate group-hover:text-black">
                        {p.title || p.name}
                      </p>
                      {p.subtitle && (
                        <p className="text-[11px] text-zinc-500 font-medium truncate mt-0.5">
                          {p.subtitle}
                        </p>
                      )}
                    </div>

                    {distToPoint !== null && (
                      <span className="text-[10px] font-bold text-zinc-600 bg-zinc-100/90 border border-zinc-200/80 px-2 py-0.5 rounded-full flex-shrink-0">
                        {typeof distToPoint === "number" ? distToPoint.toFixed(1) : distToPoint} km
                      </span>
                    )}

                    <ChevronRight size={13} className="text-zinc-300 group-hover:text-zinc-500 transition-colors flex-shrink-0" />
                  </button>
                );
              })}

              {/* Recent Destinations fallback when no active input query */}
              {dropResults.length === 0 && !isSearchingDrop && recentDestinations.length > 0 && (
                <>
                  <div className="px-3.5 py-1.5 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">🕒 Recent Destinations</span>
                  </div>
                  {recentDestinations.map((recent) => (
                    <button
                      key={recent.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectPlace(
                          {
                            id: recent.id,
                            name: recent.name,
                            title: recent.name,
                            subtitle: recent.subtitle,
                            lat: recent.lat,
                            lng: recent.lng,
                          },
                          false
                        );
                      }}
                      className="group flex items-center gap-3 w-full px-3.5 py-2.5 text-left hover:bg-zinc-50 active:bg-zinc-100 transition rounded-xl"
                    >
                      <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-600 flex items-center justify-center text-xs flex-shrink-0 shadow-2xs">
                        🕒
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-zinc-900 truncate group-hover:text-black">{recent.name}</p>
                        {recent.subtitle && (
                          <p className="text-[10px] text-zinc-500 font-medium truncate mt-0.5">{recent.subtitle}</p>
                        )}
                      </div>
                      <ChevronRight size={13} className="text-zinc-300 group-hover:text-zinc-500 flex-shrink-0" />
                    </button>
                  ))}
                </>
              )}

              {/* No results fallback */}
              {!isSearchingDrop && drop.trim().length >= 2 && dropResults.length === 0 && (
                <div className="px-4 py-4 text-center space-y-2">
                  <p className="text-xs font-bold text-zinc-700">No exact places found for &quot;{drop}&quot;</p>
                  <p className="text-[11px] text-zinc-400">Can&apos;t find your place? Move the pin to pick on the interactive map.</p>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setActiveSearchField(null);
                      setMapSelectionMode("drop");
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-bold shadow-xs hover:bg-black transition"
                  >
                    <MapPin size={12} />
                    <span>Set destination on map</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );

  const renderRideSelection = () => (
    <div className="space-y-4">
      {/* Mode Switcher & Schedule Picker */}
      <ScheduleRidePicker
        bookingMode={bookingMode}
        onModeChange={setBookingMode}
        scheduledTime={scheduledDateTime}
        onTimeChange={setScheduledDateTime}
        minScheduledTime={getMinScheduledDateTime()}
      />

      {/* 👤 RIDER & CONTACT DROPDOWN SELECTOR */}
      <FamilyRiderSelector
        familyAccount={familyAccount}
        selectedFamilyMember={selectedFamilyMember}
        onSelectRider={handleSelectRider}
        onAddNewContact={async (contact) => {
          if (contact.saveForFuture) {
            const res = await fetch("/api/user/family/member", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: contact.name,
                phone: contact.phone,
                relation: contact.relation,
              }),
            });
            const data = await res.json();
            if (data.success && data.family) {
              setFamilyAccount(data.family);
            }
          }
          handleSelectRider(contact);
        }}
        userData={userData}
      />



      {/* Recommended Pickup Selector UI */}
      {smartPickups.length > 0 && (
        <div className="p-3 bg-emerald-50/90 border border-emerald-300 rounded-none shadow-none">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-none bg-emerald-600" />
              <p className="text-[11px] font-black uppercase text-emerald-900 tracking-wider">
                📍 Recommended Pickups
              </p>
            </div>
            <span className="text-[10px] text-emerald-800 font-bold">Suggested</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {smartPickups.map((spot) => {
              const isSelected = selectedSmartPickup?.id === spot.id;
              return (
                <button
                  key={spot.id}
                  type="button"
                  onClick={() => handleSelectSmartPickup(spot)}
                  className={`flex-shrink-0 text-left p-2 rounded-none border transition-colors max-w-[200px] cursor-pointer ${
                    isSelected
                      ? "bg-emerald-700 text-white border-emerald-700"
                      : "bg-white text-zinc-900 border-emerald-300 hover:border-emerald-500"
                  }`}
                >
                  <p className="font-extrabold text-[11px] leading-tight truncate">{spot.spotName}</p>
                  <p className={`text-[9px] mt-0.5 truncate ${isSelected ? "text-emerald-100" : "text-zinc-500"}`}>
                    {spot.venueName} • 🚶 {spot.walkingTimeText}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SERVICE MODE TOGGLE (SHARP GEOMETRY • INDIAN SUPER-APP) ── */}
      <div className="bg-zinc-100 p-1 rounded-none flex items-center gap-1 border border-zinc-300">
        <button
          type="button"
          onClick={() => {
            setServiceMode("passenger");
            if (vehicle === "loading" || vehicle === "truck") setVehicle("car");
          }}
          className={`flex-1 py-2 px-3 rounded-none text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            serviceMode === "passenger"
              ? "bg-zinc-950 text-white shadow-xs"
              : "text-zinc-700 hover:text-black hover:bg-zinc-200/50"
          }`}
        >
          <Car size={13} className={serviceMode === "passenger" ? "text-emerald-400" : ""} />
          <span className="tracking-tight">Daily Rides & Taxi</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setServiceMode("logistics");
            if (vehicle !== "loading" && vehicle !== "truck") setVehicle("loading");
          }}
          className={`flex-1 py-2 px-3 rounded-none text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            serviceMode === "logistics"
              ? "bg-zinc-950 text-white shadow-xs"
              : "text-zinc-700 hover:text-black hover:bg-zinc-200/50"
          }`}
        >
          <Package size={13} className={serviceMode === "logistics" ? "text-amber-400" : ""} />
          <span className="tracking-tight">Express Cargo & Mini Truck</span>
        </button>
      </div>

      {/* ── SMART VEHICLE MATCHING WIDGET ── */}
      <div className="bg-zinc-50 border border-zinc-300 rounded-none p-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowSmartMatcher(!showSmartMatcher)}
            className="flex items-center gap-1.5 text-left group"
          >
            <Sparkles size={14} className="text-emerald-600 flex-shrink-0 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-900 group-hover:text-emerald-700 transition">
              Smart Ride Matcher
            </span>
            <span className="text-[10px] text-zinc-400 font-bold ml-1">
              {showSmartMatcher ? "Hide" : "Find best vehicle"}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setShowSmartMatcher(!showSmartMatcher)}
            className="text-zinc-400 hover:text-zinc-600 p-1"
          >
            {showSmartMatcher ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        <AnimatePresence>
          {showSmartMatcher && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-emerald-100 space-y-3"
            >
              {serviceMode === "passenger" ? (
                <>
                  {/* Passengers Chip selector */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1.5 block">
                      How many passengers?
                    </label>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 6].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setSmartPassengers(num)}
                          className={`flex-1 py-1.5 rounded-none text-xs font-bold border transition cursor-pointer ${
                            smartPassengers === num
                              ? "bg-zinc-950 text-white border-zinc-950 shadow-xs"
                              : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100"
                          }`}
                        >
                          {num === 6 ? "5–6 Pax" : `${num} Pax`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Luggage Chip selector */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1.5 block">
                      How much luggage?
                    </label>
                    <div className="flex gap-1.5">
                      {(
                        [
                          { id: "none", label: "No Bags" },
                          { id: "small", label: "Small Bag" },
                          { id: "large", label: "Large Bags" },
                        ] as const
                      ).map((lug) => (
                        <button
                          key={lug.id}
                          type="button"
                          onClick={() => setSmartLuggage(lug.id)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                            smartLuggage === lug.id
                              ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                              : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                          }`}
                        >
                          {lug.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preference Chip selector */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1.5 block">
                      Your priority
                    </label>
                    <div className="flex gap-1.5">
                      {(
                        [
                          { id: "budget", label: "Lowest Fare" },
                          { id: "comfort", label: "More Comfort" },
                        ] as const
                      ).map((pref) => (
                        <button
                          key={pref.id}
                          type="button"
                          onClick={() => setSmartPreference(pref.id)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                            smartPreference === pref.id
                              ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                              : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                          }`}
                        >
                          {pref.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* Logistics Cargo Weight selector */
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1.5 block">
                    Estimated Cargo Weight
                  </label>
                  <div className="flex gap-1.5">
                    {[
                      { wt: 100, label: "<100 kg" },
                      { wt: 250, label: "250 kg" },
                      { wt: 500, label: "500 kg" },
                      { wt: 1000, label: "1,000+ kg" },
                    ].map((w) => (
                      <button
                        key={w.wt}
                        type="button"
                        onClick={() => setCargoWeightKg(w.wt)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                          cargoWeightKg === w.wt
                            ? "bg-zinc-900 text-white border-zinc-900 shadow-xs"
                            : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendation Result Banner */}
              {smartMatchResult && (
                <div className="p-2.5 bg-emerald-100/60 border border-emerald-300 rounded-xl flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1 text-[10px] font-black text-emerald-800 uppercase">
                      <span>⭐ Recommended Match:</span>
                      <span className="font-extrabold underline">
                        {VEHICLE_OPTIONS[smartMatchResult.vehicleId]?.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-700 leading-snug truncate mt-0.5 font-medium">
                      {smartMatchResult.reason}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVehicle(smartMatchResult.vehicleId)}
                    className="flex-shrink-0 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition"
                  >
                    Select
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── GOODS TRANSPORT (LOGISTICS) DETAILS INPUTS ── */}
      {serviceMode === "logistics" && (
        <div className="bg-orange-50/60 border border-orange-200 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center gap-1.5 text-orange-950 text-xs font-black uppercase tracking-wider">
            <Package size={14} className="text-orange-600" />
            <span>Goods & Consignment Details</span>
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-600 block mb-1">Cargo Type</label>
            <div className="flex flex-wrap gap-1.5">
              {["Boxes & Cartons", "Furniture & Home", "Commercial Goods", "Machinery & Parts"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCargoType(type)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                    cargoType === type
                      ? "bg-orange-600 text-white border-orange-600"
                      : "bg-white text-zinc-700 border-zinc-200 hover:bg-orange-50/40"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-zinc-600 block mb-1">Receiver Contact (Optional)</label>
              <input
                type="tel"
                placeholder="Alternate phone"
                value={receiverContact}
                onChange={(e) => setReceiverContact(e.target.value)}
                className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-600 block mb-1">Delivery Instructions</label>
              <input
                type="text"
                placeholder="e.g. 2nd floor, handle with care"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Seamless Unified Vehicle Selection List */}
      <div>
        <div className="flex items-center justify-between mb-2 px-0.5">
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-zinc-950 font-heading">
              {serviceMode === "passenger" ? "Choose a trip" : "Goods Transport Vehicles"}
            </h2>
            <p className="text-xs text-zinc-500 font-body">
              {serviceMode === "passenger" ? `${PASSENGER_VEHICLES.length} rides nearby` : `${LOGISTICS_VEHICLES.length} freight sizes`}
            </p>
          </div>
        </div>

        {routeDistance === -1 ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-none text-center">
            <p className="text-rose-600 text-xs font-black uppercase">No Rides Available</p>
            <p className="text-zinc-500 text-[10px] mt-1 font-bold">No road connection found between these points.</p>
          </div>
        ) : (
          <div className="bg-transparent divide-y divide-zinc-100">
            {(serviceMode === "passenger" ? PASSENGER_VEHICLES : LOGISTICS_VEHICLES).map((v) => {
              const isSelected = vehicle === v.id;
              const isLimitOk = checkLimit(v.id, effectiveDistance);
              const fare = estimateFare(v.id, effectiveDistance);
              const isSmartPick = smartMatchResult?.vehicleId === v.id;
              const Icon = VEHICLE_ICONS[v.id] || Car;
              const isFastest =
                (serviceMode === "passenger" && (v.id === "bike" || v.id === "scooty")) ||
                (serviceMode === "logistics" && v.id === "loading");

              return (
                <div
                  key={v.id}
                  onClick={() => isLimitOk && setVehicle(v.id as VehicleType)}
                  className={`relative flex items-center justify-between px-3.5 py-3.5 transition-colors cursor-pointer select-none ${
                    isSelected
                      ? "bg-zinc-950 text-white"
                      : isSmartPick
                      ? "bg-emerald-50/50 hover:bg-emerald-100/50 text-zinc-900"
                      : "hover:bg-zinc-100/80 text-zinc-900"
                  } ${!isLimitOk ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  {isSmartPick && !isSelected && (
                    <span className="absolute top-1.5 right-3 bg-emerald-700 text-white text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-none shadow-xs flex items-center gap-1">
                      <Sparkles size={8} />
                      <span>Best Match</span>
                    </span>
                  )}
                  <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1 mr-2">
                    <div className="w-16 h-14 sm:w-20 sm:h-16 flex items-center justify-center flex-shrink-0 p-0.5">
                      <Icon size={56} className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {/* Line 1: Vehicle Title + Capacity */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`font-bold text-base sm:text-[17px] tracking-tight leading-tight ${
                          isSelected ? "text-white" : "text-zinc-950"
                        }`}>
                          {v.label}
                        </span>
                        {v.passengerCapacity ? (
                          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                            isSelected ? "text-zinc-300" : "text-zinc-500"
                          }`}>
                            <User size={12} className="inline opacity-80" />
                            <span className="tabular-nums">{v.passengerCapacity}</span>
                          </span>
                        ) : (
                          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                            isSelected ? "text-zinc-300" : "text-zinc-500"
                          }`}>
                            <Package size={12} className="inline opacity-80" />
                            <span className="tabular-nums">{v.maxWeightKg} kg</span>
                          </span>
                        )}
                      </div>

                      {/* Line 2: Clock ETA duration */}
                      <div className={`text-xs mt-0.5 font-medium flex items-center gap-1 ${
                        isSelected ? "text-zinc-300" : "text-zinc-600"
                      }`}>
                        {isFastest && <Zap size={11} className="text-amber-500 fill-amber-500 shrink-0" />}
                        <span className="tabular-nums">{formatEtaTime(v.etaText)}</span>
                      </div>

                      {/* Line 3: Tagline */}
                      <p className={`text-xs mt-0.5 leading-snug truncate ${
                        isSelected ? "text-zinc-400" : "text-zinc-400"
                      }`}>
                        {v.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 pl-2 min-w-[76px] sm:min-w-[90px]">
                    <p className={`font-black text-lg sm:text-xl leading-none tracking-tight tabular-nums whitespace-nowrap ${
                      isSelected ? "text-white" : "text-zinc-950"
                    }`}>
                      ₹{fare}
                    </p>
                    {effectiveDistance > 100 && v.id === "car" ? (
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-none border tracking-wider block mt-1 ${
                        isSelected ? "bg-zinc-800 text-white border-zinc-700" : "text-zinc-950 bg-zinc-100 border-zinc-300"
                      }`}>
                        Intercity
                      </span>
                    ) : !isLimitOk ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVehicle("car");
                        }}
                        className="text-[9px] font-bold uppercase text-amber-800 bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded-none border border-amber-300 block mt-1"
                      >
                        Use Intercity
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Itemized Fare Receipt Accordion */}
      <div className="bg-white border border-zinc-300 rounded-none p-3.5 space-y-2 shadow-none">
        <button
          type="button"
          onClick={() => setShowFareReceipt(!showFareReceipt)}
          className="w-full flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-none bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 flex-shrink-0">
              <FileText size={14} />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-zinc-900 block leading-tight">
                Fare Breakdown
              </span>
              <span className="text-[11px] text-zinc-500 font-medium">Upfront guaranteed pricing</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-900 text-base sm:text-lg font-black tabular-nums">
            <span>₹{currentBreakdown.totalFare}</span>
            {showFareReceipt ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        <AnimatePresence>
          {showFareReceipt && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-2.5 border-t border-zinc-200 space-y-2 text-xs text-zinc-600 font-medium"
            >
              <div className="flex justify-between">
                <span>Base Fare</span>
                <span className="font-bold text-zinc-900">₹{currentBreakdown.baseFare}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Distance Fare ({currentBreakdown.distanceKm} km × ₹{currentBreakdown.pricePerKm}/km)</span>
                <span className="font-bold text-zinc-900">₹{currentBreakdown.distanceFare}</span>
              </div>
              {currentBreakdown.surgeAmount > 0 && (
                <div className="flex justify-between text-[11px] text-amber-600 font-bold">
                  <span>High Demand Surge ({currentBreakdown.surgeMultiplier}x)</span>
                  <span>+₹{currentBreakdown.surgeAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-[11px]">
                <span>Platform Tech Fee</span>
                <span className="font-bold text-zinc-900">₹{currentBreakdown.platformFee}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span>Govt GST / Taxes (5%)</span>
                <span className="font-bold text-zinc-900">₹{currentBreakdown.taxes}</span>
              </div>
              {currentBreakdown.isStudentDiscountApplied && (
                <div className="flex justify-between text-[11px] text-emerald-700 font-black pt-1 border-t border-emerald-100">
                  <span>🎓 Student Pass Discount (-10%)</span>
                  <span>-₹{currentBreakdown.studentDiscount}</span>
                </div>
              )}
              <div className="pt-2 border-t border-dashed border-zinc-200 flex items-center justify-between text-[10px] text-zinc-500">
                <span>Payment Accepted:</span>
                <span className="font-bold text-zinc-800">⚡ UPI (GPay/PhonePe) • Cash • Card</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Student Pass Banner & Verification Modal */}
      <div className="p-3 bg-zinc-950 text-white rounded-none border border-zinc-950 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-none bg-zinc-900 text-amber-400 flex items-center justify-center border border-zinc-800 flex-shrink-0">
            <GraduationCap size={15} />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-extrabold tracking-tight">Student Pass (10% OFF)</p>
            <p className="text-[11px] text-zinc-400 font-medium">
              {isStudent ? "Active & Applied" : "Save 10% with college email"}
            </p>
          </div>
        </div>
        {!isStudent && (
          <button
            type="button"
            onClick={() => setShowStudentForm(true)}
            className="px-2.5 py-1 bg-amber-400 text-zinc-950 font-black text-[11px] rounded-none hover:bg-amber-300 transition cursor-pointer"
          >
            Verify
          </button>
        )}
      </div>

      <StudentPassModal
        isOpen={showStudentForm}
        onClose={() => setShowStudentForm(false)}
        isStudent={isStudent}
        studentDetails={studentDetails}
        onVerified={(details) => {
          setIsStudent(true);
          setStudentDetails(details);
        }}
      />

      {/* Contact Mobile Input Row (Indian Standard) */}
      <div className="flex items-center gap-2.5 bg-white border border-zinc-300 rounded-none px-3.5 py-2 min-h-[46px] shadow-none focus-within:border-zinc-950 transition-all">
        <span className="text-xs sm:text-sm font-extrabold text-zinc-800 bg-zinc-100 border border-zinc-300 px-2 py-1 rounded-none flex items-center gap-1 flex-shrink-0 select-none">
          +91
        </span>
        <input
          type="tel"
          value={mobile}
          onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder="Enter 10-digit mobile number"
          className="flex-1 bg-transparent text-xs sm:text-sm font-bold text-zinc-900 placeholder:text-zinc-400 outline-none tabular-nums min-w-[120px]"
        />
        {mobile.length === 10 ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-none border border-emerald-300 flex-shrink-0">
            <CheckCircle2 size={13} className="text-emerald-700" />
            Verified
          </span>
        ) : (
          <span className="text-[11px] font-bold text-zinc-400 flex-shrink-0">
            OTP on arrival
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative w-full h-screen overflow-hidden bg-white font-sans select-none flex flex-col md:flex-row">
      
      {/* ══ 1. DESKTOP / TABLET UNIFIED EDITORIAL PANEL (BOOKING SIDE) ══ */}
      <div className={`hidden md:flex w-full md:w-1/2 lg:w-1/2 xl:w-1/2 md:max-w-[50%] h-full flex-col bg-white border-r border-zinc-200 z-10 rounded-none overflow-hidden transition-all duration-300 flex-shrink-0 ${
        mapSelectionMode !== "none" ? "opacity-0 pointer-events-none -translate-x-12" : "opacity-100 translate-x-0"
      }`}>
        
        {/* Pinned Card Header */}
        <div className="flex-shrink-0 p-4 border-b border-zinc-200 bg-white space-y-3 relative z-30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => router.back()}
                className="w-8 h-8 rounded-none border border-zinc-300 bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-900 transition cursor-pointer"
                aria-label="Go back"
              >
                <ArrowLeft size={16} />
              </button>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base sm:text-lg font-black text-zinc-950 leading-none tracking-tight font-sans">RideNow</h1>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-none bg-zinc-950 text-white text-[9px] font-black uppercase tracking-wider">
                    भारत
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasRoute && (
                <span className="text-[11px] font-black uppercase tracking-wider bg-zinc-950 text-white border border-zinc-950 px-2.5 py-1 rounded-none tabular-nums">
                  {effectiveDistance} km
                </span>
              )}
            </div>
          </div>

          {/* Active Ride Recovery & Double Booking Protection */}
          <ActiveRideBanner variant="inline" onActiveRideFound={setActiveExistingRide} />

          {/* Location Inputs */}
          {renderLocationInputs()}
        </div>

        {/* Scrollable Card Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!hasRoute ? (
            <div className="py-12 text-center space-y-3 text-zinc-400 border border-dashed border-zinc-200 p-8 rounded-none">
              <span className="text-4xl">🗺️</span>
              <p className="text-sm font-black text-zinc-800">Enter your destination to explore rides</p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Select your pickup and drop-off points to view available vehicles, live ETAs, and transparent pricing.
              </p>
            </div>
          ) : (
            renderRideSelection()
          )}
        </div>

        {/* Pinned Card Footer */}
        <div className="flex-shrink-0 p-4 border-t border-zinc-200 bg-white">
          <motion.button
            whileTap={{ scale: 0.99 }}
            disabled={!canContinue}
            onClick={handleConfirmRide}
            className="w-full py-3.5 sm:py-4 rounded-none bg-zinc-950 hover:bg-black disabled:opacity-35 text-white font-black text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer shadow-sm min-h-[48px]"
          >
            <span>
              {!hasRoute
                ? t("booking.chooseVehicle", "Choose Destination")
                : bookingMode === "schedule"
                ? t("booking.scheduleRide", "Schedule Ride")
                : `${t("booking.confirmRide", "Confirm Ride")} • ${t(`fleet.${vehicle}.title`, VEHICLE_OPTIONS[vehicle]?.label || "Ride")}`}
            </span>
            <ArrowRight size={16} />
          </motion.button>

          {!canContinue && (
            <p className="text-center text-[10px] font-bold mt-2 text-zinc-600 uppercase tracking-wider truncate">
              {activeExistingRide
                ? "Active ride already in progress. Complete or cancel it first."
                : !drop
                ? "Set drop location"
                : mobile.length !== 10
                ? "Enter valid 10-digit mobile"
                : !distanceValidity.valid
                ? distanceValidity.message
                : !isScheduleValid
                ? "Scheduled time must be at least 30 mins ahead"
                : "Complete route setup"}
            </p>
          )}
        </div>

      </div>

      {/* ══ 2. DESKTOP / TABLET MAP CANVAS (TAKES THE OTHER 50%, FULLSCREEN ONLY DURING PIN SELECTION) ══ */}
      <div className={`hidden md:block ${
        mapSelectionMode !== "none"
          ? "fixed inset-0 z-40 bg-zinc-100"
          : "w-full md:w-1/2 flex-1 h-full relative z-0 bg-zinc-100"
      }`}>
        <RouteMap
          pickup={pickup}
          drop={drop}
          pickupCoords={memoizedPickupCoords}
          dropCoords={memoizedDropCoords}
          userCoords={userCoords}
          onChange={handleMapChange}
          onCoordinatesChange={handleCoordinatesChange}
          onDistance={setRouteDistance}
          vehicles={vehicles}
          disableFallbackGeocode={false}
          smartPickups={smartPickups}
          onSelectSmartPickup={handleSelectSmartPickup}
          stops={validStopsForMap}
          bottomPadding={60}
          selectionMode={mapSelectionMode}
          onSelectionModeChange={setMapSelectionMode}
          onConfirmPinSelection={handleConfirmPinSelection}
        />
      </div>

      {/* ══ 3. MOBILE INTERFACE (< md) ══ */}
      <div className="md:hidden flex flex-col w-full h-[100dvh] max-h-[100dvh] overflow-hidden bg-white">
        {/* Fullscreen Map when user is picking location pin on mobile */}
        {mapSelectionMode !== "none" ? (
          <div className="fixed inset-0 z-40 bg-zinc-100">
            <RouteMap
              pickup={pickup}
              drop={drop}
              pickupCoords={memoizedPickupCoords}
              dropCoords={memoizedDropCoords}
              userCoords={userCoords}
              onChange={handleMapChange}
              onCoordinatesChange={handleCoordinatesChange}
              onDistance={setRouteDistance}
              vehicles={vehicles}
              disableFallbackGeocode={false}
              smartPickups={smartPickups}
              onSelectSmartPickup={handleSelectSmartPickup}
              stops={validStopsForMap}
              bottomPadding={120}
              selectionMode={mapSelectionMode}
              onSelectionModeChange={setMapSelectionMode}
              onConfirmPinSelection={handleConfirmPinSelection}
            />
          </div>
        ) : !hasRoute ? (
          /* Mobile Search & Map when route is NOT set */
          <div className="relative w-full h-full flex flex-col">
            <div className="p-3.5 bg-white border-b border-zinc-200 z-10 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="w-8 h-8 rounded-none border border-zinc-300 bg-zinc-100 flex items-center justify-center text-zinc-900"
                  >
                    <ArrowLeft size={15} />
                  </button>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h1 className="text-sm font-extrabold text-zinc-900">RideNow</h1>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-none bg-zinc-950 text-white text-[8px] font-black uppercase">
                        भारत
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <ActiveRideBanner variant="inline" onActiveRideFound={setActiveExistingRide} />
              {renderLocationInputs()}
            </div>
            <div className="flex-1 relative z-0 bg-zinc-100">
              <RouteMap
                pickup={pickup}
                drop={drop}
                pickupCoords={memoizedPickupCoords}
                dropCoords={memoizedDropCoords}
                userCoords={userCoords}
                onChange={handleMapChange}
                onCoordinatesChange={handleCoordinatesChange}
                onDistance={setRouteDistance}
                vehicles={vehicles}
                disableFallbackGeocode={false}
                smartPickups={smartPickups}
                onSelectSmartPickup={handleSelectSmartPickup}
                stops={validStopsForMap}
                bottomPadding={40}
                selectionMode={mapSelectionMode}
                onSelectionModeChange={setMapSelectionMode}
                onConfirmPinSelection={handleConfirmPinSelection}
              />
            </div>
          </div>
        ) : (
          /* Mobile Dynamic Full Split View with Tactile Sliding Sheet */
          <div className="flex flex-col w-full h-full overflow-hidden relative">
            {/* Dynamic Map: Seamlessly transitions between Full Map, Half Split (36dvh), and Peek (14dvh) */}
            <div className={`w-full relative z-0 border-b border-zinc-300 bg-zinc-100 transition-all duration-300 ease-in-out flex-shrink-0 ${
              mobileSheetState === "up"
                ? "h-[14dvh]"
                : mobileSheetState === "down"
                ? "h-[calc(100dvh-130px)]"
                : "h-[36dvh]"
            }`}>
              <RouteMap
                pickup={pickup}
                drop={drop}
                pickupCoords={memoizedPickupCoords}
                dropCoords={memoizedDropCoords}
                userCoords={userCoords}
                onChange={handleMapChange}
                onCoordinatesChange={handleCoordinatesChange}
                onDistance={setRouteDistance}
                vehicles={vehicles}
                disableFallbackGeocode={false}
                smartPickups={smartPickups}
                onSelectSmartPickup={handleSelectSmartPickup}
                stops={validStopsForMap}
                bottomPadding={mobileSheetState === "down" ? 70 : mobileSheetState === "up" ? 15 : 40}
                selectionMode={mapSelectionMode}
                onSelectionModeChange={setMapSelectionMode}
                onConfirmPinSelection={handleConfirmPinSelection}
              />
            </div>

            {/* Bottom Tactile Sliding Booking Interface (Integrated Framer Motion physics from /active-ride) */}
            <motion.div
              animate={{
                height:
                  mobileSheetState === "up"
                    ? "86dvh"
                    : mobileSheetState === "down"
                    ? 130
                    : "64dvh",
              }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className="flex flex-col bg-white overflow-hidden shadow-2xl relative z-10 border-t border-zinc-200"
            >
              {/* Interactive Drag Handle Header */}
              <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.25}
                onDragEnd={(_, info) => {
                  if (info.offset.y < -35 || info.velocity.y < -250) {
                    setMobileSheetState((prev) => (prev === "down" ? "half" : "up"));
                  } else if (info.offset.y > 35 || info.velocity.y > 250) {
                    setMobileSheetState((prev) => (prev === "up" ? "half" : "down"));
                  }
                }}
                className="flex-shrink-0 pt-2 pb-2 px-3.5 border-b border-zinc-200 bg-zinc-50 cursor-grab active:cursor-grabbing select-none"
              >
                {/* Physical slide pill bar indicator */}
                <div
                  onClick={() => {
                    setMobileSheetState((prev) => (prev === "up" ? "down" : prev === "down" ? "half" : "up"));
                  }}
                  className="w-12 h-1 bg-zinc-300 mx-auto rounded-full mb-2 cursor-pointer hover:bg-zinc-500 active:scale-95 transition-all"
                  title="Slide to adjust view"
                />

                <div className="flex items-center justify-between">
                  <div
                    onClick={() => {
                      if (mobileSheetState === "down") setMobileSheetState("half");
                      else if (mobileSheetState === "half") setMobileSheetState("up");
                      else setMobileSheetState("half");
                    }}
                    className="flex items-center gap-2 min-w-0 pr-2 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-none bg-zinc-950 flex-shrink-0" />
                    <span className="text-xs font-bold text-zinc-800 truncate max-w-[120px]">{pickup.split(',')[0]}</span>
                    <span className="text-zinc-400">→</span>
                    <span className="w-2 h-2 rounded-none border border-zinc-950 bg-white flex-shrink-0" />
                    <span className="text-xs font-black text-zinc-900 truncate max-w-[120px]">{drop.split(',')[0]}</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-none bg-zinc-950 text-white border border-zinc-950">
                      {effectiveDistance} km
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditingRoute(!isEditingRoute);
                      }}
                      className="px-2 py-0.5 rounded-none border border-zinc-300 bg-white text-zinc-800 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 size={10} />
                      <span>{isEditingRoute ? "Done" : "Edit"}</span>
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* If Mobile User Tapped Edit, Show Inputs Inline */}
              {isEditingRoute && (
                <div className="p-3 bg-zinc-50 border-b border-zinc-200 flex-shrink-0">
                  {renderLocationInputs()}
                </div>
              )}

              {/* Scrollable Rides Body (Hidden only in peek down state) */}
              {mobileSheetState !== "down" ? (
                <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-3.5 overscroll-contain">
                  {renderRideSelection()}
                </div>
              ) : (
                /* Compact Action Bar when bottom sheet is slid down */
                <div className="flex-1 px-3.5 py-2 flex items-center justify-between gap-3 bg-white">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-zinc-950 truncate">
                      {VEHICLE_OPTIONS[vehicle]?.label || "Ride"}
                    </p>
                    <p className="text-xs font-bold text-zinc-600">
                      ₹{currentBreakdown.totalFare} · Upfront fare
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMobileSheetState("half")}
                      className="px-3 py-2 border border-zinc-300 text-zinc-900 text-xs font-bold rounded-none bg-zinc-100 hover:bg-zinc-200 transition"
                    >
                      Rides
                    </button>
                    <button
                      type="button"
                      disabled={!canContinue}
                      onClick={handleConfirmRide}
                      className="px-4 py-2 bg-zinc-950 text-white text-xs font-black uppercase tracking-wider rounded-none hover:bg-black transition flex items-center gap-1.5"
                    >
                      <span>Confirm</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Mobile Pinned Bottom Action Footer: ALWAYS visible in half & up states */}
              {mobileSheetState !== "down" && (
                <div className="flex-shrink-0 p-3 pb-[max(14px,env(safe-area-inset-bottom))] border-t border-zinc-200 bg-white z-20 shadow-lg">
                  <motion.button
                    whileTap={{ scale: 0.99 }}
                    disabled={!canContinue}
                    onClick={handleConfirmRide}
                    className="w-full py-3.5 rounded-none bg-zinc-950 hover:bg-black disabled:opacity-35 text-white font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition cursor-pointer min-h-[48px]"
                  >
                    <span>
                      {bookingMode === "schedule"
                        ? t("booking.scheduleRide", "Schedule Ride")
                        : `${t("booking.confirmRide", "Confirm Ride")} • ${t(`fleet.${vehicle}.title`, VEHICLE_OPTIONS[vehicle]?.label || "Ride")}`}
                    </span>
                    <ArrowRight size={16} />
                  </motion.button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>

      {/* ══ 4. SERVICE UNAVAILABLE MODAL ══ */}
      <AnimatePresence>
        {showServiceUnavailableModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              className="bg-white rounded-none p-6 max-w-sm w-full shadow-2xl border border-zinc-300 text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-none bg-zinc-100 text-zinc-900 border border-zinc-300 flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-black text-zinc-900 tracking-tight uppercase">Service unavailable</h3>
                <p className="text-xs text-zinc-600 font-medium leading-relaxed">
                  {effectiveDistance > 500
                    ? `Selected route (${effectiveDistance} km) exceeds our maximum service radius of 500 km. Please select a closer destination.`
                    : "We currently do not operate trips on this route or location. Please adjust your pickup or drop location."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowServiceUnavailableModal(false)}
                className="w-full py-3 rounded-none bg-zinc-950 hover:bg-black text-white text-xs font-black uppercase tracking-wider transition cursor-pointer"
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ══ 5. BROWSER LOCATION SETTINGS GUIDE POPUP MODAL ══ */}
      <AnimatePresence>
        {showLocationSettingsGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-none p-5 sm:p-6 max-w-md w-full shadow-2xl border border-zinc-300 relative space-y-4"
            >
              <div className="flex items-start justify-between border-b border-zinc-200 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-none bg-zinc-950 text-white flex items-center justify-center flex-shrink-0">
                    <Settings size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-zinc-950 uppercase tracking-tight font-heading">
                      Enable Location Access
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-medium">Browser permission steps</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLocationSettingsGuide(false)}
                  className="text-zinc-400 hover:text-black transition p-1 cursor-pointer"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2 text-xs text-zinc-700">
                <div className="p-3 bg-zinc-50 border border-zinc-200 flex items-start gap-3">
                  <span className="w-5 h-5 bg-zinc-950 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">1</span>
                  <p className="text-[11px] leading-relaxed">
                    Look for the <strong>Padlock 🔒</strong> or <strong>Tune/Sliders ⚙️</strong> icon in your browser address bar next to the website URL.
                  </p>
                </div>
                <div className="p-3 bg-zinc-50 border border-zinc-200 flex items-start gap-3">
                  <span className="w-5 h-5 bg-zinc-950 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">2</span>
                  <p className="text-[11px] leading-relaxed">
                    Click <strong>&quot;Permissions&quot;</strong> or <strong>&quot;Site settings&quot;</strong>.
                  </p>
                </div>
                <div className="p-3 bg-zinc-50 border border-zinc-200 flex items-start gap-3">
                  <span className="w-5 h-5 bg-zinc-950 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">3</span>
                  <p className="text-[11px] leading-relaxed">
                    Find <strong>&quot;Location&quot;</strong> and switch from &quot;Block&quot; to <strong className="text-emerald-700">&quot;Allow&quot;</strong>.
                  </p>
                </div>
                <div className="p-3 bg-zinc-50 border border-zinc-200 flex items-start gap-3">
                  <span className="w-5 h-5 bg-zinc-950 text-white text-[10px] font-black flex items-center justify-center flex-shrink-0">4</span>
                  <p className="text-[11px] leading-relaxed">
                    Return here and click <strong>&quot;Ask Permission Again&quot;</strong>.
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLocationSettingsGuide(false)}
                  className="px-4 py-2 border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowLocationSettingsGuide(false);
                    useCurrentLocation();
                  }}
                  className="px-4 py-2 bg-zinc-950 hover:bg-black text-white text-xs font-black uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                >
                  <LocateFixed size={12} />
                  <span>Ask Permission Again</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}