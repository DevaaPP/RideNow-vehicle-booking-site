"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  UploadCloud,
  CheckCircle,
  Pencil,
  ShieldCheck,
  AlertCircle,
  Car,
  UserCheck,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import axios from "axios";

/* ================= TYPES ================= */

type DocKey = "profilePicture" | "aadhaar" | "license" | "rc" | "insurance" | "puc" | "fitness";

/* ================= PAGE ================= */

export default function PartnerDocumentsPage() {
  const router = useRouter();
  const profilePicInputRef = useRef<HTMLInputElement>(null);

  const [docs, setDocs] = useState<Record<DocKey, File | null>>({
    profilePicture: null,
    aadhaar: null,
    license: null,
    rc: null,
    insurance: null,
    puc: null,
    fitness: null,
  });

  const [profilePreview, setProfilePreview] = useState<string | null>(null);

  const [metadata, setMetadata] = useState({
    licenseNumber: "",
    rcNumber: "",
    insurancePolicyNumber: "",
    insuranceExpiry: "",
  });

  const [completed, setCompleted] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [existingSummary, setExistingSummary] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* DigiLocker Instant KYC State */
  const [digiLockerLoading, setDigiLockerLoading] = useState(false);
  const [digiLockerSuccess, setDigiLockerSuccess] = useState(false);
  const [aadhaarLast4Input, setAadhaarLast4Input] = useState("");

  const handleDigiLockerVerify = async () => {
    try {
      setDigiLockerLoading(true);
      setError(null);
      const res = await axios.post("/api/partner/documents/digilocker", {
        dlNumber: metadata.licenseNumber || undefined,
        aadhaarLast4: aadhaarLast4Input || "8821",
      });
      if (res.data?.success) {
        setDigiLockerSuccess(true);
        setExistingSummary((prev: any) => ({
          ...prev,
          isDigiLockerVerified: true,
          digiLockerDlRef: res.data.documents?.digiLockerDlRef,
          digiLockerAadhaarRef: res.data.documents?.digiLockerAadhaarRef,
          licenseNumber: res.data.documents?.licenseNumber,
          licenseStatus: "verified",
          panStatus: "verified",
        }));
        if (res.data.documents?.licenseNumber) {
          setMetadata((prev) => ({
            ...prev,
            licenseNumber: res.data.documents.licenseNumber,
          }));
        }
      } else {
        setError(res.data?.message || "DigiLocker verification failed.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "DigiLocker gateway connection error.");
    } finally {
      setDigiLockerLoading(false);
    }
  };

  /* ================= FETCH EXISTING DOCS ================= */

  useEffect(() => {
    axios
      .get("/api/partner/documents")
      .then((res) => {
        if (res.data?.documents || res.data?.profilePicture) {
          setCompleted(true);
          const docsData = res.data.documents || {};
          const profPic = res.data.profilePicture || docsData.profilePictureUrl;
          if (profPic) {
            setProfilePreview(profPic);
          }
          setExistingSummary({
            ...docsData,
            profilePictureUrl: profPic,
          });

          if (docsData.licenseNumber) {
            setMetadata((prev) => ({
              ...prev,
              licenseNumber: docsData.licenseNumber || "",
              rcNumber: docsData.rcNumber || "",
              insurancePolicyNumber: docsData.insurancePolicyNumber || "",
              insuranceExpiry: docsData.insuranceExpiry
                ? new Date(docsData.insuranceExpiry).toISOString().split("T")[0]
                : "",
            }));
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleFileChange = (key: DocKey, file: File | null) => {
    if (!file) return;
    setDocs((prev) => ({ ...prev, [key]: file }));
    if (key === "profilePicture") {
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  /* ================= SUBMIT ================= */

  const submitDocuments = async () => {
    if (completed && !editMode) {
      router.push("/partner/onboard/bank");
      return;
    }

    // Mandatory Profile Picture Check
    const hasProfilePic = Boolean(docs.profilePicture || existingSummary?.profilePictureUrl);
    if (!hasProfilePic) {
      setError("Mandatory driver profile picture is required. Please upload a clear photo of yourself.");
      return;
    }

    // Required files: DL, RC, Insurance
    if (!docs.license || !docs.rc || !docs.insurance) {
      if (!existingSummary?.licenseUrl || !existingSummary?.rcUrl || !existingSummary?.insuranceUrl) {
        setError("Please upload Driving License, Vehicle RC, and Vehicle Commercial Insurance.");
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      if (docs.profilePicture) formData.append("profilePicture", docs.profilePicture);
      if (docs.aadhaar) formData.append("aadhaar", docs.aadhaar);
      if (docs.license) formData.append("license", docs.license);
      if (docs.rc) formData.append("rc", docs.rc);
      if (docs.insurance) formData.append("insurance", docs.insurance);
      if (docs.puc) formData.append("puc", docs.puc);
      if (docs.fitness) formData.append("fitness", docs.fitness);

      if (metadata.licenseNumber) formData.append("licenseNumber", metadata.licenseNumber);
      if (metadata.rcNumber) formData.append("rcNumber", metadata.rcNumber);
      if (metadata.insurancePolicyNumber) formData.append("insurancePolicyNumber", metadata.insurancePolicyNumber);
      if (metadata.insuranceExpiry) formData.append("insuranceExpiry", metadata.insuranceExpiry);

      await axios.post("/api/partner/documents", formData);

      router.push("/partner/onboard/bank");
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Document upload failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 sm:bg-zinc-100/60 flex flex-col justify-center px-3 sm:px-6 py-8 sm:py-16 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-2xl mx-auto bg-white rounded-none border border-zinc-300 p-6 sm:p-10"
      >
        {/* ================= HEADER ================= */}
        <div className="relative border-b border-zinc-200 pb-6 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              className="w-8 h-8 rounded-none border border-zinc-300 flex items-center justify-center hover:bg-zinc-100 transition-colors"
            >
              <ArrowLeft size={16} />
            </button>

            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-zinc-500">
              Step 02 / 03
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold mt-4 tracking-tight text-zinc-950 font-sans">
            Driver &amp; Vehicle Verification
          </h1>

          <p className="text-xs sm:text-sm text-zinc-500 mt-1 leading-relaxed">
            Mandatory identity compliance under Motor Vehicle Aggregator Guidelines, 2025.
          </p>

          {completed && !editMode && (
            <div className="mt-4 p-3 bg-zinc-50 border border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-900 text-xs font-semibold">
                <CheckCircle size={15} className="text-zinc-900" />
                <span>Verification documents on file</span>
              </div>

              <button
                onClick={() => setEditMode(true)}
                className="text-xs font-mono font-semibold text-zinc-900 underline flex items-center gap-1 hover:text-black uppercase tracking-wider"
              >
                <Pencil size={12} />
                Update Documents
              </button>
            </div>
          )}
        </div>

        {/* ================= SECTION 0: MANDATORY PROFILE PICTURE ================= */}
        <div className={`mb-6 p-4 border border-zinc-300 bg-zinc-50/50 ${completed && !editMode ? "opacity-60 pointer-events-none" : ""}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-zinc-950 text-white flex items-center justify-center font-mono text-[10px] font-bold">
                01
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-zinc-950 tracking-tight uppercase">
                Mandatory Driver Profile Photo *
              </h2>
            </div>
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 border border-zinc-950 bg-zinc-950 text-white">
              Strictly Required
            </span>
          </div>

          <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
            Must be a clear, front-facing photograph taken in good lighting. Sunglass or face-mask photos will be rejected during automatic validation.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* PHOTO PREVIEW BOX */}
            <div className="w-28 h-32 sm:w-32 sm:h-36 rounded-none border border-zinc-300 bg-white flex flex-col items-center justify-center relative overflow-hidden shrink-0">
              {profilePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profilePreview}
                  alt="Driver Profile Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-400 p-2 text-center">
                  <Camera size={26} className="mb-1 text-zinc-400" />
                  <span className="text-[10px] font-mono uppercase tracking-wider">No Photo</span>
                </div>
              )}
            </div>

            {/* UPLOAD CONTROLS */}
            <div className="flex-1 w-full space-y-2">
              <input
                ref={profilePicInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={(e) => handleFileChange("profilePicture", e.target.files?.[0] || null)}
              />

              <button
                type="button"
                onClick={() => profilePicInputRef.current?.click()}
                className="w-full h-10 rounded-none bg-zinc-950 hover:bg-black text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-zinc-950 transition-colors"
              >
                <Camera size={14} />
                <span>{profilePreview ? "Change Profile Photo" : "Take / Upload Profile Photo"}</span>
              </button>

              <p className="text-[10px] font-mono text-zinc-500">
                Supports JPG, PNG or WEBP · Maximum 5MB · Clear headshot
              </p>

              {profilePreview && (
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-900 font-medium">
                  <CheckCircle size={13} className="text-zinc-900" />
                  <span>Photo selected and staged for encryption</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= DIGILOCKER INSTANT VERIFICATION CARD ================= */}
        <div className="mb-6 p-4 rounded-none bg-zinc-50 border border-zinc-300 space-y-3">
          <div className="flex items-start sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-950 uppercase tracking-tight">
                  DigiLocker National Identity Gateway
                </span>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider bg-zinc-200 text-zinc-900 px-1.5 py-0.5">
                  Fast Track
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Instant digital authentication for Aadhaar &amp; Driving Licence credentials.
              </p>
            </div>

            {(existingSummary?.isDigiLockerVerified || digiLockerSuccess) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-950 text-white text-[10px] font-mono font-bold uppercase tracking-wider shrink-0">
                <CheckCircle size={11} />
                Verified
              </span>
            )}
          </div>

          {existingSummary?.isDigiLockerVerified || digiLockerSuccess ? (
            <div className="p-3 bg-white border border-zinc-200 text-xs text-zinc-900 flex items-center justify-between">
              <div>
                <p className="font-semibold text-xs text-zinc-950">Govt DigiLocker Verified</p>
                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                  Ref: {existingSummary?.digiLockerDlRef || "DL-VERIFIED"} • {existingSummary?.digiLockerAadhaarRef || "AADHAAR-MKYC"}
                </p>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase">Verified</span>
            </div>
          ) : (
            <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                placeholder="Aadhaar Last 4 digits (e.g. 8821)"
                maxLength={4}
                value={aadhaarLast4Input}
                onChange={(e) => setAadhaarLast4Input(e.target.value.replace(/\D/g, ""))}
                className="h-9 px-3 text-xs rounded-none border border-zinc-300 bg-white font-mono placeholder:text-zinc-400 focus:outline-none focus:border-zinc-950 sm:w-56"
              />
              <button
                type="button"
                disabled={digiLockerLoading}
                onClick={handleDigiLockerVerify}
                className="h-9 px-4 rounded-none bg-zinc-950 hover:bg-black disabled:opacity-50 text-white font-medium text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
              >
                {digiLockerLoading ? "Verifying with Gateway..." : "Verify via DigiLocker"}
              </button>
            </div>
          )}
        </div>

        {/* ================= SECTION 1: DRIVER IDENTITY ================= */}
        <div className={`space-y-4 ${completed && !editMode ? "opacity-60 pointer-events-none" : ""}`}>
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-200">
            <div className="w-5 h-5 bg-zinc-950 text-white flex items-center justify-center font-mono text-[10px] font-bold">
              02
            </div>
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-950 font-sans">
              Driver Identification Proof
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DocUploadMinimal
              label="Driving Licence (DL) *"
              desc="Front & rear scan"
              file={docs.license}
              existing={existingSummary?.licenseUrl}
              onChange={(f) => handleFileChange("license", f)}
            />

            <DocUploadMinimal
              label="Aadhaar / Identity Proof *"
              desc="Government identity card"
              file={docs.aadhaar}
              existing={existingSummary?.aadhaarUrl}
              onChange={(f) => handleFileChange("aadhaar", f)}
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider font-semibold text-zinc-600 mb-1">
              Driving Licence Number
            </label>
            <input
              type="text"
              placeholder="e.g. AS01 20210012345"
              value={metadata.licenseNumber}
              onChange={(e) => setMetadata({ ...metadata, licenseNumber: e.target.value.toUpperCase() })}
              className="w-full h-10 px-3 text-xs sm:text-sm rounded-none border border-zinc-300 focus:outline-none focus:border-zinc-950 uppercase font-mono bg-white"
            />
          </div>

          {/* ================= SECTION 2: VEHICLE COMPLIANCE ================= */}
          <div className="flex items-center gap-2 pt-4 pb-2 border-b border-zinc-200">
            <div className="w-5 h-5 bg-zinc-950 text-white flex items-center justify-center font-mono text-[10px] font-bold">
              03
            </div>
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-950 font-sans">
              Vehicle Statutory Documentation
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <DocUploadMinimal
              label="Registration Certificate (RC) *"
              desc="Vehicle RC document"
              file={docs.rc}
              existing={existingSummary?.rcUrl}
              onChange={(f) => handleFileChange("rc", f)}
            />

            <DocUploadMinimal
              label="Commercial Insurance *"
              desc="Active policy certificate"
              file={docs.insurance}
              existing={existingSummary?.insuranceUrl}
              onChange={(f) => handleFileChange("insurance", f)}
            />

            <DocUploadMinimal
              label="PUC Certificate"
              desc="Pollution under control"
              file={docs.puc}
              existing={existingSummary?.pucUrl}
              onChange={(f) => handleFileChange("puc", f)}
            />

            <DocUploadMinimal
              label="Fitness / Permit"
              desc="Commercial permit document"
              file={docs.fitness}
              existing={existingSummary?.fitnessUrl}
              onChange={(f) => handleFileChange("fitness", f)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider font-semibold text-zinc-600 mb-1">
                Vehicle Registration Number (RC)
              </label>
              <input
                type="text"
                placeholder="e.g. AS01AB1234"
                value={metadata.rcNumber}
                onChange={(e) => setMetadata({ ...metadata, rcNumber: e.target.value.toUpperCase() })}
                className="w-full h-10 px-3 text-xs sm:text-sm rounded-none border border-zinc-300 focus:outline-none focus:border-zinc-950 uppercase font-mono bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider font-semibold text-zinc-600 mb-1">
                Insurance Expiry Date
              </label>
              <input
                type="date"
                value={metadata.insuranceExpiry}
                onChange={(e) => setMetadata({ ...metadata, insuranceExpiry: e.target.value })}
                className="w-full h-10 px-3 text-xs sm:text-sm rounded-none border border-zinc-300 focus:outline-none focus:border-zinc-950 bg-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* DPDP 2025 INFO */}
        <div className="mt-6 flex items-start gap-2.5 text-xs text-zinc-500 bg-zinc-50 p-3.5 rounded-none border border-zinc-200">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-zinc-900" />
          <p className="leading-relaxed">
            <strong className="text-zinc-950 font-semibold">DPDP Rules 2025 Compliance:</strong> All driver photographs and statutory credentials are encrypted (AES-256) and strictly maintained for safety dispatch verification.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mt-4 flex items-center gap-2 text-xs sm:text-sm text-red-600 bg-zinc-50 p-3 rounded-none border border-zinc-300 font-mono">
            <AlertCircle size={15} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* CTA */}
        <motion.button
          whileTap={{ scale: 0.99 }}
          disabled={loading}
          onClick={submitDocuments}
          className="mt-8 w-full h-12 sm:h-13 rounded-none bg-zinc-950 hover:bg-black text-white font-medium text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 border border-zinc-950 transition-colors disabled:opacity-50"
        >
          <span>
            {completed && !editMode
              ? "Continue to Step 3: Bank Setup"
              : editMode
              ? "Save Documents & Continue"
              : loading
              ? "Encrypting & Storing Documents..."
              : "Save Documents & Continue"}
          </span>
          <ArrowRight size={16} />
        </motion.button>
      </motion.div>
    </div>
  );
}

/* ================= MINIMALIST DOC UPLOAD COMPONENT ================= */

function DocUploadMinimal({
  label,
  desc,
  file,
  existing,
  onChange,
}: {
  label: string;
  desc: string;
  file: File | null;
  existing?: string;
  onChange: (f: File | null) => void;
}) {
  return (
    <label className="flex items-center justify-between p-3.5 rounded-none border border-zinc-200 cursor-pointer hover:border-zinc-950 transition-colors bg-white">
      <div className="min-w-0 pr-2">
        <p className="text-xs sm:text-sm font-semibold truncate text-zinc-950">
          {label}
        </p>
        <p className="text-[11px] text-zinc-500 truncate font-mono mt-0.5">
          {file ? file.name : existing ? "Document on file" : desc}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {file ? (
          <span className="text-[10px] text-zinc-950 font-mono font-bold bg-zinc-100 px-2 py-0.5 border border-zinc-300">
            Selected
          </span>
        ) : existing ? (
          <span className="text-[10px] text-zinc-950 font-mono font-bold bg-zinc-100 px-2 py-0.5 border border-zinc-300">
            Uploaded
          </span>
        ) : (
          <span className="text-[10px] text-zinc-400 font-mono">
            Browse
          </span>
        )}

        <div className="w-7 h-7 rounded-none bg-zinc-950 text-white flex items-center justify-center">
          <UploadCloud size={14} />
        </div>
      </div>

      <input
        type="file"
        accept="image/*,.pdf"
        hidden
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
    </label>
  );
}
