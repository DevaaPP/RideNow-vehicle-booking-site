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
    <div className="min-h-screen bg-[#FAF7F0] dark:bg-[#061A16] flex flex-col justify-center px-3 sm:px-6 py-8 sm:py-16 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-xl mx-auto bg-[#FAF7F0] dark:bg-[#0B2822] rounded-[16px] border border-[#DED7CA] dark:border-[#1E3E34] p-6 sm:p-10 shadow-sm"
      >
        {/* ================= HEADER ================= */}
        <div className="relative border-b border-[#DED7CA]/70 dark:border-[#1E3E34] pb-6 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              className="w-8 h-8 rounded-[8px] border border-[#DED7CA] dark:border-[#1E3E34] bg-white dark:bg-[#10352C] flex items-center justify-center hover:bg-[#FAF7F0] dark:hover:bg-[#143D32] text-[#10251C] dark:text-[#F7F5ED] transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>

            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#696B64] dark:text-[#B9C8BF]">
              Step 03 / 03
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-serif font-bold mt-4 tracking-tight text-[#10251C] dark:text-[#F7F5ED]">
            Bank &amp; Automated Payout Setup
          </h1>

          <p className="text-xs sm:text-sm text-[#696B64] dark:text-[#B9C8BF] mt-1 leading-relaxed">
            Registered commercial account for immediate daily ride revenue disbursements.
          </p>

          {completed && !editMode && (
            <div className="mt-4 p-3 bg-white dark:bg-[#061A16] border border-[#DED7CA] dark:border-[#1E3E34] rounded-[8px] flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2 text-[#10251C] dark:text-[#F7F5ED] text-xs font-semibold">
                <CheckCircle size={15} className="text-[#123D32] dark:text-[#347858]" />
                <span>Bank account details recorded</span>
              </div>

              <button
                onClick={() => setEditMode(true)}
                className="text-xs font-mono font-bold text-[#123D32] dark:text-[#347858] underline flex items-center gap-1 hover:text-[#0D3027] dark:hover:text-[#28664D] uppercase tracking-wider cursor-pointer"
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
          <div className="mt-4 text-xs font-mono text-[#10251C] dark:text-[#F7F5ED] bg-white dark:bg-[#061A16] p-3 rounded-[8px] border border-[#DED7CA] dark:border-[#1E3E34] space-y-1">
            <p className="font-bold uppercase tracking-wider text-[#E34222] dark:text-[#E06A50]">
              Required Fields Missing:
            </p>
            {!isNameValid && <p>• Valid account holder name</p>}
            {!isAccountValid && <p>• Valid numeric bank account number</p>}
            {!isIfscValid && <p>• Standard 11-character IFSC code</p>}
            {!isMobileValid && <p>• 10-digit verified mobile number</p>}
          </div>
        )}

        {/* ================= INFO ================= */}
        <div className="mt-5 flex items-start gap-2.5 text-xs text-[#696B64] dark:text-[#B9C8BF] bg-white dark:bg-[#061A16] p-3.5 rounded-[8px] border border-[#DED7CA] dark:border-[#1E3E34] shadow-xs">
          <CheckCircle size={15} className="mt-0.5 shrink-0 text-[#123D32] dark:text-[#347858]" />
          <p className="leading-relaxed">
            Direct IMPS/NEFT bank settlement verifies automatically upon first completed dispatch ride. Zero commission deductions on partner payout.
          </p>
        </div>

        {/* ================= ERROR ================= */}
        {error && (
          <div className="mt-4 p-3 rounded-[8px] bg-[#E34222]/10 dark:bg-red-950/30 border border-[#E34222] dark:border-red-900/50 text-xs text-[#E34222] dark:text-[#E06A50] font-mono">
            {error}
          </div>
        )}

        {/* ================= CTA ================= */}
        <motion.button
          whileTap={{ scale: 0.99 }}
          disabled={!canSubmit || loading}
          onClick={handleSubmit}
          className="mt-8 w-full h-12 sm:h-13 rounded-[8px] bg-[#123D32] dark:bg-[#28664D] hover:bg-[#0D3027] dark:hover:bg-[#347858] text-white font-bold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
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
        <label className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#696B64] dark:text-[#B9C8BF]">
          {label}
        </label>
        {optional && (
          <span className="text-[10px] font-mono text-[#696B64]/70 dark:text-[#B9C8BF]/70">
            Optional
          </span>
        )}
      </div>

      <div className="flex items-center rounded-[8px] border border-[#DED7CA] dark:border-[#1E3E34] bg-white dark:bg-[#061A16] focus-within:border-[#123D32] dark:focus-within:border-[#28664D] transition-colors">
        {icon && (
          <div className="pl-3 pr-2 text-[#696B64] dark:text-[#B9C8BF] shrink-0">
            {icon}
          </div>
        )}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="w-full h-10 px-2.5 text-xs sm:text-sm bg-transparent focus:outline-none font-mono placeholder:text-[#696B64]/60 dark:placeholder:text-[#B9C8BF]/60 text-[#10251C] dark:text-[#F7F5ED]"
        />
      </div>

      {error && errorText && (
        <p className="mt-1 text-[11px] font-mono text-[#E34222] dark:text-[#E06A50]">
          {errorText}
        </p>
      )}
    </div>
  );
}