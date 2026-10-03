"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  Car,
  Truck,
  Package,
  CheckCircle,
  Pencil,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";

/* ================= CONFIG ================= */

type VehicleId = "bike" | "auto" | "car" | "loading" | "truck";

const VEHICLES = [
  { id: "bike", label: "Bike", icon: Bike, desc: "2 wheeler" },
  { id: "auto", label: "Auto", icon: Car, desc: "3 wheeler ride" },
  { id: "car", label: "Car", icon: Car, desc: "4 wheeler ride" },
  { id: "loading", label: "Loading", icon: Package, desc: "Small goods" },
  { id: "truck", label: "Truck", icon: Truck, desc: "Heavy transport" },
];

const VEHICLE_REGEX =
  /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,2}[0-9]{4}$/;

/* ================= PAGE ================= */

export default function PartnerVehiclePage() {
  const router = useRouter();
  const { update } = useSession();

  const [vehicleType, setVehicleType] = useState<string>("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");

  const [completed, setCompleted] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ================= FETCH VEHICLE (AUTO-FILL) ================= */

  useEffect(() => {
    async function load() {
      try {
        const res = await axios.get("/api/partner/vehicle");

        const { user, vehicle } = res.data;

        if (user?.vendorOnboardingStep >= 1) {
          setCompleted(true);
        }

        // 🔥 AUTO FILL FROM API
        if (vehicle) {
          setVehicleType(vehicle.type);
          setVehicleNumber(vehicle.number);
          setVehicleModel(vehicle.model);
        }
      } catch (err) {
        console.error("Vehicle fetch failed");
      }
    }

    load();
  }, []);

  /* ================= SUBMIT ================= */

  const submitVehicle = async () => {
    if (completed && !editMode) {
      router.push("/partner/onboard/documents");
      return;
    }

    if (!vehicleType) {
      setError("Select vehicle type");
      return;
    }

    if (!VEHICLE_REGEX.test(vehicleNumber)) {
      setError("Invalid vehicle number (e.g. MH12AB1234)");
      return;
    }

    if (vehicleModel.trim().length < 3) {
      setError("Invalid vehicle model");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await axios.post("/api/partner/vehicle", {
        type: vehicleType,
        number: vehicleNumber,
        vehicleModel,
      });

      await update({ role: "vendor" });

      router.push("/partner/onboard/documents");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 sm:bg-white flex flex-col justify-center px-3 sm:px-4 py-6 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-xl mx-auto bg-white rounded-2xl sm:rounded-3xl border border-gray-200/80 shadow-[0_10px_35px_rgba(0,0,0,0.06)] sm:shadow-[0_25px_70px_rgba(0,0,0,0.15)] p-5 sm:p-8"
      >
        {/* ================= HEADER ================= */}
        <div className="relative text-center">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="absolute left-0 top-0 w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition active:scale-95"
          >
            <ArrowLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>

          <p className="text-[11px] sm:text-xs text-gray-500 font-semibold tracking-wide uppercase">
            Step 1 of 3
          </p>

          <h1 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">
            Vehicle Details
          </h1>

          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Add your vehicle information
          </p>

          {completed && !editMode && (
            <div className="mt-3 sm:mt-4 flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-1.5 text-green-600 text-xs sm:text-sm font-semibold">
                <CheckCircle size={15} />
                Completed
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setEditMode(true)}
                className="text-xs font-semibold text-black underline flex items-center gap-1 py-1"
              >
                <Pencil size={12} />
                Edit details
              </motion.button>
            </div>
          )}
        </div>

        {/* ================= FORM ================= */}
        <div
          className={`mt-6 sm:mt-8 space-y-5 sm:space-y-6 ${
            completed && !editMode
              ? "opacity-50 pointer-events-none"
              : ""
          }`}
        >
          {/* VEHICLE TYPE */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2.5">
              Vehicle type
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {VEHICLES.map((v) => {
                const Icon = v.icon;
                const active = vehicleType === v.id;

                return (
                  <motion.button
                    key={v.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setVehicleType(v.id)}
                    className={`rounded-xl sm:rounded-2xl border p-3 sm:p-4 flex flex-col items-center gap-1.5 sm:gap-2 transition text-center
                      ${
                        active
                          ? "bg-black text-white border-black shadow-md"
                          : "border-gray-200 hover:border-black bg-white"
                      }`}
                  >
                    <div
                      className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0
                        ${
                          active
                            ? "bg-white text-black"
                            : "bg-black text-white"
                        }`}
                    >
                      <Icon size={18} className="sm:w-5 sm:h-5" />
                    </div>

                    <p className="text-xs sm:text-sm font-semibold leading-tight">
                      {v.label}
                    </p>

                    <p
                      className={`text-[10px] sm:text-xs leading-tight ${
                        active
                          ? "text-gray-300"
                          : "text-gray-500"
                      }`}
                    >
                      {v.desc}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* VEHICLE NUMBER */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block">
              Vehicle number
            </label>
            <input
              value={vehicleNumber}
              onChange={(e) =>
                setVehicleNumber(e.target.value.toUpperCase())
              }
              placeholder="MH12AB1234"
              className="mt-1.5 w-full border-b border-gray-300 pb-2 text-sm sm:text-base focus:outline-none focus:border-black transition bg-transparent uppercase font-mono tracking-wider"
            />
          </div>

          {/* VEHICLE MODEL */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block">
              Vehicle model / capacity
            </label>
            <input
              value={vehicleModel}
              onChange={(e) => setVehicleModel(e.target.value)}
              placeholder="Tata Ace / 1.5 Ton"
              className="mt-1.5 w-full border-b border-gray-300 pb-2 text-sm sm:text-base focus:outline-none focus:border-black transition bg-transparent"
            />
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <p className="mt-4 text-xs sm:text-sm text-red-500 bg-red-50 p-2.5 rounded-lg border border-red-100">
            {error}
          </p>
        )}

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading}
          onClick={submitVehicle}
          className="mt-6 sm:mt-8 w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-black text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-40 transition shadow-lg active:scale-98"
        >
          {completed && !editMode
            ? "Continue"
            : editMode
            ? "Save & Continue"
            : loading
            ? "Submitting..."
            : "Continue"}
          <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" />
        </motion.button>
      </motion.div>
    </div>
  );
}
