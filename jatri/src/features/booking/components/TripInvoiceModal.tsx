"use client";

import React, { useRef } from "react";
import { X, Printer, Download, CheckCircle2, ShieldCheck, Car } from "lucide-react";
import { motion } from "framer-motion";
import { BookingDetailsData } from "./TripDetailsModal";

interface TripInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingDetailsData | null;
}

export default function TripInvoiceModal({
  isOpen,
  onClose,
  booking,
}: TripInvoiceModalProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !booking) return null;

  const invoiceNumber = `RN-INV-2026-${booking._id.slice(-6).toUpperCase()}`;
  const invoiceDate = booking.createdAt
    ? new Date(booking.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-IN");

  const grossFare = booking.fare || 0;
  // Passenger transport GST is 5% (inclusive in gross fare or added)
  // Taxable value = gross / 1.05
  const taxableValue = grossFare > 0 ? grossFare / 1.05 : 0;
  const totalGst = grossFare - taxableValue;
  const cgst = totalGst / 2;
  const sgst = totalGst / 2;

  const driverName = booking.driver?.name || "RideNow Partner";
  const vehicleModel = booking.vehicle?.vehicleModel || "Economy Vehicle";
  const vehicleNumber = booking.vehicle?.number || "AS-01-COMMERCIAL";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl bg-white rounded-[14px] shadow-2xl border border-[#DED7CA] dark:border-[#24483D] overflow-hidden flex flex-col my-auto max-h-[95vh]"
      >
        {/* Modal Controls Bar (Hidden during Print) */}
        <div className="print:hidden bg-[#123D32] dark:bg-[#061A16] border-b border-[#0D3027] dark:border-[#24483D] px-4 py-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#A3E635]" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider font-mono">
              Tax Invoice Preview • {invoiceNumber}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-white hover:bg-[#F7F1E5] text-[#123D32] px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-[8px] flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Printer size={13} />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 sm:w-8 sm:h-8 rounded-[8px] bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div
          ref={invoiceRef}
          className="p-6 sm:p-8 bg-white overflow-y-auto font-sans text-zinc-900 printable-invoice select-text"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-zinc-900 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight font-sans">
                  RideNow
                </span>
                <span className="bg-zinc-950 text-white text-[9px] font-black uppercase px-1.5 py-0.5">
                  Mobility
                </span>
              </div>
              <p className="text-[11px] text-zinc-600 font-medium mt-1 leading-relaxed">
                RideNow Mobility Technologies Pvt. Ltd.<br />
                G.S. Road, Christian Basti, Guwahati, Assam 781005<br />
                GSTIN: <span className="font-mono font-bold text-zinc-900">18AABCR1234F1Z5</span> | State: Assam (18)<br />
                CIN: U63090AS2026PTC021980
              </p>
            </div>

            <div className="sm:text-right">
              <span className="inline-block bg-zinc-100 border border-zinc-900 px-3 py-1 text-xs font-black uppercase tracking-wider text-zinc-950">
                TAX INVOICE
              </span>
              <p className="text-xs font-mono font-bold mt-2 text-zinc-900">
                Invoice No: {invoiceNumber}
              </p>
              <p className="text-xs text-zinc-600 mt-0.5">
                Date: {invoiceDate}
              </p>
              <p className="text-xs text-zinc-600">
                SAC Code: <span className="font-mono font-bold text-zinc-900">996412</span>
              </p>
            </div>
          </div>

          {/* Customer & Service Provider Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-zinc-300 text-xs">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">
                Billed To (Passenger)
              </p>
              <p className="font-bold text-zinc-900 text-sm">
                Registered RideNow Rider
              </p>
              <p className="text-zinc-600 mt-0.5">
                Place of Supply: Guwahati, Assam (18)
              </p>
              <p className="text-zinc-600">
                Booking ID: <span className="font-mono font-semibold">{booking._id}</span>
              </p>
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500 mb-1">
                Transport Service Provider
              </p>
              <p className="font-bold text-zinc-900 text-sm">
                {driverName}
              </p>
              <p className="text-zinc-600 mt-0.5">
                Vehicle: {vehicleModel}
              </p>
              <p className="text-zinc-600">
                Registration No: <span className="font-mono font-semibold">{vehicleNumber}</span>
              </p>
            </div>
          </div>

          {/* Journey Waypoints */}
          <div className="py-4 border-b border-zinc-300 text-xs space-y-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
              Trip Route Waypoints
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-50 p-3 border border-zinc-200">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase">● Pickup Address</span>
                <p className="text-zinc-900 font-semibold mt-0.5 leading-snug">
                  {booking.pickupAddress}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-900 uppercase">■ Drop-off Address</span>
                <p className="text-zinc-900 font-semibold mt-0.5 leading-snug">
                  {booking.dropAddress}
                </p>
              </div>
            </div>
            {booking.routeDistanceKm && (
              <p className="text-[11px] text-zinc-600 font-mono">
                Authoritative Road Distance: <span className="font-bold text-zinc-900">{booking.routeDistanceKm.toFixed(1)} km</span>
              </p>
            )}
          </div>

          {/* Itemized Fare Table */}
          <div className="py-4">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b-2 border-zinc-900 text-[10px] uppercase tracking-wider text-zinc-600">
                  <th className="py-2">Description</th>
                  <th className="py-2 text-center">SAC</th>
                  <th className="py-2 text-right">Taxable Value</th>
                  <th className="py-2 text-right">GST Rate</th>
                  <th className="py-2 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                <tr>
                  <td className="py-2.5 font-semibold text-zinc-900">
                    Passenger Transport Service by Road
                  </td>
                  <td className="py-2.5 text-center font-mono text-zinc-600">996412</td>
                  <td className="py-2.5 text-right font-mono">₹{taxableValue.toFixed(2)}</td>
                  <td className="py-2.5 text-right font-mono">5.0%</td>
                  <td className="py-2.5 text-right font-mono font-bold">₹{taxableValue.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-zinc-600 pl-3">
                    • Central GST (CGST)
                  </td>
                  <td className="py-2 text-center font-mono text-zinc-500">996412</td>
                  <td className="py-2 text-right font-mono text-zinc-500">—</td>
                  <td className="py-2 text-right font-mono text-zinc-500">2.5%</td>
                  <td className="py-2 text-right font-mono text-zinc-700">₹{cgst.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-2 text-zinc-600 pl-3">
                    • State GST (SGST - Assam)
                  </td>
                  <td className="py-2 text-center font-mono text-zinc-500">996412</td>
                  <td className="py-2 text-right font-mono text-zinc-500">—</td>
                  <td className="py-2 text-right font-mono text-zinc-500">2.5%</td>
                  <td className="py-2 text-right font-mono text-zinc-700">₹{sgst.toFixed(2)}</td>
                </tr>
                {Boolean(booking.tipAmount) && (
                  <tr>
                    <td className="py-2 font-semibold text-emerald-800">
                      Driver Gratuity / Tip (100% Direct Payout)
                    </td>
                    <td className="py-2 text-center font-mono text-zinc-500">—</td>
                    <td className="py-2 text-right font-mono text-zinc-500">₹{booking.tipAmount}</td>
                    <td className="py-2 text-right font-mono text-zinc-500">Exempt</td>
                    <td className="py-2 text-right font-mono font-bold text-emerald-800">₹{booking.tipAmount}</td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-zinc-950 font-black text-sm">
                  <td colSpan={4} className="py-3 text-zinc-950 uppercase tracking-tight">
                    Total Invoice Value (Incl. Taxes)
                  </td>
                  <td className="py-3 text-right font-mono text-base text-zinc-950">
                    ₹{grossFare + (booking.tipAmount || 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment Status & Declaration */}
          <div className="pt-4 border-t border-zinc-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Payment Mode
              </p>
              <p className="font-black text-zinc-900 uppercase">
                {booking.paymentStatus === "paid" ? "Online Payment (Confirmed)" : "Cash on Trip Completion"}
              </p>
            </div>

            <div className="sm:text-right">
              <div className="inline-flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 border border-emerald-300 px-2.5 py-1">
                <CheckCircle2 size={13} />
                <span>GST E-Invoice Generated</span>
              </div>
            </div>
          </div>

          {/* Terms & Computer Generated Disclaimer */}
          <div className="mt-6 pt-4 border-t border-zinc-200 text-[10px] text-zinc-500 space-y-1">
            <p>
              1. Passenger transport service is subject to 5% GST under Notification No. 11/2017-Central Tax (Rate) as amended.
            </p>
            <p>
              2. This is a computer-generated tax invoice and does not require a physical signature.
            </p>
            <p>
              3. For queries or support, reach out to <span className="font-mono text-zinc-800">support@ridenow.in</span> quoting Invoice No. {invoiceNumber}.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
