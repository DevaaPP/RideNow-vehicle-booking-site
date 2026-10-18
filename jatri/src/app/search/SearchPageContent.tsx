"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  ArrowLeft, MapPin, Navigation,
  Bike, Car, Truck, Clock, Route,
  Zap, Search, RefreshCw
} from "lucide-react";
import VehicleBookingCard from "@/features/booking/components/VehicleBookingCard";

const RouteMap = dynamic(() => import("@/features/maps/components/RouteMap"), { ssr: false });
import { VEHICLE_OPTIONS } from "@/lib/vehicleConfig";

const VEHICLE_META: Record<string, { label: string; Icon: typeof Bike }> = {
  scooty:   { label: VEHICLE_OPTIONS.scooty.label,   Icon: Bike  },
  bike:     { label: VEHICLE_OPTIONS.bike.label,     Icon: Bike  },
  auto:     { label: VEHICLE_OPTIONS.auto.label,     Icon: Car   },
  mini:     { label: VEHICLE_OPTIONS.mini.label,     Icon: Car   },
  car:      { label: VEHICLE_OPTIONS.car.label,      Icon: Car   },
  priority: { label: VEHICLE_OPTIONS.priority.label, Icon: Car   },
  loading:  { label: VEHICLE_OPTIONS.loading.label,  Icon: Truck },
  truck:    { label: VEHICLE_OPTIONS.truck.label,    Icon: Truck },
};

