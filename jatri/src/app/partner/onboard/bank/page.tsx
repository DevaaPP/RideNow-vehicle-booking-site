"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle,
  Landmark,
  CreditCard,
  BadgeCheck,
  Pencil,
  Phone,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";

/* ================= VALIDATION ================= */

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export default function PartnerBankPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [account, setAccount] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [upi, setUpi] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  const [completed, setCompleted] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ================= FETCH EXISTING BANK ================= */

  useEffect(() => {
    axios
      .get("/api/partner/bank")
      .then((res) => {
        if (res.data?.bank) {
          const bank = res.data.bank;
          setName(bank.accountHolderName || "");
          setIfsc(bank.ifsc || "");
          setAccount(bank.accountNumber || "" )
          setUpi(bank.upi || "");
          setMobileNumber(bank.mobileNumber || "");
          setCompleted(true);
        }
      })
      .catch(() => {});
  }, []);

  /* ================= VALIDATION ================= */

  const sanitizedIfsc = ifsc.trim().toUpperCase();

  const isNameValid = name.trim().length >= 3;
  const isAccountValid = account.trim().length >= 9;
  const isIfscValid =
    sanitizedIfsc.length === 11 &&
    IFSC_REGEX.test(sanitizedIfsc);
  const isMobileValid = mobileNumber.trim().length === 10;

  const canSubmit =
    isNameValid && isAccountValid && isIfscValid && isMobileValid;

  /* ================= SUBMIT ================= */

  const handleSubmit = async () => {
    if (completed && !editMode) {
      router.push("/partners/dashboard");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await axios.post("/api/partner/bank", {
        name: name.trim(),
        account,
        ifsc: sanitizedIfsc,
        upi: upi.trim() || undefined,
        mobileNumber: mobileNumber.trim(),
      });

      router.push("/partners/dashboard");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to save bank details"
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
            Step 3 of 3
          </p>

          <h1 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">
            Bank & Payout Setup
          </h1>

          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Used for vendor payouts
          </p>

          {completed && !editMode && (
            <div className="mt-3 sm:mt-4 flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-1.5 text-green-600 text-xs sm:text-sm font-semibold">
                <CheckCircle size={15} />
                Bank details added
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setEditMode(true)}
                className="text-xs font-semibold underline flex items-center gap-1 py-1"
              >
                <Pencil size={12} />
                Edit details
              </motion.button>
            </div>
          )}
        </div>

        {/* ================= FORM ================= */}
        <div
          className={`mt-6 sm:mt-8 space-y-4 sm:space-y-5 ${
            completed && !editMode
              ? "opacity-50 pointer-events-none"
              : ""
          }`}
        >
          <InputField
            label="Account holder name"
            placeholder="As per bank records"
            icon={<BadgeCheck size={16} />}
            value={name}
            onChange={setName}
            error={!isNameValid && name.length > 0}
            errorText="Minimum 3 characters required"
          />

          <InputField
            label="Bank account number"
            placeholder="Enter account number"
            icon={<CreditCard size={16} />}
            value={account}
            onChange={(v) =>
              setAccount(v.replace(/\D/g, ""))
            }
            error={!isAccountValid && account.length > 0}
            errorText="Account number must be at least 9 digits"
          />

          <InputField
            label="IFSC code"
            placeholder="HDFC0001234"
            icon={<Landmark size={16} />}
            value={ifsc}
            onChange={(v) =>
              setIfsc(v.replace(/\s/g, "").toUpperCase())
            }
            maxLength={11}
            error={ifsc.length === 11 && !isIfscValid}
            errorText="Invalid IFSC code"
          />

          <InputField
            label="Mobile number"
            placeholder="10 digit mobile number"
            icon={<Phone size={16} />}
            value={mobileNumber}
            onChange={(v) => setMobileNumber(v.replace(/\D/g, "").slice(0, 10))}
            maxLength={10}
            error={mobileNumber.length === 10 && !isMobileValid}
            errorText="Enter a valid 10-digit mobile number"
          />

          <InputField
            label="UPI ID"
            placeholder="name@upi"
            value={upi}
            onChange={setUpi}
            optional
          />
        </div>

        {/* ================= WHY DISABLED ================= */}
        {!canSubmit && editMode && (
          <div className="mt-4 sm:mt-5 text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200/60 space-y-1">
            <p className="font-semibold">
              Complete the following to continue:
            </p>
            {!isNameValid && <p>• Valid account holder name</p>}
            {!isAccountValid && <p>• Valid bank account number</p>}
            {!isIfscValid && <p>• Correct IFSC code</p>}
            {!isMobileValid && <p>• Valid 10-digit mobile number</p>}
          </div>
        )}

        {/* ================= INFO ================= */}
        <div className="mt-5 flex items-start gap-2.5 text-xs text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
          <CheckCircle size={16} className="mt-0.5 shrink-0 text-gray-700" />
          <p className="leading-relaxed">
            Bank details are verified before first payout. This usually takes 24–48 hours.
          </p>
        </div>

        {/* ================= ERROR ================= */}
        {error && (
          <p className="mt-4 text-xs sm:text-sm text-red-500 bg-red-50 p-2.5 rounded-lg border border-red-100">
            {error}
          </p>
        )}

        {/* ================= CTA ================= */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          disabled={!canSubmit || loading}
          onClick={handleSubmit}
          className="mt-6 sm:mt-8 w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-black text-white font-semibold text-sm sm:text-base disabled:opacity-40 transition shadow-lg active:scale-98"
        >
          {completed && !editMode
            ? "Continue"
            : loading
            ? "Saving..."
            : "Save & Continue"}
        </motion.button>
      </motion.div>
    </div>
  );
}

/* ================= INPUT ================= */

function InputField({
  label,
  placeholder,
  value,
  onChange,
  icon,
  optional,
  maxLength,
  error,
  errorText,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
  optional?: boolean;
  maxLength?: number;
  error?: boolean;
  errorText?: string;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-500">
        {label}{" "}
        {optional && (
          <span className="text-gray-400 font-normal">
            (optional)
          </span>
        )}
      </label>

      <div className="flex items-center gap-2 mt-2">
        {icon && <div className="text-gray-400">{icon}</div>}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={`flex-1 border-b pb-2 text-sm focus:outline-none ${
            error
              ? "border-red-400 focus:border-red-500"
              : "border-gray-300 focus:border-black"
          }`}
        />
      </div>

      {error && errorText && (
        <p className="mt-1 text-xs text-red-500">
          {errorText}
        </p>
      )}
    </div>
  );
}