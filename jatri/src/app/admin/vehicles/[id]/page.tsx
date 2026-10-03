"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  IndianRupee,
  CheckCircle,
  XCircle,
  Truck,
  Image as ImageIcon,
  ShieldCheck,
  Loader2,
} from "lucide-react";

export default function AdminVehicleReviewPage() {
  const { id } = useParams();
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [rates, setRates] = useState<any>(null);

  /* ================= LOAD ================= */

  useEffect(() => {
    async function loadRates() {
      try {
        const res = await axios.get("/api/vehicles/pricing");
        if (res.data.success) {
          setRates(res.data.rates);
        }
      } catch (err) {
        console.error("Failed to load rates:", err);
      }
    }
    loadRates();
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await axios.get(`/api/admin/vehicles/${id}`);
        setData(res.data.vehicle);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  /* ================= ACTIONS ================= */

  const approve = async () => {
    try {
      setActionLoading(true);
      await axios.post(`/api/admin/vehicles/${id}/approve`);
      router.push("/admin/dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
      setShowApprove(false);
    }
  };

  const reject = async () => {
    if (!rejectReason.trim()) return;

    try {
      setActionLoading(true);
      await axios.post(`/api/admin/vehicles/${id}/reject`, {
        reason: rejectReason,
      });
      router.push("/admin/dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
      setShowReject(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen grid place-items-center text-gray-400">
        Loading vehicle review...
      </div>
    );

  if (!data) return null;

  const standardRates: Record<string, { baseFare: number; pricePerKm: number; pricePerMinute: number; multiplier: number }> = {
    bike:    { baseFare: 30,  pricePerKm: 8,   pricePerMinute: 1.5, multiplier: 1.0 },
    auto:    { baseFare: 50,  pricePerKm: 12,  pricePerMinute: 2.0, multiplier: 1.2 },
    car:     { baseFare: 80,  pricePerKm: 18,  pricePerMinute: 3.0, multiplier: 1.5 },
    loading: { baseFare: 120, pricePerKm: 24,  pricePerMinute: 4.0, multiplier: 1.8 },
    truck:   { baseFare: 180, pricePerKm: 30,  pricePerMinute: 5.0, multiplier: 2.2 },
  };

  const vType = data.type || "car";
  const cfg = (rates && rates[vType.toLowerCase()]) || standardRates[vType.toLowerCase()] || standardRates.car;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* HEADER */}
      <header className="sticky top-0 bg-white border-b shadow-sm z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center gap-2.5 sm:gap-4">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition active:scale-95 shrink-0"
          >
            <ArrowLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm sm:text-lg truncate">{data.owner.name}</p>
            <p className="text-[11px] sm:text-xs text-gray-500 truncate">{data.owner.email}</p>
          </div>

          <StatusBadge status={data.status} />
        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-10 grid lg:grid-cols-2 gap-5 sm:gap-12">

        {/* IMAGE */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-md sm:shadow-xl bg-white border border-gray-100"
        >
          {data.imageUrl ? (
            <img
              src={data.imageUrl}
              alt="Vehicle"
              className="w-full h-[220px] sm:h-[420px] object-cover"
            />
          ) : (
            <div className="h-[220px] sm:h-[420px] grid place-items-center text-gray-300">
              <ImageIcon size={40} className="sm:w-[50px] sm:h-[50px]" />
            </div>
          )}
        </motion.div>

        {/* DETAILS */}
        <div className="space-y-4 sm:space-y-8">

          <Card title="Vehicle Details" icon={<Truck size={18} />}>
            <Info label="Vehicle Type" value={data.type} />
            <Info label="Registration Number" value={data.number} />
            <Info label="Model" value={data.model} />
          </Card>

          <Card title="Pricing Configuration (Standard)" icon={<IndianRupee size={18} />}>
            <Info label="Base Fare" value={`₹${cfg.baseFare}`} />
            <Info label="Price per KM" value={`₹${cfg.pricePerKm}`} />
            <Info label="Price per Minute" value={`₹${cfg.pricePerMinute}`} />
            <Info label="Multiplier" value={`${cfg.multiplier}x`} />
          </Card>

          {data.status === "pending" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-md sm:shadow-lg border border-gray-100 space-y-4 sm:space-y-6"
            >
              <div className="flex items-center gap-2 font-semibold text-sm sm:text-base">
                <ShieldCheck size={18} />
                Admin Decision
              </div>

              <div className="flex gap-2.5 sm:gap-4">
                <button
                  onClick={() => setShowApprove(true)}
                  className="flex-1 py-2.5 sm:py-3 rounded-xl bg-black text-white font-semibold text-xs sm:text-sm hover:bg-neutral-800 transition active:scale-95"
                >
                  Approve
                </button>

                <button
                  onClick={() => setShowReject(true)}
                  className="flex-1 py-2.5 sm:py-3 rounded-xl border border-gray-200 font-semibold text-xs sm:text-sm hover:bg-gray-50 transition active:scale-95"
                >
                  Reject
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* APPROVE MODAL */}
      <ConfirmModal
        open={showApprove}
        title="Approve this vehicle?"
        loading={actionLoading}
        onClose={() => setShowApprove(false)}
        onConfirm={approve}
      />

      {/* REJECT MODAL */}
      <RejectModal
        open={showReject}
        reason={rejectReason}
        setReason={setRejectReason}
        loading={actionLoading}
        onClose={() => setShowReject(false)}
        onConfirm={reject}
      />
    </div>
  );
}

/* ================= UI COMPONENTS ================= */

function Card({ title, icon, children }: any) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-md sm:shadow-lg border border-gray-100 space-y-4 sm:space-y-6"
    >
      <div className="flex items-center gap-2 font-semibold text-sm sm:text-base">
        {icon}
        {title}
      </div>
      {children}
    </motion.div>
  );
}

function Info({ label, value }: any) {
  return (
    <div className="flex justify-between items-center text-xs sm:text-sm gap-2">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="font-semibold text-right truncate">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: any) {
  if (status === "approved")
    return (
      <span className="px-2.5 py-1 sm:px-4 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1.5 shrink-0">
        <CheckCircle size={13} className="sm:w-3.5 sm:h-3.5" />
        Approved
      </span>
    );

  if (status === "rejected")
    return (
      <span className="px-2.5 py-1 sm:px-4 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold bg-red-100 text-red-700 flex items-center gap-1.5 shrink-0">
        <XCircle size={13} className="sm:w-3.5 sm:h-3.5" />
        Rejected
      </span>
    );

  return (
    <span className="px-2.5 py-1 sm:px-4 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold bg-yellow-100 text-yellow-700 shrink-0">
      Pending
    </span>
  );
}

/* ================= MODALS ================= */

function ConfirmModal({ open, title, loading, onClose, onConfirm }: any) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-sm"
          >
            <h2 className="text-lg font-bold">{title}</h2>

            <div className="flex gap-3 mt-6">
              <button onClick={onClose} className="flex-1 py-2 rounded-xl border">
                Cancel
              </button>

              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 py-2 rounded-xl bg-black text-white flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="animate-spin" size={16} />}
                Confirm
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function RejectModal({ open, reason, setReason, loading, onClose, onConfirm }: any) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-sm"
          >
            <h2 className="text-lg font-bold">Reject Vehicle</h2>

            <textarea
              placeholder="Enter rejection reason (required)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full mt-4 border rounded-xl p-3 text-sm"
            />

            <div className="flex gap-3 mt-6">
              <button onClick={onClose} className="flex-1 py-2 rounded-xl border">
                Cancel
              </button>

              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 py-2 rounded-xl bg-black text-white flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="animate-spin" size={16} />}
                Reject
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}