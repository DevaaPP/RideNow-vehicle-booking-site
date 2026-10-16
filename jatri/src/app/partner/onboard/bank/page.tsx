"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
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
          setAccount(bank.accountNumber || "");
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
    <div className="min-h-screen bg-zinc-50 sm:bg-zinc-100/60 flex flex-col justify-center px-3 sm:px-6 py-8 sm:py-16 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-xl mx-auto bg-white rounded-none border border-zinc-300 p-6 sm:p-10"
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
              Step 03 / 03
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold mt-4 tracking-tight text-zinc-950 font-sans">
            Bank &amp; Automated Payout Setup
          </h1>

          <p className="text-xs sm:text-sm text-zinc-500 mt-1 leading-relaxed">
            Registered commercial account for immediate daily ride revenue disbursements.
          </p>

          {completed && !editMode && (
            <div className="mt-4 p-3 bg-zinc-50 border border-zinc-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-900 text-xs font-semibold">
                <CheckCircle size={15} className="text-zinc-900" />
                <span>Bank account details recorded</span>
              </div>

              <button
                onClick={() => setEditMode(true)}
                className="text-xs font-mono font-semibold text-zinc-900 underline flex items-center gap-1 hover:text-black uppercase tracking-wider"
              >
                <Pencil size={12} />
                Edit Account
              </button>
            </div>
          )}
        </div>

        {/* ================= FORM ================= */}
        <div
          className={`space-y-4 ${
            completed && !editMode ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <InputFieldMinimal
            label="Account Holder Name *"
            placeholder="Name exactly as printed on bank account"
            icon={<BadgeCheck size={16} />}
            value={name}
            onChange={setName}
            error={!isNameValid && name.length > 0}
            errorText="Minimum 3 characters required"
          />

          <InputFieldMinimal
            label="Bank Account Number *"
            placeholder="e.g. 012345678901"
            icon={<CreditCard size={16} />}
            value={account}
            onChange={(v) =>
              setAccount(v.replace(/\D/g, ""))
            }
            error={!isAccountValid && account.length > 0}
            errorText="Bank account number must be at least 9 numeric digits"
          />

          <InputFieldMinimal
            label="IFSC Code *"
            placeholder="e.g. HDFC0001234"
            icon={<Landmark size={16} />}
            value={ifsc}
            onChange={(v) =>
              setIfsc(v.replace(/\s/g, "").toUpperCase())
            }
            maxLength={11}
            error={ifsc.length === 11 && !isIfscValid}
            errorText="Invalid IFSC format (4 alphabetic characters + 0 + 6 alphanumeric digits)"
          />

          <InputFieldMinimal
            label="Bank Registered Mobile Number *"
            placeholder="10-digit registered number"
            icon={<Phone size={16} />}
            value={mobileNumber}
            onChange={(v) => setMobileNumber(v.replace(/\D/g, "").slice(0, 10))}
            maxLength={10}
            error={mobileNumber.length === 10 && !isMobileValid}
            errorText="Enter a valid 10-digit mobile number"
          />

          <InputFieldMinimal
            label="Direct UPI ID (Optional)"
            placeholder="driver@okaxis / driver@paytm"
            value={upi}
            onChange={setUpi}
            optional
          />
        </div>

        {/* ================= WHY DISABLED ================= */}
        {!canSubmit && editMode && (
          <div className="mt-4 text-xs font-mono text-zinc-950 bg-zinc-50 p-3 rounded-none border border-zinc-300 space-y-1">
            <p className="font-bold uppercase tracking-wider">
              Required Fields Missing:
            </p>
            {!isNameValid && <p>• Valid account holder name</p>}
            {!isAccountValid && <p>• Valid numeric bank account number</p>}
            {!isIfscValid && <p>• Standard 11-character IFSC code</p>}
            {!isMobileValid && <p>• 10-digit verified mobile number</p>}
          </div>
        )}

        {/* ================= INFO ================= */}
        <div className="mt-5 flex items-start gap-2.5 text-xs text-zinc-500 bg-zinc-50 p-3.5 rounded-none border border-zinc-200">
          <CheckCircle size={15} className="mt-0.5 shrink-0 text-zinc-900" />
          <p className="leading-relaxed">
            Direct IMPS/NEFT bank settlement verifies automatically upon first completed dispatch ride. Zero commission deductions on partner payout.
          </p>
        </div>

        {/* ================= ERROR ================= */}
        {error && (
          <div className="mt-4 p-3 rounded-none bg-zinc-50 border border-zinc-300 text-xs text-red-600 font-mono">
            {error}
          </div>
        )}

        {/* ================= CTA ================= */}
        <motion.button
          whileTap={{ scale: 0.99 }}
          disabled={!canSubmit || loading}
          onClick={handleSubmit}
          className="mt-8 w-full h-12 sm:h-13 rounded-none bg-zinc-950 hover:bg-black text-white font-medium text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 border border-zinc-950 transition-colors disabled:opacity-50"
        >
          <span>
            {completed && !editMode
              ? "Access Partner Dashboard"
              : loading
              ? "Validating Account..."
              : "Submit & Access Dashboard"}
          </span>
          <ArrowRight size={16} />
        </motion.button>
      </motion.div>
    </div>
  );
}

/* ================= MINIMALIST INPUT FIELD ================= */

function InputFieldMinimal({
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
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[11px] font-mono uppercase tracking-wider font-semibold text-zinc-600">
          {label}
        </label>
        {optional && (
          <span className="text-[10px] font-mono text-zinc-400">
            Optional
          </span>
        )}
      </div>

      <div className="flex items-center rounded-none border border-zinc-300 bg-white focus-within:border-zinc-950 transition-colors">
        {icon && (
          <div className="pl-3 pr-2 text-zinc-400 shrink-0">
            {icon}
          </div>
        )}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full h-10 px-2.5 text-xs sm:text-sm bg-transparent focus:outline-none font-mono placeholder:text-zinc-400"
        />
      </div>

      {error && errorText && (
        <p className="mt-1 text-[11px] font-mono text-red-600">
          {errorText}
        </p>
      )}
    </div>
  );
}