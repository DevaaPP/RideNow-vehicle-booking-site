"use client";



import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  IndianRupee,
  Loader2,
  Car,
  Bike,
  Truck,
  Calendar,
  ChevronRight,
  MapPin,
  User,
  Phone,
  FileText,
} from "lucide-react";
import { RideCardSkeleton } from "@/shared/components/skeletons/RideCardSkeleton";
import TripDetailsModal from "@/features/booking/components/TripDetailsModal";
import TripInvoiceModal from "@/features/booking/components/TripInvoiceModal";

interface Booking {
  _id: string;
  pickupAddress: string;
  dropAddress: string;
  pickupLocation?: { coordinates: [number, number] };
  dropLocation?: { coordinates: [number, number] };
  routeCoordinates?: [number, number][];
  routeDistanceKm?: number;
  fare: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  createdAt: string;
  startedAt?: string;
  actualPickupTime?: string;
  completedAt?: string;
  tipAmount?: number;
  rating?: number;
  user?: {
    name: string;
    phone?: string;
  };
  driver?: {
    name: string;
  };
  vehicle?: {
    vehicleModel: string;
    type?: string; // car, bike, auto, truck etc.
    imageUrl?: string;
    number?: string;
  };
  userMobileNumber?: string;
  isScheduled?: boolean;
  scheduledPickupTime?: string;
}

