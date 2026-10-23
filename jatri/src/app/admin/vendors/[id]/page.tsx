"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  Car,
  FileText,
  Landmark,
  ShieldCheck,
  Video,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

/* ================= PAGE ================= */

export default function AdminVendorReviewPage() {
  const { id } = useParams();
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await axios.get(`/api/admin/vendors/${id}`);
      setData(res.data.vendor);
      setLoading(false);
    }
    load();
  }, [id]);

  const approveVendor = async () => {
    try {
      setActionLoading(true);
      const res = await axios.post(`/api/admin/vendors/${id}/approve`);
      if (res.data.success) {
        router.push("/admin/dashboard");
      } else {
        alert(res.data.message || "Approval failed");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Approval failed due to a server error");
    } finally {
      setActionLoading(false);
      setShowApprove(false);
    }
  };

  const rejectVendor = async () => {
    if (!rejectReason.trim()) return;
    try {
      setActionLoading(true);
      const res = await axios.post(`/api/admin/vendors/${id}/reject`, {
        reason: rejectReason,
      });
      if (res.data.success) {
        router.push("/admin/dashboard");
      } else {
        alert(res.data.message || "Rejection failed");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Rejection failed due to a server error");
    } finally {
      setActionLoading(false);
      setShowReject(false);
    }
  };

  const handleVerifyWoman = async (action: "approve" | "reject" | "revoke", notes?: string) => {
    try {
      setActionLoading(true);
      const res = await axios.post(`/api/admin/drivers/${id}/verify-woman`, {
        action,
        notes: notes || (action === "approve" ? "Verified by Admin" : "Status updated by Admin"),
      });
      if (res.data?.success) {
        setData((prev: any) => ({
          ...prev,
          safetyMatching: res.data.safetyMatching,
        }));
      } else {
        alert(res.data?.message || "Failed to update women driver status");
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Error updating women driver status");
    } finally {
      setActionLoading(false);
    }
  };

  const updatePillarStatus = async (pillar: string, status: string) => {
    try {
      setActionLoading(true);
      const res = await axios.post(`/api/admin/vendors/${id}/verify-pillar`, {
        pillar,
        status,
      });
      if (res.data.success) {
        setData((prev: any) => ({
          ...prev,
          driverVerificationStatus: res.data.driverVerificationStatus,
          vendorStatus: res.data.vendorStatus,
        }));
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update pillar status");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen grid place-items-center text-gray-500">
        Loading vendor review…
      </div>
    );

  if (!data) return null;

  return (
    <div className="min-h-screen bg-[#F7F1E5]">

      {/* ================= HEADER ================= */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#FAF7F0]/90 border-b border-[#DED7CA]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center gap-2.5 sm:gap-4">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-[8px] border border-[#DED7CA] flex items-center justify-center bg-[#FAF7F0] hover:bg-[#F7F1E5] text-[#10251C] transition active:scale-95 shrink-0"
          >
            <ArrowLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>

          <div className="flex-1 min-w-0">
            <p className="font-serif font-bold text-sm sm:text-lg truncate text-[#10251C]">{data.name}</p>
            <p className="text-[11px] sm:text-xs text-[#696B64] truncate">{data.email}</p>
          </div>

          <StatusBadge status={data.vendorStatus} />
        </div>
      </header>

      {/* ================= MAIN ================= */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-10 grid lg:grid-cols-3 gap-5 sm:gap-8">

        {/* LEFT SIDE */}
        <div className="lg:col-span-2 space-y-5 sm:space-y-8">

          {/* WOMEN'S SAFETY DRIVER VERIFICATION ENGINE */}
          <AnimatedCard title="Women's Safety Driver Verification" icon={<ShieldCheck size={18} className="text-emerald-600" />}>
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-800">Declared Driver Category</p>
                  <p className="text-[11px] text-gray-500 capitalize">
                    {data.safetyMatching?.driverCategory === "woman" ? "Female Driver (Woman)" : "Standard / Not Specified"}
                  </p>
                </div>
                <span className={`inline-block text-[10px] uppercase font-bold px-2.5 py-1 rounded-full ${
                  data.safetyMatching?.driverVerificationStatus === "verified"
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : data.safetyMatching?.driverVerificationStatus === "pending"
                    ? "bg-amber-100 text-amber-700 border border-amber-200"
                    : data.safetyMatching?.driverVerificationStatus === "rejected"
                    ? "bg-red-100 text-red-700 border border-red-200"
                    : "bg-gray-100 text-gray-600 border border-gray-200"
                }`}>
                  {data.safetyMatching?.driverVerificationStatus || "not_submitted"}
                </span>
              </div>

              {data.safetyMatching?.verifiedAt && (
                <p className="text-[11px] text-gray-500">
                  Verified On: {new Date(data.safetyMatching.verifiedAt).toLocaleDateString()}
                </p>
              )}
              {data.safetyMatching?.verificationNotes && (
                <p className="text-[11px] text-gray-500 italic bg-gray-50 p-2 rounded-lg border border-gray-100">
                  Notes: {data.safetyMatching.verificationNotes}
                </p>
              )}

              <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                {data.safetyMatching?.driverVerificationStatus !== "verified" ? (
                  <button
                    type="button"
                    onClick={() => handleVerifyWoman("approve", "Approved after document & video KYC review")}
                    disabled={actionLoading}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition disabled:opacity-40 cursor-pointer shadow-xs"
                  >
                    Approve as Verified Woman Driver
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleVerifyWoman("revoke", "Revoked by admin")}
                    disabled={actionLoading}
                    className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition disabled:opacity-40 cursor-pointer shadow-xs"
                  >
                    Revoke Woman Driver Status
                  </button>
                )}
                {data.safetyMatching?.driverVerificationStatus === "pending" && (
                  <button
                    type="button"
                    onClick={() => handleVerifyWoman("reject", "Application rejected by admin")}
                    disabled={actionLoading}
                    className="py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition disabled:opacity-40 cursor-pointer shadow-xs"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          </AnimatedCard>

          {/* 7-PILLAR VERIFICATION STATUS ENGINE */}
          <AnimatedCard title="Driver Verification Status Engine (7 Pillars)" icon={<ShieldCheck size={18} className="text-orange-600" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: "identity", label: "1. Digital Identity (Aadhaar/PAN)" },
                { key: "drivingLicense", label: "2. Driving Licence (DL Class)" },
                { key: "face", label: "3. Face Match & Video KYC" },
                { key: "background", label: "4. Criminal & Police Clearance" },
                { key: "address", label: "5. Address & Domicile" },
                { key: "bank", label: "6. Bank Account & UPI Binding" },
                { key: "vehicle", label: "7. Vehicle Compliance (RC/Ins/PUC)" },
              ].map((p) => {
                const currentStatus = data.driverVerificationStatus?.[p.key] || "pending";
                return (
                  <div key={p.key} className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{p.label}</p>
                      <span className={`inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-full mt-1 ${
                        currentStatus === "verified"
                          ? "bg-green-100 text-green-700"
                          : currentStatus === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {currentStatus}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updatePillarStatus(p.key, "verified")}
                        disabled={actionLoading || currentStatus === "verified"}
                        className="px-2 py-1 text-[11px] font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-40"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => updatePillarStatus(p.key, "rejected")}
                        disabled={actionLoading || currentStatus === "rejected"}
                        className="px-2 py-1 text-[11px] font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-40"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </AnimatedCard>

          <AnimatedCard title="Vehicle & Statutory Compliance Details" icon={<Car size={18} />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Vehicle Type" value={data.vehicle?.type} />
              <InfoRow label="Model" value={data.vehicle?.model} />
              <InfoRow label="Registration Plate" value={data.vehicle?.number || data.documents?.rcNumber} />
              <InfoRow label="Driving Licence No." value={data.documents?.licenseNumber || "—"} />
              <InfoRow label="Insurance Policy No." value={data.documents?.insurancePolicyNumber || "—"} />
              <InfoRow
                label="Insurance Expiry"
                value={data.documents?.insuranceExpiry ? new Date(data.documents.insuranceExpiry).toLocaleDateString() : "—"}
              />
            </div>
          </AnimatedCard>

          <AnimatedCard title="Compliance Documents" icon={<FileText size={18} />}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-6">
              <DocPreview label="Aadhaar / Identity Proof" url={data.documents?.aadhaarUrl} />
              <DocPreview label="Driving License" url={data.documents?.licenseUrl} />
              <DocPreview label="Vehicle RC" url={data.documents?.rcUrl} />
              <DocPreview label="Commercial Insurance" url={data.documents?.insuranceUrl} />
              <DocPreview label="PUC Certificate" url={data.documents?.pucUrl} />
              <DocPreview label="Fitness / Commercial Permit" url={data.documents?.fitnessUrl || data.documents?.permitUrl} />
            </div>
          </AnimatedCard>

        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-5 sm:space-y-8">

          {/* DRIVER SHIFT & COOLDOWN CARD */}
          <AnimatedCard title="Driver Shift & Cooldown" icon={<AlertTriangle size={18} />}>
            <div className="space-y-4">
              {/* Cooldown Status Badge & Summary */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Dispatch Cooldown Status
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Triggered after 3+ cancellations in a single shift
                  </p>
                </div>
                {data.shiftAnalytics?.isCooldownActive ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-black uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                    Cooldown Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black uppercase tracking-wider">
                    <CheckCircle size={13} className="text-emerald-600" />
                    Normal / Eligible
                  </span>
                )}
              </div>

              {/* Cooldown Details when Active */}
              {data.shiftAnalytics?.isCooldownActive && (
                <div className="p-3 bg-red-50/80 border border-red-200 rounded-2xl text-xs space-y-1.5 text-red-950">
                  <div className="flex justify-between items-center font-bold">
                    <span>Remaining Timeout:</span>
                    <span className="font-mono text-red-700 bg-red-100 px-2 py-0.5 rounded-lg">
                      {data.shiftAnalytics.cooldownRemainingMinutes} min
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-red-800">
                    <span>Blocked Until:</span>
                    <span className="font-medium">
                      {new Date(data.shiftAnalytics.dispatchBlockedUntil).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {data.shiftAnalytics.latestCancellationReason && (
                    <div className="pt-1.5 border-t border-red-200/80 text-[11px] text-red-900">
                      <span className="font-bold">Reason: </span>
                      <span>{data.shiftAnalytics.latestCancellationReason}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Shift Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Current Shift Date
                  </span>
                  <span className="text-sm font-black text-gray-900">
                    {data.shiftAnalytics?.shiftDate || new Date().toISOString().split("T")[0]}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Today's Cancellations
                  </span>
                  <span className={`text-sm font-black ${
                    (data.shiftAnalytics?.dailyCancellations || 0) >= 3 ? "text-red-600" : "text-gray-900"
                  }`}>
                    {data.shiftAnalytics?.dailyCancellations ?? 0}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Total All-Time Driver Cancelled
                  </span>
                  <span className="text-sm font-black text-gray-900">
                    {data.shiftAnalytics?.totalDriverCancellations ?? 0}
                  </span>
                </div>

                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Driver Shift State
                  </span>
                  <span className={`text-sm font-black ${
                    data.isOnline ? "text-emerald-600" : "text-gray-500"
                  }`}>
                    {data.isOnline ? "Online (On Shift)" : "Offline"}
                  </span>
                </div>
              </div>

              {data.shiftAnalytics?.lastCancellationDate && (
                <p className="text-[10px] text-gray-400 font-medium italic pt-1">
                  Last cancellation logged: {new Date(data.shiftAnalytics.lastCancellationDate).toLocaleString()}
                </p>
              )}
            </div>
          </AnimatedCard>

          <AnimatedCard title="Bank Details" icon={<Landmark size={18} />}>
            <InfoRow label="Account Holder" value={data.bank?.accountHolderName} />
            <InfoRow label="IFSC Code" value={data.bank?.ifsc} />
            <InfoRow label="UPI ID" value={data.bank?.upi || "—"} />
          </AnimatedCard>

          {data.vendorStatus === "rejected" && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[32px] p-8 shadow-xl space-y-4 border border-red-200"
            >
              <div className="flex items-center gap-2 font-semibold text-red-600">
                <XCircle size={18} />
                Documents Rejected
              </div>
              <p className="text-sm text-gray-700 bg-red-50 p-4 rounded-2xl border border-red-100">
                <span className="font-semibold block text-red-900 mb-1">Reason:</span>
                {data.vendorRejectionReason || "Documents were rejected by admin."}
              </p>
            </motion.div>
          )}

          {data.vendorStatus === "pending" && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[32px] p-8 shadow-xl space-y-6"
            >
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck size={18} />
                Admin Decision
              </div>

              <p className="text-sm text-gray-500">
                Verify documents carefully before approving.
              </p>

              <div className="flex flex-col gap-4">
                <button
                  onClick={() => setShowApprove(true)}
                  className="py-3 rounded-2xl bg-gradient-to-r from-black to-gray-800 text-white font-semibold hover:opacity-90 transition"
                >
                  Approve Vendor
                </button>

                <button
                  onClick={() => setShowReject(true)}
                  className="py-3 rounded-2xl border font-semibold hover:bg-gray-100 transition"
                >
                  Reject Vendor
                </button>
              </div>
            </motion.div>
          )}

          {data.vendorStatus === "approved" && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[32px] p-8 shadow-xl space-y-6"
            >
              <div className="flex items-center gap-2 font-semibold">
                <Video size={18} />
                Video KYC Verification
              </div>

              {data.videoKycStatus === "approved" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 px-4 py-3 rounded-2xl text-sm font-semibold">
                    <CheckCircle size={18} />
                    Video KYC Approved
                  </div>
                  <p className="text-xs text-gray-500">
                    Vendor identity confirmed. Vendor is eligible to upload vehicle photo and submit fares.
                  </p>
                </div>
              ) : data.videoKycStatus === "in_progress" ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-700 bg-blue-50 border border-blue-200 px-4 py-3 rounded-2xl text-sm font-semibold">
                    <Clock size={18} />
                    Call Currently In Progress
                  </div>
                  <button
                    onClick={() => router.push(`/video-kyc/${data.videoKycRoomId}`)}
                    className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2 transition shadow-lg shadow-blue-500/20"
                  >
                    <Video size={16} /> Join Ongoing Call
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Documents are verified. Initiate live video verification call with this vendor.
                  </p>
                  {data.videoKycStatus === "rejected" && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                      <span className="font-bold">Last KYC Rejected:</span> {data.videoKycRejectionReason || "No reason given"}
                    </div>
                  )}
                  <button
                    onClick={async () => {
                      try {
                        setActionLoading(true);
                        const res = await axios.patch(`/api/admin/vendors/video-kyc/start/${id}`);
                        if (res.data?.roomId) {
                          router.push(`/video-kyc/${res.data.roomId}`);
                        }
                      } catch (err: any) {
                        alert(err?.response?.data?.message || "Failed to start Video KYC");
                      } finally {
                        setActionLoading(false);
                      }
                    }}
                    disabled={actionLoading}
                    className="w-full py-3 rounded-2xl bg-black hover:bg-zinc-800 text-white font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <Video size={16} />}
                    Start Video KYC
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>

      {/* APPROVE MODAL */}
      <ConfirmModal
        open={showApprove}
        title="Approve Vendor?"
        description="Confirm all information has been verified."
        confirmText="Yes, Approve"
        loading={actionLoading}
        onClose={() => setShowApprove(false)}
        onConfirm={approveVendor}
      />

      {/* REJECT MODAL */}
      <RejectModal
        open={showReject}
        reason={rejectReason}
        setReason={setRejectReason}
        loading={actionLoading}
        onClose={() => setShowReject(false)}
        onConfirm={rejectVendor}
      />
    </div>
  );
}

/* ================= REUSABLE UI ================= */

function AnimatedCard({ title, icon, children }: any) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-2xl sm:rounded-[32px] p-4 sm:p-8 shadow-md sm:shadow-xl space-y-4 sm:space-y-6 border border-gray-100/80"
    >
      <div className="flex items-center gap-2 font-semibold text-sm sm:text-base">
        {icon}
        {title}
      </div>
      {children}
    </motion.div>
  );
}

function DocPreview({ label, url }: any) {
  const isImage = url?.match(/\.(jpg|jpeg|png|webp)$/i);
  const isPdf = url?.endsWith(".pdf");

  return (
    <div className="bg-gray-50 rounded-xl sm:rounded-2xl border overflow-hidden shadow-sm">
      <div className="px-3.5 py-2 border-b text-xs sm:text-sm font-semibold truncate">
        {label}
      </div>

      <div className="h-44 sm:h-52 flex items-center justify-center bg-white overflow-hidden">
        {!url && <span className="text-xs text-gray-400">Not uploaded</span>}

        {isImage && (
          <img src={url} alt={label} className="w-full h-full object-cover" />
        )}

        {isPdf && <iframe src={url} title={label} className="w-full h-full" />}
      </div>

      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-xs py-2 font-medium hover:bg-gray-100 text-blue-600 transition"
        >
          Open full document
        </a>
      )}
    </div>
  );
}

function ConfirmModal({ open, title, description, confirmText, loading, onClose, onConfirm }: any) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 w-full max-w-sm shadow-2xl"
          >
            <h2 className="text-base sm:text-lg font-bold">{title}</h2>
            <div className="text-xs sm:text-sm text-gray-500 mt-2">{description}</div>

            <div className="flex gap-2.5 sm:gap-3 mt-5 sm:mt-6">
              <button
                onClick={onClose}
                className="flex-1 py-2 sm:py-2.5 rounded-xl border text-xs sm:text-sm font-semibold hover:bg-gray-50 active:scale-95 transition"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 py-2 sm:py-2.5 rounded-xl bg-black text-white text-xs sm:text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50 active:scale-95 transition"
              >
                {loading ? "Processing..." : confirmText}
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
    <ConfirmModal
      open={open}
      title="Reject Vendor"
      description={
        <textarea
          placeholder="Enter rejection reason (required)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full mt-3 border rounded-xl p-2.5 text-xs sm:text-sm focus:outline-none focus:border-black"
          rows={3}
        />
      }
      confirmText="Reject"
      loading={loading}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}

function InfoRow({ label, value }: any) {
  return (
    <div className="flex justify-between items-center text-xs sm:text-sm gap-2">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="font-semibold text-right truncate">{value || "—"}</span>
    </div>
  );
}

function StatusBadge({ status }: any) {
  if (status === "approved")
    return <Badge text="Approved" icon={<CheckCircle size={13} className="sm:w-3.5 sm:h-3.5" />} className="bg-green-100 text-green-700" />;
  if (status === "rejected")
    return <Badge text="Rejected" icon={<XCircle size={13} className="sm:w-3.5 sm:h-3.5" />} className="bg-red-100 text-red-700" />;
  return <Badge text="Pending" icon={<Clock size={13} className="sm:w-3.5 sm:h-3.5" />} className="bg-yellow-100 text-yellow-700" />;
}

function Badge({ text, icon, className }: any) {
  return (
    <span className={`px-2.5 py-1 sm:px-4 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 ${className}`}>
      {icon}
      {text}
    </span>
  );
}