export default function SearchPageContent() {
  const params = useSearchParams();
  const router = useRouter();

  const [pickup,   setPickup]   = useState(params.get("pickup") || "");
  const [drop,     setDrop]     = useState(params.get("drop") || "");
  const [km,       setKm]       = useState<number | null>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading,  setLoading]  = useState(false);

  const vehicle      = params.get("vehicle") || "";
  const mobileNumber = params.get("mobileNumber") || "";
  const pickupLat    = Number(params.get("pickupLat"));
  const pickupLng    = Number(params.get("pickupLng"));
  const meta         = VEHICLE_META[vehicle];
  const eta          = km !== null ? Math.max(3, Math.round((km / 25) * 60)) : null;

  async function fetchNearbyVehicles(lat: number, lng: number, silent = false) {
    try {
      if (!silent) setLoading(true);
      const res  = await fetch("/api/vehicles/nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude: lat, longitude: lng, vehicleType: vehicle }),
      });
      const data = await res.json();
      if (data.success) setVehicles(data.vehicles);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  const handleDistance = useCallback((distance: number) => {
    setKm(distance);
  }, []);

  const handleMapChange = useCallback((p: string, d: string) => {
    setPickup(p);
    setDrop(d);
  }, []);

  useEffect(() => {
    if (!pickupLat || !pickupLng) return;
    fetchNearbyVehicles(pickupLat, pickupLng);

    // Auto-refresh drivers location every 15 seconds silently
    const interval = setInterval(() => {
      fetchNearbyVehicles(pickupLat, pickupLng, true);
    }, 15000);

    return () => clearInterval(interval);
  }, [pickupLat, pickupLng, vehicle]);

  return (
    <div className="min-h-screen bg-[#F7F1E5] text-[#10251C] overflow-x-hidden">
      <div className="absolute top-5 left-5 z-50">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => router.back()}
          className="w-10 h-10 rounded-[8px] bg-[#FAF7F0] border border-[#DED7CA] shadow-sm flex items-center justify-center hover:bg-white text-[#10251C] transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft size={16} />
        </motion.button>
      </div>

      <div className="relative w-full h-[52vh] z-0">
        <RouteMap
          pickup={pickup}
          drop={drop}
          pickupCoords={(pickupLat && pickupLng) ? [pickupLat, pickupLng] : null}
          dropCoords={(params.get("dropLat") && params.get("dropLng")) ? [Number(params.get("dropLat")), Number(params.get("dropLng"))] : null}
          onDistance={handleDistance}
          onChange={handleMapChange}
          vehicles={vehicles}
          bottomPadding={260}
        />

        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#F7F1E5] to-transparent pointer-events-none z-10" />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-[999]"
        >
          <div className="flex items-center gap-2 bg-[#FAF7F0]/95 backdrop-blur-sm border border-[#DED7CA] shadow-2xs px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#10251C]">
            <Route size={12} className="text-[#123D32]" />
            <span>{km ? `${km} km` : "Calculating…"}</span>
          </div>
          <div className="flex items-center gap-2 bg-[#FAF7F0]/95 backdrop-blur-sm border border-[#DED7CA] shadow-2xs px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#10251C]">
            <Clock size={12} className="text-[#123D32]" />
            <span>{eta ? `${eta} min` : "—"}</span>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 160, damping: 22 }}
        className="relative z-20 -mt-8 bg-[#FAF7F0] rounded-t-[20px] border-t border-[#DED7CA] shadow-[0_-8px_30px_rgba(18,61,50,0.06)] pt-4 pb-20 min-h-[52vh]"
      >
        <div className="w-10 h-1 bg-[#DED7CA] rounded-full mx-auto mb-4" />

        <div className="px-5 lg:px-8 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="bg-white border border-[#DED7CA] rounded-[12px] overflow-hidden mb-5 shadow-2xs"
          >
            <div className="flex gap-3 px-4 py-3 border-b border-[#DED7CA]/60">
              <div className="flex flex-col items-center pt-1.5 flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-[#123D32]" />
                <div className="w-px flex-1 bg-[#DED7CA] my-1" style={{ minHeight: 14 }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[#696B64] uppercase tracking-wider font-bold mb-0.5">Pickup</p>
                <p className="text-sm text-[#10251C] font-semibold leading-snug truncate">{pickup || "—"}</p>
              </div>
              <MapPin size={14} className="text-[#123D32] flex-shrink-0 mt-1.5" />
            </div>
            <div className="flex gap-3 px-4 py-3">
              <div className="flex-shrink-0 pt-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#B83A24]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[#696B64] uppercase tracking-wider font-bold mb-0.5">Drop</p>
                <p className="text-sm text-[#10251C] font-semibold leading-snug truncate">{drop || "—"}</p>
              </div>
              <Navigation size={14} className="text-[#B83A24] flex-shrink-0 mt-1.5" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-between mb-4"
          >
            <div>
              <h2 className="text-[#10251C] text-lg font-bold tracking-tight">
                {loading
                  ? "Finding vehicles…"
                  : vehicles.length > 0
                  ? `${vehicles.length} Available`
                  : "No vehicles nearby"}
              </h2>
              {meta && (
                <p className="text-[#696B64] text-xs mt-0.5">
                  {meta.label} rides near your pickup
                </p>
              )}
            </div>

            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div
                  key="searching"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  className="flex items-center gap-2 bg-[#E5EBDD] border border-[#cdd6c3] px-3 py-1.5 rounded-full"
                >
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-[#123D32]/30 border-t-[#123D32] animate-spin" />
                  <span className="text-[#123D32] text-xs font-semibold">Searching</span>
                </motion.div>
              ) : vehicles.length > 0 ? (
                <motion.div
                  key="live"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1.5 bg-[#E5EBDD] border border-[#cdd6c3] px-3 py-1.5 rounded-full"
                >
                  <Zap size={11} className="text-[#123D32] fill-[#123D32]" />
                  <span className="text-[#123D32] text-xs font-bold">Live</span>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>

          <AnimatePresence>
            {!loading && vehicles.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-14 text-center"
              >
                <div className="w-16 h-16 rounded-[12px] bg-[#E5EBDD] border border-[#cdd6c3] flex items-center justify-center mb-3 text-[#123D32]">
                  <Search size={24} />
                </div>
                <p className="text-[#10251C] font-bold text-base mb-1">No vehicles found</p>
                <p className="text-[#696B64] text-sm max-w-xs leading-relaxed">
                  No {meta?.label || "vehicle"} drivers are available near your pickup right now.
                </p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => fetchNearbyVehicles(pickupLat, pickupLng)}
                  className="mt-4 flex items-center gap-2 bg-[#123D32] hover:bg-[#0D3027] text-white text-xs font-bold px-5 py-2.5 rounded-[8px] transition shadow-xs cursor-pointer"
                >
                  <RefreshCw size={13} />
                  <span>Retry Search</span>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {vehicles.map((v, i) => (
              <motion.div
                key={v._id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              >
                <VehicleBookingCard
                  vehicle={v}
                  distanceKm={km ?? undefined}
                  isRecommended={i === 0}
                  onBook={() => {
                    const estFare = Math.round(v.baseFare + (km ?? 0) * v.pricePerKm);
                    const draft = {
                      pickup,
                      drop,
                      vehicle:    v.type,
                      driverId:   v.owner,
                      vehicleId:  v._id,
                      fare:       estFare,
                      pickupLat:  Number(pickupLat),
                      pickupLng:  Number(pickupLng),
                      dropLat:    params.get("dropLat") ? Number(params.get("dropLat")) : null,
                      dropLng:    params.get("dropLng") ? Number(params.get("dropLng")) : null,
                      mobileNumber,
                      distanceKm: km,
                    };
                    try {
                      if (typeof window !== "undefined") {
                        const serialized = JSON.stringify(draft);
                        sessionStorage.setItem("ridenow_booking_draft", serialized);
                        localStorage.setItem("ridenow_booking_draft", serialized);
                      }
                    } catch (e) {
                      console.warn("sessionStorage save error:", e);
                    }
                    router.push("/checkout");
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