export default function PartnerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<any | null>(null);
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState<any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch("/api/partner/bookings", {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        });
        const data = await res.json();
        setBookings(data.bookings || []);
      } catch (err) {
        console.error("Failed to fetch bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: "bg-amber-100 text-amber-900 border-amber-300 font-bold",
      confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
      completed: "bg-teal-50 text-teal-700 border-teal-200",
      requested: "bg-amber-50 text-amber-700 border-amber-200",
      awaiting_payment: "bg-blue-50 text-blue-700 border-blue-200",
      cancelled: "bg-rose-50 text-rose-700 border-rose-200",
      rejected: "bg-red-50 text-red-700 border-red-200",
      expired: "bg-gray-50 text-gray-700 border-gray-200",
    };
    return colors[status] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getVehicleIcon = (vehicleType?: string) => {
    switch(vehicleType?.toLowerCase()) {
      case 'bike':
      case 'motorcycle':
        return <Bike className="w-4 h-4 text-gray-400" />;
      case 'auto':
      case 'rickshaw':
        return <Car className="w-4 h-4 text-gray-400" />; // You can add Auto icon if available
      case 'truck':
      case 'lorry':
        return <Truck className="w-4 h-4 text-gray-400" />;
      case 'suv':
      case 'sedan':
      case 'hatchback':
      default:
        return <Car className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(',', '');
  };

  const filteredBookings = statusFilter === "All" 
    ? bookings 
    : bookings.filter(b => b.status === statusFilter.toLowerCase());

  return (
    <div className="min-h-screen bg-[#F7F1E5]">
      
      {/* HEADER - PARTNER SPECIFIC */}
      <div className="bg-[#FAF7F0] border-b border-[#DED7CA]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto py-5 sm:py-6">
            <div className="flex items-center gap-3">
              <div className="bg-[#123D32]/10 p-2.5 rounded-[10px] shrink-0 border border-[#123D32]/20">
                <Car className="w-5 h-5 text-[#123D32]" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#10251C]">Partner Bookings</h1>
                <p className="text-[#696B64] text-xs sm:text-sm mt-0.5 sm:mt-1 font-sans">
                  {bookings.length} {bookings.length === 1 ? 'ride' : 'rides'} assigned to you
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-6">
        <div className="max-w-3xl mx-auto">
          
          {/* FILTER BAR */}
          <div className="flex justify-between items-center mb-5 sm:mb-6">
            <div className="text-xs sm:text-sm text-[#696B64] font-medium">
              Showing <span className="text-[#10251C] font-bold">{filteredBookings.length}</span> bookings
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#FAF7F0] border border-[#DED7CA] rounded-[8px] px-3.5 py-1.5 text-xs sm:text-sm text-[#10251C] focus:outline-none focus:ring-1 focus:ring-[#123D32] focus:border-[#123D32] font-medium shadow-xs"
            >
              <option>All</option>
              <option>Scheduled</option>
              <option>Confirmed</option>
              <option>Completed</option>
              <option>Requested</option>
              <option>Cancelled</option>
            </select>
          </div>

          {/* SKELETON LOADING STATE */}
          {loading && (
            <div className="py-2">
              <RideCardSkeleton count={3} />
            </div>
          )}

          {/* EMPTY STATE */}
          {!loading && filteredBookings.length === 0 && (
            <div className="bg-[#FAF7F0] rounded-[14px] border border-[#DED7CA] p-8 sm:p-12 text-center shadow-xs">
              <Car className="w-12 h-12 text-[#696B64]/40 mx-auto mb-3" />
              <h3 className="text-base sm:text-lg font-serif font-bold text-[#10251C]">No bookings yet</h3>
              <p className="text-[#696B64] text-xs sm:text-sm mt-1">When customers book rides, they'll appear here</p>
            </div>
          )}

          {/* BOOKINGS LIST */}
          {!loading && filteredBookings.length > 0 && (
            <div className="space-y-4">
              {filteredBookings.map((booking, index) => (
                <motion.div
                  key={booking._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="bg-[#FAF7F0] rounded-[14px] border border-[#DED7CA] shadow-xs hover:shadow-md transition-all overflow-hidden">
                    
                    {/* CUSTOMER INFO - PARTNER SPECIFIC */}
                    <div className="flex items-start sm:items-center gap-3 p-3.5 sm:p-4 bg-[#F7F1E5]/80 border-b border-[#DED7CA]">
                      {/* CUSTOMER AVATAR */}
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-[#123D32]/10 flex-shrink-0 border-2 border-white shadow-xs flex items-center justify-center">
                        <User className="w-5 h-5 sm:w-6 sm:h-6 text-[#123D32]" />
                      </div>
                      
                      {/* CUSTOMER DETAILS */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <h3 className="font-semibold text-sm sm:text-base text-[#10251C] truncate">
                            {booking.user?.name || "Customer"}
                          </h3>
                          <span className={`px-2.5 py-0.5 sm:py-1 rounded-[6px] border text-[11px] sm:text-xs font-semibold ${getStatusColor(booking.status)}`}>
                            {booking.status.replace("_", " ")}
                          </span>
                        </div>
                        
                        {/* USER MOBILE NUMBER - UPDATED */}
                        {(booking.userMobileNumber || booking.user?.phone) && (
                          <div className="flex items-center gap-1 mt-0.5 sm:mt-1 text-[11px] sm:text-xs text-[#696B64]">
                            <Phone className="w-3 h-3 shrink-0" />
                            <span>
                              {(() => {
                                const num = booking.userMobileNumber || booking.user?.phone;
                                if (!num) return "";
                                const cleaned = num.replace(/\D/g, "");
                                return cleaned.length >= 4 
                                  ? `XXXXXX${cleaned.slice(-4)}`
                                  : "Masked for Security";
                              })()}
                            </span>
                          </div>
                        )}
                        {booking.isScheduled && booking.scheduledPickupTime && (
                          <div className="inline-flex items-center gap-1.5 bg-[#FAF7F0] text-[#B83A24] border border-[#B83A24]/30 text-[11px] sm:text-xs font-bold px-2.5 py-0.5 sm:py-1 rounded-[6px] mt-1.5">
                            <span>⏰ Scheduled: {formatDate(booking.scheduledPickupTime)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* VEHICLE INFO - WITH DYNAMIC ICON */}
                    {booking.vehicle && (
                      <div className="px-3.5 sm:px-4 pt-2.5 sm:pt-3">
                        <div className="bg-[#F7F1E5] border border-[#DED7CA]/70 rounded-[8px] p-2 flex items-center gap-2">
                          {getVehicleIcon(booking.vehicle.type)}
                          <span className="text-xs text-[#696B64] font-medium truncate">
                            {booking.vehicle.vehicleModel} • {booking.vehicle.number || "Not assigned"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* ADDRESS SECTION */}
                    <div className="p-3.5 sm:p-4 space-y-2.5 sm:space-y-3">
                      {/* PICKUP */}
                      <div className="flex items-start gap-2.5 sm:gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-[#123D32]/10 rounded-full flex items-center justify-center mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-[#123D32]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] sm:text-xs font-bold text-[#123D32] uppercase tracking-wider">PICKUP</span>
                          <p className="text-xs sm:text-sm text-[#10251C] mt-0.5 leading-relaxed font-medium">
                            {booking.pickupAddress}
                          </p>
                        </div>
                      </div>

                      {/* DROP */}
                      <div className="flex items-start gap-2.5 sm:gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-[#B83A24]/10 rounded-full flex items-center justify-center mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-[#B83A24]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] sm:text-xs font-bold text-[#B83A24] uppercase tracking-wider">DROP</span>
                          <p className="text-xs sm:text-sm text-[#10251C] mt-0.5 leading-relaxed font-medium">
                            {booking.dropAddress}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* DATE AND FARE */}
                    <div className="flex items-center justify-between px-3.5 sm:px-4 py-2.5 sm:py-3 bg-[#F7F1E5]/70 border-t border-[#DED7CA]">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-[#696B64]">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#696B64]" />
                        <span>{formatDate(booking.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1 font-bold text-[#10251C] text-sm sm:text-base">
                        <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#123D32]" />
                        <span>₹{booking.fare}</span>
                      </div>
                    </div>

                    {/* PAYMENT AND ACTIONS */}
                    <div className="flex items-center justify-between px-3.5 sm:px-4 py-2.5 sm:py-3 border-t border-[#DED7CA]">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-[11px] sm:text-xs text-[#696B64]">Payment:</span>
                        <span className={`text-[11px] sm:text-xs px-2.5 py-0.5 rounded-[6px] font-semibold border ${
                          booking.paymentStatus === 'paid' 
                            ? 'bg-[#123D32]/10 text-[#123D32] border-[#123D32]/30' 
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}>
                          {booking.paymentStatus || 'pending'}
                        </span>
                        {booking.paymentMethod && (
                          <span className="text-[11px] sm:text-xs text-[#696B64] capitalize">
                            • {booking.paymentMethod}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {booking.status === "completed" ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBookingForInvoice(booking);
                                setShowInvoiceModal(true);
                              }}
                              className="flex items-center gap-1 text-xs font-semibold text-[#10251C] hover:text-[#123D32] bg-[#FAF7F0] hover:bg-[#F7F1E5] px-2.5 sm:px-3 py-1.5 transition-colors border border-[#DED7CA] rounded-[8px] cursor-pointer"
                              title="Download Official GST Tax Invoice"
                            >
                              <FileText size={13} />
                              <span>Invoice</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBookingForDetails(booking);
                                setShowDetailsModal(true);
                              }}
                              className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#FAF7F0] bg-[#123D32] hover:bg-[#0D3027] px-3 sm:px-4 py-1.5 transition-colors cursor-pointer rounded-[8px]"
                            >
                              <span>Details</span>
                              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => window.location.href = `/partner/active-ride`}
                            className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#FAF7F0] bg-[#123D32] hover:bg-[#0D3027] px-3 sm:px-4 py-1.5 rounded-[8px] transition-colors"
                          >
                            <span>Live Ride</span>
                            <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ══ TRIP DETAILS MODAL (UBER STYLE ROUTE & RECEIPT) ══ */}
      <TripDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        booking={selectedBookingForDetails}
        perspective="vendor"
        onOpenInvoice={(b) => {
          setSelectedBookingForInvoice(b);
          setShowInvoiceModal(true);
        }}
      />

      {/* ══ GST TAX INVOICE MODAL & PRINT VIEW ══ */}
      <TripInvoiceModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        booking={selectedBookingForInvoice}
      />
    </div>
  );
}