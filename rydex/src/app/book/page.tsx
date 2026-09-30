"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, MapPin, Navigation,
  Bike, Car, Truck, LocateFixed, Phone,
  CheckCircle2, ChevronRight, GraduationCap,
  Plus, Trash2, X, Users
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import useGetMe from "@/hooks/useGetMe";
import { calculateFareBreakdown } from "@/lib/fareEngine";

const RouteMap = dynamic(() => import("@/components/RouteMap"), { ssr: false });

type Place = {
  id: string;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  countrycode?: string;
  lat?: number;
  lng?: number;
};
type VehicleType = "bike" | "auto" | "car" | "loading" | "truck";

const VEHICLES = [
  { id: "bike",    label: "Bike",    Icon: Bike,  desc: "Quick & affordable" },
  { id: "auto",    label: "Auto",    Icon: Car,   desc: "Everyday rides"     },
  { id: "car",     label: "Car",     Icon: Car,   desc: "Comfort rides"      },
  { id: "loading", label: "Loading", Icon: Truck, desc: "Small cargo"        },
  { id: "truck",   label: "Truck",   Icon: Truck, desc: "Heavy transport"    },
];

const stepVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

export default function BookPage() {
  const router = useRouter();

  const { userData } = useSelector((state: RootState) => state.user);
  useGetMe(true);

  const [pickup,   setPickup]   = useState("");
  const [drop,     setDrop]     = useState("");
  const [vehicle,  setVehicle]  = useState<VehicleType | null>(null);
  const [mobile,   setMobile]   = useState("");

  const [rates, setRates] = useState<any>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);

  /* ── STUDENT MODE STATE ── */
  const [isStudent, setIsStudent] = useState<boolean>(false);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [eduEmailInput, setEduEmailInput] = useState("");
  const [institutionInput, setInstitutionInput] = useState("");
  const [verifyingStudent, setVerifyingStudent] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [studentSuccess, setStudentSuccess] = useState<string | null>(null);
  const [showStudentForm, setShowStudentForm] = useState(false);

  /* ── FAMILY ACCOUNT STATE ── */
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

  const handleVerifyStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError(null);
    setStudentSuccess(null);
    setVerifyingStudent(true);
    try {
      const res = await fetch("/api/user/verify-student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eduEmail: eduEmailInput, institution: institutionInput }),
      });
      const data = await res.json();
      if (data.success) {
        setIsStudent(true);
        setStudentDetails(data.studentDetails);
        setStudentSuccess(data.message || "Student status verified! 10% discount applied.");
        setShowStudentForm(false);
      } else {
        setStudentError(data.message || "Verification failed");
      }
    } catch (err: any) {
      setStudentError("Network error during student verification");
    } finally {
      setVerifyingStudent(false);
    }
  };

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch("/api/vehicles/pricing");
        const data = await res.json();
        if (data.success) {
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
    const defaultLimits: Record<string, { minDistance: number; maxDistance: number }> = {
      bike:    { minDistance: 0, maxDistance: 15 },
      auto:    { minDistance: 0, maxDistance: 30 },
      car:     { minDistance: 0, maxDistance: 100 },
      loading: { minDistance: 0, maxDistance: 150 },
      truck:   { minDistance: 0, maxDistance: 500 },
    };
    const source = rates || defaultLimits;
    const cfg = source[type.toLowerCase()] || defaultLimits.car;
    const min = cfg.minDistance !== undefined ? cfg.minDistance : 0;
    const max = cfg.maxDistance !== undefined ? cfg.maxDistance : 9999;
    return dist >= min && dist <= max;
  };

  const getDistanceValidity = () => {
    if (routeDistance === -1) {
      return { valid: false, message: "No rides available (impossible route - no road connection found)" };
    }
    const dist = (routeDistance !== null && routeDistance >= 0)
      ? routeDistance
      : ((pickupLat && pickupLng && dropLat && dropLng) ? getHaversineDistance(pickupLat, pickupLng, dropLat, dropLng) : null);

    if (!pickupLat || !pickupLng || !dropLat || !dropLng || !vehicle || dist === null) return { valid: true };
    
    const defaultLimits: Record<string, { minDistance: number; maxDistance: number }> = {
      bike:    { minDistance: 0, maxDistance: 15 },
      auto:    { minDistance: 0, maxDistance: 30 },
      car:     { minDistance: 0, maxDistance: 100 },
      loading: { minDistance: 0, maxDistance: 150 },
      truck:   { minDistance: 0, maxDistance: 500 },
    };
    
    const source = rates || defaultLimits;
    const cfg = source[vehicle.toLowerCase()] || defaultLimits.car;
    const min = cfg.minDistance !== undefined ? cfg.minDistance : 0;
    const max = cfg.maxDistance !== undefined ? cfg.maxDistance : 9999;
    
    if (dist < min) {
      return { valid: false, message: `${VEHICLES.find(v => v.id === vehicle)?.label} requires a minimum ride distance of ${min} km (Current: ${dist.toFixed(1)} km)` };
    }
    if (dist > max) {
      return { valid: false, message: `${VEHICLES.find(v => v.id === vehicle)?.label} is limited to a maximum ride distance of ${max} km (Current: ${dist.toFixed(1)} km)` };
    }
    return { valid: true };
  };

  const [pickupResults, setPickupResults] = useState<Place[]>([]);
  const [dropResults,   setDropResults]   = useState<Place[]>([]);
  const [pickupCountry, setPickupCountry] = useState<string | null>("in");

  const [pickupLat, setPickupLat] = useState<number | null>(null);
  const [pickupLng, setPickupLng] = useState<number | null>(null);
  const [dropLat,   setDropLat]   = useState<number | null>(null);
  const [dropLng,   setDropLng]   = useState<number | null>(null);
  const [locating,  setLocating]  = useState(false);
  const [vehicles,  setVehicles]  = useState<any[]>([]);

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
    if (!value || value.trim().length < 3) {
      setStops(prev => prev.map(s => (s.id === id ? { ...s, results: [] } : s)));
    } else {
      searchAddress(
        value,
        (res) => {
          setStops(prev => prev.map(s => (s.id === id ? { ...s, results: res } : s)));
        },
        pickupCountry || "in"
      );
    }
  };

  const selectStopPlace = async (stopId: string, p: Place) => {
    try {
      const res = await fetch(`/api/places?action=details&placeId=${p.id}`);
      const data = await res.json();
      if (data.status === "OK" && data.result) {
        const result = data.result;
        const formattedAddress = result.formatted_address;
        const lat = result.geometry.location.lat;
        const lng = result.geometry.location.lng;

        setStops(prev =>
          prev.map(s =>
            s.id === stopId
              ? {
                  ...s,
                  address: formattedAddress,
                  lat,
                  lng,
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

  const allStopsValid = stops.every(s => s.address.trim().length > 0 && s.lat !== null && s.lng !== null);
  const distanceValidity = getDistanceValidity();
  const canContinue = !!(
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
    routeDistance !== -1
  );

  /* ── SEARCH ── */
  const searchAddress = async (q: string, setResults: (r: Place[]) => void, restrict?: string | null, isDrop?: boolean) => {
    if (!q || q.trim().length < 3) { setResults([]); return; }
    try {
      const countryFilter = restrict || pickupCountry || "in";
      let url = `/api/places?action=autocomplete&input=${encodeURIComponent(q.trim())}&country=${countryFilter}`;
      
      if (isDrop && pickupLat !== null && pickupLng !== null) {
        const defaultLimits: Record<string, { maxDistance: number }> = {
          bike:    { maxDistance: 15 },
          auto:    { maxDistance: 30 },
          car:     { maxDistance: 100 },
          loading: { maxDistance: 150 },
          truck:   { maxDistance: 500 },
        };
        const source = rates || defaultLimits;
        const cfg = source[(vehicle || "car").toLowerCase()] || defaultLimits.car;
        
        // Use maxDistance as radius, add a small 20% buffer to allow suggestions slightly beyond the boundary
        const radiusKm = (cfg.maxDistance || 100) * 1.2;
        
        // Calculate bbox
        const deltaLat = radiusKm / 111;
        const deltaLng = radiusKm / (111 * Math.cos(pickupLat * Math.PI / 180));
        
        const minLat = pickupLat - deltaLat;
        const maxLat = pickupLat + deltaLat;
        const minLon = pickupLng - deltaLng;
        const maxLon = pickupLng + deltaLng;
        
        url += `&bbox=${minLon},${minLat},${maxLon},${maxLat}`;
        url += `&lat=${pickupLat}&lng=${pickupLng}`;
      } else if (!isDrop && pickupLat !== null && pickupLng !== null) {
        url += `&lat=${pickupLat}&lng=${pickupLng}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.status === "OK" && data.predictions) {
        const results: Place[] = data.predictions.map((p: any) => ({
          id: p.place_id,
          name: p.description,
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

  const fmt = (p: Place) => p.name;

  const selectPlace = async (p: Place, isPickup: boolean) => {
    try {
      const res = await fetch(`/api/places?action=details&placeId=${p.id}`);
      const data = await res.json();
      if (data.status === "OK" && data.result) {
        const result = data.result;
        const formattedAddress = result.formatted_address;
        const lat = result.geometry.location.lat;
        const lng = result.geometry.location.lng;
        
        let countrycode = "in";
        if (result.address_components) {
          const countryComp = result.address_components.find((c: any) => c.types.includes("country"));
          if (countryComp) {
            countrycode = String(countryComp.short_name || "in").toLowerCase();
          }
        }

        if (isPickup) {
          setPickup(formattedAddress);
          setPickupCountry(countrycode);
          setPickupLat(lat);
          setPickupLng(lng);
          setPickupResults([]);
        } else {
          setDrop(formattedAddress);
          setDropLat(lat);
          setDropLng(lng);
          setDropResults([]);
        }
      }
    } catch (err) {
      console.error("Error fetching place details:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, isPickup: boolean) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (isPickup) {
        if (pickupResults.length > 0) {
          selectPlace(pickupResults[0], true);
        }
      } else {
        if (dropResults.length > 0) {
          selectPlace(dropResults[0], false);
        }
      }
    }
  };

  const handleBlur = (isPickup: boolean) => {
    setTimeout(() => {
      if (isPickup) {
        setPickupResults(prev => {
          if (prev.length > 0) {
            selectPlace(prev[0], true);
          }
          return [];
        });
      } else {
        setDropResults(prev => {
          if (prev.length > 0) {
            selectPlace(prev[0], false);
          }
          return [];
        });
      }
    }, 200);
  };

  const handleGeolocationSuccess = async (coords: GeolocationCoordinates) => {
    const lat = coords.latitude;
    const lng = coords.longitude;

    // Immediately set coordinates so map centers and nearby drivers load
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
        setPickup(addr);
        setPickupCountry(countryCode);
      } else {
        setPickup(`Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
        setPickupCountry("in");
      }
    } catch (err) {
      console.error("Failed to reverse geocode current location:", err);
      setPickup(`Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    } finally {
      setLocating(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);

    // Tier 1: High accuracy with 5s timeout
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => handleGeolocationSuccess(coords),
      (err) => {
        console.warn("High accuracy geolocation failed, attempting standard accuracy:", err);
        // Tier 2: Low accuracy fallback
        navigator.geolocation.getCurrentPosition(
          ({ coords }) => handleGeolocationSuccess(coords),
          (err2) => {
            console.error("Standard geolocation failed:", err2);
            setLocating(false);
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 30000 }
        );
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
    );
  };

  /* ── INITIAL LOCATION ON MOUNT ── */
  useEffect(() => {
    useCurrentLocation();
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

    // Auto-refresh drivers location every 8 seconds
    const interval = setInterval(fetchVehicles, 8000);
    return () => clearInterval(interval);
  }, [pickupLat, pickupLng, vehicle]);

  const handleMapChange = (p: string, d: string, c1?: [number, number] | null, c2?: [number, number] | null, countryCode?: string | null) => {
    setPickup(p);
    setDrop(d);
    if (c1) {
      setPickupLat(c1[0]);
      setPickupLng(c1[1]);
    }
    if (c2) {
      setDropLat(c2[0]);
      setDropLng(c2[1]);
    }
    if (countryCode) {
      setPickupCountry(countryCode);
    }
  };

  /* ── PROGRESS ── */
  const progress = [!!vehicle, !!(mobile.length === 10), !!pickup, !!drop].filter(Boolean).length;

  return (
    <div className="relative min-h-screen w-full bg-zinc-100 flex flex-col md:flex-row overflow-hidden">
      
      {/* ── LEFT PANEL (Booking Form) ── */}
      <div className="w-full md:w-[450px] bg-white border-r border-zinc-200 shadow-2xl z-20 flex flex-col h-[55vh] md:h-screen flex-shrink-0 order-2 md:order-1 pt-24 md:pt-4">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center gap-4 flex-shrink-0">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors flex-shrink-0"
          >
            <ArrowLeft size={16} className="text-zinc-900" />
          </motion.button>
          <div className="flex-1 min-w-0">
            <h1 className="text-zinc-900 text-lg font-black tracking-tight leading-none">Book a Ride</h1>
            <p className="text-zinc-400 text-[10px] font-bold mt-1 uppercase tracking-wider">RideNow Fleet</p>
          </div>
          {/* Progress dots */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {[0, 1, 2, 3].map(i => (
              <motion.div
                key={i}
                animate={{ width: i < progress ? 16 : 6, background: i < progress ? "#09090b" : "#d4d4d8" }}
                transition={{ duration: 0.3 }}
                className="h-1.5 rounded-full"
              />
            ))}
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* ══ STEP 1 — VEHICLE ══ */}
          <motion.div variants={stepVariants} initial="hidden" animate="visible" transition={{ delay: 0.05 }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[9px] font-black">1</span>
              </div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Choose Vehicle</p>
            </div>

            {routeDistance === -1 ? (
              <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl text-center shadow-sm">
                <p className="text-rose-600 text-xs font-black uppercase tracking-wider">No Rides Available</p>
                <p className="text-zinc-500 text-[10px] mt-1 font-bold">No road connection or driving route found between these locations.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  {VEHICLES.map((v, i) => {
                    const active = vehicle === v.id;
                    const distanceKm = (routeDistance !== null && routeDistance >= 0)
                      ? routeDistance
                      : ((pickupLat && pickupLng && dropLat && dropLng) ? getHaversineDistance(pickupLat, pickupLng, dropLat, dropLng) : null);
                    const isLimitOk = distanceKm !== null ? checkLimit(v.id, distanceKm) : true;
                    return (
                      <motion.button
                        key={v.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.07 + i * 0.05 }}
                        whileTap={isLimitOk ? { scale: 0.95 } : {}}
                        onClick={() => setVehicle(v.id as VehicleType)}
                        className={`relative p-3.5 rounded-2xl border flex items-center gap-3 text-left transition-all duration-200 ${
                          active
                            ? "bg-zinc-900 border-zinc-900 shadow-lg"
                            : "bg-zinc-50 border-zinc-200 hover:border-zinc-400"
                        } ${!isLimitOk ? "opacity-45 hover:border-zinc-200 cursor-not-allowed" : ""}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                          active ? "bg-white" : "bg-zinc-200"
                        }`}>
                          <v.Icon size={18} className={active ? "text-zinc-900" : "text-zinc-600"} />
                        </div>
                        <div className="min-w-0 font-sans">
                          <p className={`text-sm font-bold truncate ${active ? "text-white" : "text-zinc-900"}`}>{v.label}</p>
                          <p className={`text-[10px] truncate ${active ? "text-zinc-400" : "text-zinc-400"}`}>{v.desc}</p>
                          {distanceKm !== null && (
                            <div className="mt-1.5 flex flex-wrap gap-1 items-center">
                              <p className={`text-xs font-black leading-none ${active ? "text-amber-400" : "text-zinc-900"}`}>
                                ₹{estimateFare(v.id, distanceKm)}
                              </p>
                              {!isLimitOk && (
                                <span className="text-[8px] font-black uppercase tracking-wider bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-md leading-none border border-rose-200 shadow-sm">
                                  Limit Exceeded
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        {active && (
                          <motion.div
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            className="absolute top-2.5 right-2.5"
                          >
                            <CheckCircle2 size={13} className="text-white fill-white/20" />
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Itemized Fare Breakdown Line-Item Receipt */}
                {vehicle && pickupLat && pickupLng && dropLat && dropLng && (
                  <div className="mt-3.5 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-zinc-200">
                      <p className="text-[11px] font-black uppercase text-zinc-900 tracking-wider flex items-center gap-1.5">
                        <span>💰</span> Transparent Fare Receipt
                      </p>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">No Hidden Charges</span>
                    </div>
                    {(() => {
                      const distKm = (routeDistance !== null && routeDistance >= 0)
                        ? routeDistance
                        : getHaversineDistance(pickupLat, pickupLng, dropLat, dropLng);
                      const breakdown = calculateFareBreakdown(vehicle, distKm, rates);
                      return (
                        <div className="space-y-1.5 text-xs text-zinc-600 font-medium">
                          <div className="flex justify-between">
                            <span>Base Fare</span>
                            <span className="font-bold text-zinc-900">₹{breakdown.baseFare}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span>Distance ({breakdown.distanceKm} km × ₹{breakdown.pricePerKm}/km)</span>
                            <span className="font-bold text-zinc-900">₹{breakdown.distanceFare}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span>Duration (~{breakdown.timeMinutes} min × ₹{breakdown.pricePerMinute}/min)</span>
                            <span className="font-bold text-zinc-900">₹{breakdown.timeFare}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span>Platform Service Fee</span>
                            <span className="font-bold text-zinc-900">₹{breakdown.platformFee}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span>Govt GST / Taxes (5%)</span>
                            <span className="font-bold text-zinc-900">₹{breakdown.taxes}</span>
                          </div>
                          <div className="pt-2 mt-1 border-t border-zinc-200 flex justify-between font-black text-sm text-zinc-900">
                            <span>Estimated Total</span>
                            <span className="text-zinc-900 font-black">₹{breakdown.totalFare}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
          </motion.div>

          <div className="h-px bg-zinc-100" />

          {/* ══ STEP 2 — MOBILE ══ */}
          <motion.div variants={stepVariants} initial="hidden" animate="visible" transition={{ delay: 0.15 }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[9px] font-black">2</span>
              </div>
              <label htmlFor="mobileInput" className="text-xs font-bold text-zinc-500 uppercase tracking-widest cursor-pointer">Passenger & Contact</label>
            </div>

            {/* 👨👩👧 RIDING FOR / FAMILY ACCOUNT SELECTOR */}
            {familyAccount?.members && familyAccount.members.length > 0 && (
              <div className="mb-3 p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Users size={14} className="text-amber-700" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-900">
                      Riding For
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                    {familyAccount.familyName || "Family Account"}
                  </span>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {/* Myself Option */}
                  <button
                    type="button"
                    onClick={() => handleSelectRider(null)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                      selectedFamilyMember === null
                        ? "bg-zinc-900 text-white shadow-sm"
                        : "bg-white text-zinc-700 border border-amber-200 hover:border-amber-400"
                    }`}
                  >
                    <span>Myself</span>
                  </button>

                  {/* Family Members */}
                  {familyAccount.members.map((member: any, mIdx: number) => {
                    const isSelected = selectedFamilyMember?.name === member.name && selectedFamilyMember?.relation === member.relation;
                    return (
                      <button
                        key={mIdx}
                        type="button"
                        onClick={() => handleSelectRider(member)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
                          isSelected
                            ? "bg-amber-600 text-white shadow-sm"
                            : "bg-white text-zinc-700 border border-amber-200 hover:border-amber-400"
                        }`}
                      >
                        <span>{member.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full uppercase font-black ${
                          isSelected ? "bg-amber-700 text-white" : "bg-amber-100 text-amber-800"
                        }`}>
                          {member.relation}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 focus-within:border-zinc-900 focus-within:bg-white transition-all">
              <div className="w-8 h-8 rounded-xl bg-zinc-200 flex items-center justify-center flex-shrink-0">
                <Phone size={14} className="text-zinc-600" />
              </div>
              <input
                id="mobileInput"
                type="tel"
                value={mobile}
                onChange={e => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="Enter 10-digit mobile number"
                inputMode="numeric"
                maxLength={10}
                className="flex-1 bg-transparent text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 outline-none"
              />
              <AnimatePresence>
                {mobile.length === 10 && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                    <CheckCircle2 size={16} className="text-emerald-500 fill-emerald-50 flex-shrink-0" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <div className="h-px bg-zinc-100" />

          {/* ══ STEP 3 — ROUTE ══ */}
          <motion.div variants={stepVariants} initial="hidden" animate="visible" transition={{ delay: 0.22 }} className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-full bg-zinc-900 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[9px] font-black">3</span>
              </div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Route Setup</p>
            </div>

            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl overflow-visible">
              
              {/* Pickup input */}
              <div className="relative z-30">
                <div className="flex items-center gap-3 px-4 py-3.5 focus-within:bg-white rounded-t-2xl transition-colors">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-3 h-3 rounded-full bg-zinc-900 border-2 border-white shadow" />
                    <div className="w-px h-5 bg-zinc-300 mt-1" />
                  </div>
                  <input
                    id="pickupInput"
                    aria-label="Pickup location"
                    value={pickup}
                    onChange={e => {
                      setPickup(e.target.value);
                      setPickupLat(null);
                      setPickupLng(null);
                      if (e.target.value.trim().length === 0) {
                        setPickupResults([]);
                      } else {
                        searchAddress(e.target.value, setPickupResults);
                      }
                    }}
                    onKeyDown={e => handleKeyDown(e, true)}
                    onBlur={() => handleBlur(true)}
                    placeholder="Pickup location"
                    className="flex-1 bg-transparent text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 outline-none"
                  />
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={useCurrentLocation}
                    disabled={locating}
                    className="w-8 h-8 rounded-xl bg-zinc-200 hover:bg-zinc-300 transition-colors flex items-center justify-center flex-shrink-0"
                  >
                    <LocateFixed size={14} className={`text-zinc-700 ${locating ? "animate-spin" : ""}`} />
                  </motion.button>
                </div>

                <AnimatePresence>
                  {pickupResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      className="absolute left-0 right-0 top-full mt-1 bg-white border border-zinc-200 rounded-2xl shadow-xl max-h-52 overflow-y-auto z-50"
                    >
                      {pickupResults.map((p, i) => (
                        <button
                          key={p.id}
                          onMouseDown={e => { e.preventDefault(); selectPlace(p, true); }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-0"
                        >
                          <MapPin size={13} className="text-zinc-400 flex-shrink-0" />
                          <span className="text-sm text-zinc-800 font-medium truncate">{fmt(p)}</span>
                          <ChevronRight size={13} className="text-zinc-300 flex-shrink-0 ml-auto" />
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Intermediate Stops */}
              {stops.map((stop, index) => (
                <div key={stop.id} className="relative z-20">
                  <div className="h-px bg-zinc-200 mx-4" />
                  <div className="flex items-center gap-3 px-4 py-3.5 focus-within:bg-white transition-colors">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shadow-sm">
                        {index + 1}
                      </div>
                      <div className="w-px h-4 bg-blue-200 mt-1" />
                    </div>
                    <input
                      id={`stopInput-${stop.id}`}
                      aria-label={`Stop ${index + 1} location`}
                      value={stop.address}
                      onChange={e => handleStopChange(stop.id, e.target.value)}
                      placeholder={`Stop ${index + 1} location`}
                      className="flex-1 bg-transparent text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveStop(stop.id)}
                      className="w-7 h-7 rounded-lg hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 flex items-center justify-center transition"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <AnimatePresence>
                    {stop.results && stop.results.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.98 }}
                        className="absolute left-0 right-0 top-full mt-1 bg-white border border-zinc-200 rounded-2xl shadow-xl max-h-52 overflow-y-auto z-50"
                      >
                        {stop.results.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onMouseDown={e => {
                              e.preventDefault();
                              selectStopPlace(stop.id, p);
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-0"
                          >
                            <MapPin size={13} className="text-blue-500 flex-shrink-0" />
                            <span className="text-sm text-zinc-800 font-medium truncate">{fmt(p)}</span>
                            <ChevronRight size={13} className="text-zinc-300 flex-shrink-0 ml-auto" />
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              <div className="h-px bg-zinc-200 mx-4" />

              {/* Drop input */}
              <div className="relative z-10">
                <div className="flex items-center gap-3 px-4 py-3.5 focus-within:bg-white rounded-b-2xl transition-colors">
                  <div className="flex-shrink-0">
                    <div className="w-3 h-3 rounded-sm bg-zinc-900 border-2 border-white shadow" />
                  </div>
                  <input
                    id="dropInput"
                    aria-label="Drop location"
                    value={drop}
                    onChange={e => {
                      setDrop(e.target.value);
                      setDropLat(null);
                      setDropLng(null);
                      if (e.target.value.trim().length === 0) {
                        setDropResults([]);
                      } else {
                        searchAddress(e.target.value, setDropResults, pickupCountry || "in", true);
                      }
                    }}
                    onKeyDown={e => handleKeyDown(e, false)}
                    onBlur={() => handleBlur(false)}
                    disabled={!pickup}
                    placeholder={pickup ? "Drop location" : "Select pickup first"}
                    className="flex-1 bg-transparent text-sm font-semibold text-zinc-900 placeholder:text-zinc-400 outline-none disabled:opacity-50"
                  />
                  <Navigation size={14} className="text-zinc-300 flex-shrink-0" />
                </div>

                <AnimatePresence>
                  {dropResults.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.98 }}
                      className="absolute left-0 right-0 top-full mt-1 bg-white border border-zinc-200 rounded-2xl shadow-xl max-h-52 overflow-y-auto z-50"
                    >
                      {dropResults.map((p, i) => (
                        <button
                          key={p.id}
                          onMouseDown={e => { e.preventDefault(); selectPlace(p, false); }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-zinc-50 transition-colors border-b border-zinc-100 last:border-0"
                        >
                          <Navigation size={13} className="text-zinc-400 flex-shrink-0" />
                          <span className="text-sm text-zinc-800 font-medium truncate">{fmt(p)}</span>
                          <ChevronRight size={13} className="text-zinc-300 flex-shrink-0 ml-auto" />
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

            {/* Add Stop Button */}
            {stops.length < 2 && (
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                  {stops.length === 0 ? "Multi-stop trips supported" : `${stops.length}/2 Stops Added`}
                </span>
                <button
                  type="button"
                  onClick={handleAddStop}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-200 transition"
                >
                  <Plus size={13} /> Add Stop
                </button>
              </div>
            )}

            {/* Smart Pickup Selector UI */}
            {smartPickups.length > 0 && (
              <div className="mt-3 p-3 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[11px] font-black uppercase text-emerald-800 tracking-wider">
                      📍 Smart Pickup Zones
                    </p>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold">Recommended Spots</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {smartPickups.map((spot) => {
                    const isSelected = selectedSmartPickup?.id === spot.id;
                    return (
                      <button
                        key={spot.id}
                        type="button"
                        onClick={() => handleSelectSmartPickup(spot)}
                        className={`flex-shrink-0 text-left p-2.5 rounded-xl border transition-all max-w-[220px] ${
                          isSelected
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-md scale-[1.02]"
                            : "bg-white text-zinc-800 border-emerald-200 hover:border-emerald-400 shadow-sm"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                            isSelected ? "bg-emerald-700 text-white" : "bg-emerald-100 text-emerald-800"
                          }`}>
                            {spot.badgeText || "Recommended"}
                          </span>
                          <span className={`text-[9px] font-bold ${isSelected ? "text-emerald-100" : "text-zinc-500"}`}>
                            🚶 {spot.walkingTimeText}
                          </span>
                        </div>
                        <p className="font-extrabold text-[11px] leading-tight truncate">{spot.spotName}</p>
                        <p className={`text-[9px] mt-0.5 truncate ${isSelected ? "text-emerald-100" : "text-zinc-500"}`}>
                          {spot.venueName}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>

          {/* 🎓 STUDENT MODE & FARE BREAKDOWN CARD */}
          {pickupLat && pickupLng && dropLat && dropLng && vehicle && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {/* Student Mode Card */}
              <div className={`p-4 rounded-2xl border transition-all ${isStudent ? "bg-indigo-950 text-white border-indigo-800 shadow-md" : "bg-zinc-900 text-white border-zinc-800 shadow-sm"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isStudent ? "bg-indigo-600 text-white" : "bg-zinc-800 text-amber-400"}`}>
                      <GraduationCap size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black uppercase tracking-wider">Student Pass (10% OFF)</h4>
                        {isStudent && (
                          <span className="text-[9px] font-black bg-emerald-500 text-zinc-950 px-2 py-0.5 rounded-full uppercase tracking-widest">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        {isStudent
                          ? `Verified: ${studentDetails?.eduEmail || "Student Pass"}`
                          : "Save 10% on every ride with your college email"}
                      </p>
                    </div>
                  </div>

                  {!isStudent && (
                    <button
                      type="button"
                      onClick={() => setShowStudentForm(!showStudentForm)}
                      className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs px-3 py-1.5 rounded-xl transition shadow"
                    >
                      {showStudentForm ? "Close" : "Verify ID"}
                    </button>
                  )}
                </div>

                {/* Inline Student Verification Form */}
                <AnimatePresence>
                  {!isStudent && showStudentForm && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleVerifyStudent}
                      className="mt-3 pt-3 border-t border-zinc-800 space-y-2.5"
                    >
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                        Enter your .edu or .ac.in Student Email
                      </p>
                      <div className="space-y-2">
                        <input
                          type="email"
                          required
                          placeholder="e.g. alex@university.edu or student@college.ac.in"
                          value={eduEmailInput}
                          onChange={(e) => setEduEmailInput(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-amber-400"
                        />
                        <input
                          type="text"
                          placeholder="University / College Name (Optional)"
                          value={institutionInput}
                          onChange={(e) => setInstitutionInput(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-amber-400"
                        />
                      </div>

                      {studentError && (
                        <p className="text-[10px] font-bold text-rose-400">{studentError}</p>
                      )}

                      <button
                        type="submit"
                        disabled={verifyingStudent || !eduEmailInput}
                        className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-zinc-950 font-black text-xs py-2 rounded-xl transition flex items-center justify-center gap-1.5"
                      >
                        {verifyingStudent ? "Verifying..." : "🎓 Verify & Activate 10% OFF"}
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>

              {/* Itemized Fare Receipt Card */}
              {(() => {
                const distanceKm = (routeDistance !== null && routeDistance >= 0)
                  ? routeDistance
                  : (getMultiStopHaversineDistance() || getHaversineDistance(pickupLat, pickupLng, dropLat, dropLng));
                const breakdown = calculateFareBreakdown(vehicle, distanceKm, rates, undefined, 0, isStudent);

                return (
                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-900 mb-2.5 pb-1.5 border-b border-zinc-200 flex items-center justify-between">
                      <span>Itemized Cost Receipt</span>
                      <span className="text-emerald-600 font-bold">Verified Fare</span>
                    </p>
                    <div className="space-y-1.5 text-xs text-zinc-600 font-medium">
                      <div className="flex justify-between">
                        <span>Base Fare</span>
                        <span className="font-bold text-zinc-900">₹{breakdown.baseFare}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span>Distance Fare ({breakdown.distanceKm} km × ₹{breakdown.pricePerKm}/km)</span>
                        <span className="font-bold text-zinc-900">₹{breakdown.distanceFare}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span>Duration Fare (~{breakdown.timeMinutes} min × ₹{breakdown.pricePerMinute}/min)</span>
                        <span className="font-bold text-zinc-900">₹{breakdown.timeFare}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span>Platform Service Fee</span>
                        <span className="font-bold text-zinc-900">₹{breakdown.platformFee}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span>Govt GST / Taxes (5%)</span>
                        <span className="font-bold text-zinc-900">₹{breakdown.taxes}</span>
                      </div>

                      {breakdown.isStudentDiscountApplied && (
                        <div className="flex justify-between text-[11px] text-emerald-600 font-extrabold pt-1 border-t border-emerald-100">
                          <span className="flex items-center gap-1">🎓 Student Pass Discount (-10%)</span>
                          <span>-₹{breakdown.studentDiscount}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-sm font-black text-zinc-900 pt-2 border-t border-zinc-200">
                        <span>Total Fare</span>
                        <span className="text-emerald-600">₹{breakdown.totalFare}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}

          {/* ══ CONTINUE CTA ══ */}
          <motion.div variants={stepVariants} initial="hidden" animate="visible" transition={{ delay: 0.3 }}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              whileHover={canContinue ? { scale: 1.02 } : {}}
              disabled={!canContinue}
              onClick={() => {
                if (!pickupLat || !pickupLng || !dropLat || !dropLng || !vehicle) return;
                const distanceKm = (routeDistance !== null && routeDistance >= 0)
                  ? routeDistance
                  : (getMultiStopHaversineDistance() || getHaversineDistance(pickupLat, pickupLng, dropLat, dropLng));
                const estFare = estimateFare(vehicle, distanceKm);
                
                let checkoutUrl = `/checkout?pickup=${encodeURIComponent(pickup)}&drop=${encodeURIComponent(drop)}&vehicle=${vehicle}&mobileNumber=${encodeURIComponent(mobile)}&pickupLat=${pickupLat}&pickupLng=${pickupLng}&dropLat=${dropLat}&dropLng=${dropLng}&fare=${estFare}`;
                
                if (selectedSmartPickup) {
                  checkoutUrl += `&isSmartPickup=true&smartPickupDetails=${encodeURIComponent(JSON.stringify(selectedSmartPickup))}`;
                }

                const validStops = stops
                  .filter(s => s.address && s.lat !== null && s.lng !== null)
                  .map((s, idx) => ({
                    address: s.address,
                    lat: s.lat,
                    lng: s.lng,
                    order: idx + 1,
                  }));

                if (validStops.length > 0) {
                  checkoutUrl += `&stops=${encodeURIComponent(JSON.stringify(validStops))}`;
                }

                if (selectedFamilyMember) {
                  checkoutUrl += `&isFamilyRide=true&familyMember=${encodeURIComponent(JSON.stringify(selectedFamilyMember))}`;
                }

                router.push(checkoutUrl);
              }}
              className="w-full h-14 rounded-2xl bg-zinc-900 hover:bg-black disabled:opacity-35 text-white font-black text-sm tracking-wide flex items-center justify-center gap-2.5 transition-colors shadow-lg disabled:shadow-none"
            >
              <span>Request Ride</span>
              <motion.div
                animate={canContinue ? { x: [0, 4, 0] } : {}}
                transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1 }}
              >
                <ArrowRight size={17} />
              </motion.div>
            </motion.button>
            
            <AnimatePresence>
              {!canContinue && (
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className={`text-center text-[10px] font-bold mt-2.5 uppercase tracking-wider ${
                    (!distanceValidity.valid || routeDistance === -1) ? "text-rose-500" : "text-zinc-400"
                  }`}
                >
                  {!vehicle ? "Select a vehicle type" :
                   mobile.length !== 10 ? "Enter a 10-digit mobile number" :
                   !pickup ? "Set pickup location" :
                   !drop ? "Set drop location" :
                   !allStopsValid ? "Please complete all added intermediate stops" :
                   routeDistance === -1 ? "No rides available (impossible route - no road connection found)" :
                   !distanceValidity.valid ? distanceValidity.message : ""}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </div>

      {/* ── RIGHT PANEL (Full Map) ── */}
      <div className="flex-1 h-[45vh] md:h-screen z-10 order-1 md:order-2 relative">
        <RouteMap
          pickup={pickup}
          drop={drop}
          pickupCoords={pickupLat && pickupLng ? [pickupLat, pickupLng] : null}
          dropCoords={dropLat && dropLng ? [dropLat, dropLng] : null}
          onChange={handleMapChange}
          onDistance={setRouteDistance}
          vehicles={vehicles}
          disableFallbackGeocode={true}
          smartPickups={smartPickups}
          onSelectSmartPickup={handleSelectSmartPickup}
          stops={stops.filter(s => s.lat !== null && s.lng !== null).map(s => ({ address: s.address, lat: s.lat!, lng: s.lng! }))}
        />
      </div>

    </div>
  );
}