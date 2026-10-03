"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  UploadCloud,
  FileCheck,
  CheckCircle,
  Pencil,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";

/* ================= TYPES ================= */

type DocKey = "aadhaar" | "license" | "rc";

/* ================= PAGE ================= */

export default function PartnerDocumentsPage() {
  const router = useRouter();

  const [docs, setDocs] = useState<Record<DocKey, File | null>>({
    aadhaar: null,
    license: null,
    rc: null,
  });

  const [completed, setCompleted] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ================= FETCH EXISTING DOCS ================= */

  useEffect(() => {
    axios
      .get("/api/partner/documents")
      .then((res) => {
        if (res.data?.documents) {
          setCompleted(true);
        }
      })
      .catch(() => {});
  }, []);

  const canContinue =
    completed && !editMode
      ? true
      : docs.aadhaar && docs.license && docs.rc;

  const handleFileChange = (key: DocKey, file: File | null) => {
    if (!file) return;
    setDocs((prev) => ({ ...prev, [key]: file }));
  };

  /* ================= SUBMIT ================= */

  const submitDocuments = async () => {
    if (completed && !editMode) {
      router.push("/partner/onboard/bank");
      return;
    }

    if (!docs.aadhaar || !docs.license || !docs.rc) {
      setError("Please upload all required documents");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("aadhaar", docs.aadhaar);
      formData.append("license", docs.license);
      formData.append("rc", docs.rc);

      await axios.post("/api/partner/documents", formData);

      router.push("/partner/onboard/bank");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Document upload failed"
      );
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
            Step 2 of 3
          </p>

          <h1 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">
            Upload Documents
          </h1>

          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Required for verification
          </p>

          {completed && !editMode && (
            <div className="mt-3 sm:mt-4 flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-1.5 text-green-600 text-xs sm:text-sm font-semibold">
                <CheckCircle size={15} />
                Uploaded successfully
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setEditMode(true)}
                className="text-xs font-semibold text-black underline flex items-center gap-1 py-1"
              >
                <Pencil size={12} />
                Edit documents
              </motion.button>
            </div>
          )}
        </div>

        {/* ================= DOCUMENT LIST ================= */}
        <div
          className={`mt-6 sm:mt-8 space-y-3.5 sm:space-y-4 ${
            completed && !editMode
              ? "opacity-50 pointer-events-none"
              : ""
          }`}
        >
          <DocUpload
            label="Aadhaar / ID Proof"
            desc="Government issued ID"
            file={docs.aadhaar}
            onChange={(f) =>
              handleFileChange("aadhaar", f)
            }
          />

          <DocUpload
            label="Driving License"
            desc="Valid driving license"
            file={docs.license}
            onChange={(f) =>
              handleFileChange("license", f)
            }
          />

          <DocUpload
            label="Vehicle RC"
            desc="Registration Certificate"
            file={docs.rc}
            onChange={(f) => handleFileChange("rc", f)}
          />
        </div>

        {/* INFO */}
        <div className="mt-5 flex items-start gap-2.5 text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
          <FileCheck size={16} className="mt-0.5 shrink-0 text-gray-700" />
          <p className="leading-relaxed">
            Documents are securely stored and manually verified by our team.
          </p>
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
          onClick={submitDocuments}
          className="mt-6 sm:mt-8 w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-black text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-40 transition shadow-lg active:scale-98"
        >
          {completed && !editMode
            ? "Continue"
            : editMode
            ? "Save & Continue"
            : loading
            ? "Uploading..."
            : "Continue"}
          <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px]" />
        </motion.button>
      </motion.div>
    </div>
  );
}

/* ================= DOC UPLOAD ================= */

function DocUpload({
  label,
  desc,
  file,
  onChange,
}: {
  label: string;
  desc: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  return (
    <label
      className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-200 cursor-pointer hover:border-black active:scale-[0.99] transition bg-white"
    >
      <div className="min-w-0 pr-2">
        <p className="text-xs sm:text-sm font-semibold truncate text-gray-900">
          {label}
        </p>
        <p className="text-[11px] sm:text-xs text-gray-500 truncate">
          {file ? file.name : desc}
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {file ? (
          <span className="text-[11px] sm:text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
            Selected
          </span>
        ) : (
          <span className="text-[11px] sm:text-xs text-gray-400 font-medium">
            Upload
          </span>
        )}

        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black text-white flex items-center justify-center shadow-sm">
          <UploadCloud size={16} className="sm:w-[18px] sm:h-[18px]" />
        </div>
      </div>

      <input
        type="file"
        accept="image/*,.pdf"
        hidden
        onChange={(e) =>
          onChange(e.target.files?.[0] || null)
        }
      />
    </label>
  );
}
