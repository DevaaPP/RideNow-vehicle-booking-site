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

type VehicleId =
  | "scooty"
  | "bike"
  | "auto"
  | "mini"
  | "car"
  | "priority"
  | "loading"
  | "truck";

const VEHICLES = [
  { id: "scooty", label: "Scooty", icon: Bike, desc: "2-Wheeler Lightweight Commute" },
  { id: "bike", label: "Bike / Moto", icon: Bike, desc: "2-Wheeler Solo Motorcycle" },
  { id: "auto", label: "Auto", icon: Car, desc: "3-Wheeler Doorstep Transit" },
  { id: "mini", label: "Mini (Hatchback)", icon: Car, desc: "4-Wheeler Compact AC (WagonR, Tiago)" },
  { id: "car", label: "Premier (Sedan / Cab)", icon: Car, desc: "4-Wheeler Executive AC (Dzire, Amaze)" },
  { id: "priority", label: "XL Priority (SUV)", icon: Car, desc: "6-Seater Spacious SUV (Ertiga, Innova)" },
  { id: "loading", label: "Loading (Cargo Mini)", icon: Package, desc: "Commercial Light Goods (Tata Ace)" },
  { id: "truck", label: "Truck (Heavy Transport)", icon: Truck, desc: "Heavy Commercial Transport Fleet" },
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
      setError("Please select a vehicle category.");
      return;
    }

    if (!VEHICLE_REGEX.test(vehicleNumber)) {
      setError("Invalid registration number format (e.g. MH12AB1234 or DL01XY5678).");
      return;
    }

    if (vehicleModel.trim().length < 3) {
      setError("Please enter a valid vehicle model/capacity specification.");
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
      setError(err?.response?.data?.message || "Failed to save vehicle details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F1E5] flex flex-col justify-center px-3 sm:px-6 py-8 sm:py-16 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-xl mx-auto bg-[#FAF7F0] rounded-[16px] border border-[#DED7CA] p-6 sm:p-10 shadow-sm"
      >
        {/* ================= HEADER ================= */}
        <div className="relative border-b border-[#DED7CA]/70 pb-6 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              className="w-8 h-8 rounded-[8px] border border-[#DED7CA] bg-white flex items-center justify-center hover:bg-[#FAF7F0] text-[#10251C] transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>

            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#696B64]">
              Step 01 / 03
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-serif font-bold mt-4 tracking-tight text-[#10251C]">
            Vehicle Fleet Details
          </h1>

          <p className="text-xs sm:text-sm text-[#696B64] mt-1 leading-relaxed">
            Select your fleet classification and specify registered vehicle identity.
          </p>

          {completed && !editMode && (
            <div className="mt-4 p-3 bg-white border border-[#DED7CA] rounded-[8px] flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2 text-[#10251C] text-xs font-semibold">
                <CheckCircle size={15} className="text-[#123D32]" />
                <span>Vehicle details recorded on file</span>
              </div>

              <button
                onClick={() => setEditMode(true)}
                className="text-xs font-mono font-bold text-[#123D32] underline flex items-center gap-1 hover:text-[#0D3027] uppercase tracking-wider cursor-pointer"
              >
                <Pencil size={12} />
                Edit
              </button>
            </div>
          )}
        </div>

        {/* ================= FORM ================= */}
        <div
          className={`space-y-6 ${
            completed && !editMode ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          {/* VEHICLE TYPE */}
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#696B64] block mb-2.5">
              Vehicle Classification
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {VEHICLES.map((v) => {
                const Icon = v.icon;
                const active = vehicleType === v.id;

                return (
                  <button
                    type="button"
                    key={v.id}
                    onClick={() => setVehicleType(v.id)}
                    className={`rounded-[10px] border p-3.5 flex flex-col items-start gap-2 transition-colors text-left cursor-pointer
                      ${
                        active
                          ? "bg-[#123D32] text-white border-[#123D32] shadow-xs"
                          : "border-[#DED7CA] hover:border-[#123D32]/40 bg-white text-[#10251C]"
                      }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0
                        ${
                          active
                            ? "bg-white/20 text-white"
                            : "bg-[#E5EBDD] text-[#123D32]"
                        }`}
                    >
                      <Icon size={15} />
                    </div>

                    <div>
                      <p className="text-xs sm:text-sm font-bold leading-tight">
                        {v.label}
                      </p>
                      <p
                        className={`text-[10px] leading-tight mt-0.5 font-mono ${
                          active ? "text-[#E5EBDD]/80" : "text-[#696B64]"
                        }`}
                      >
                        {v.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* VEHICLE NUMBER */}
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#696B64] block mb-1.5">
              Registration Certificate (RC) Number
            </label>
            <input
              value={vehicleNumber}
              onChange={(e) =>
                setVehicleNumber(e.target.value.toUpperCase())
              }
              placeholder="e.g. AS01AB1234"
              className="w-full border border-[#DED7CA] rounded-[8px] p-3 text-sm focus:outline-none focus:border-[#123D32] transition-colors bg-white text-[#10251C] uppercase font-mono tracking-wider"
            />
            <p className="text-[10px] font-mono text-[#696B64] mt-1">
              Must match the vehicle RC document uploaded in Step 2.
            </p>
          </div>

          {/* VEHICLE MODEL */}
          <div>
            <label className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#696B64] block mb-1.5">
              Vehicle Model & Manufacturer Specs
            </label>
            <input
              value={vehicleModel}
              onChange={(e) => setVehicleModel(e.target.value)}
              placeholder="e.g. Maruti Suzuki WagonR 2023 / Tata Ace 1.5T"
              className="w-full border border-[#DED7CA] rounded-[8px] p-3 text-sm focus:outline-none focus:border-[#123D32] transition-colors bg-white text-[#10251C]"
            />
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mt-4 p-3 rounded-[8px] bg-[#B83A24]/10 border border-[#B83A24] text-xs text-[#B83A24] font-mono">
            {error}
          </div>
        )}

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.99 }}
          disabled={loading}
          onClick={submitVehicle}
          className="mt-8 w-full h-12 sm:h-13 rounded-[8px] bg-[#123D32] hover:bg-[#0D3027] text-white font-bold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
        >
          <span>
            {completed && !editMode
              ? "Continue to Step 2"
              : editMode
              ? "Save & Continue"
              : loading
              ? "Saving Record..."
              : "Continue to Step 2"}
          </span>
          <ArrowRight size={16} />
        </motion.button>
      </motion.div>
    </div>
  );
}
