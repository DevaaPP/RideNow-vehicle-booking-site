"use client";



import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  IndianRupee,
  Loader2,
  Car,
  Calendar,
  ChevronRight,
  MapPin,
  Phone,
  FileText,
} from "lucide-react";
import axios from "axios";
import Nav from "@/shared/components/Nav";
import Footer from "@/shared/components/Footer";
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
  userMobileNumber?: string;
  driverMobileNumber?: string;
  vehicle?: {
    vehicleModel: string;
    imageUrl?: string;
    number?: string;
    type?: string;
  };
  driver?: {
    name: string;
    profilePicture?: string;
  };
  isScheduled?: boolean;
  scheduledPickupTime?: string;
}

export default function MyBookingsPage() {
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
        const res = await axios.get("/api/user/bookings", {
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        });
      
        setBookings(res.data.bookings || []);
      } catch (err) {
        console.error(err);
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
    <div className="min-h-screen flex flex-col bg-gray-50 justify-between">
      <Nav />
      <div className="flex-1 pt-24 sm:pt-28 pb-8">
        {/* HEADER - CENTERED CONTENT */}
        <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto py-5 sm:py-6">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">My Bookings</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5 sm:mt-1">
              {bookings.length} {bookings.length === 1 ? 'ride' : 'rides'} found
            </p>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT - CENTERED CARDS */}
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-6">
        <div className="max-w-3xl mx-auto">
          
          {/* FILTER BAR */}
          <div className="flex justify-between items-center mb-5 sm:mb-6">
            <div className="text-xs sm:text-sm text-gray-500">
              Showing {filteredBookings.length} bookings
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="bg-white rounded-xl shadow-sm p-8 sm:p-12 text-center">
              <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base sm:text-lg font-medium text-gray-900">No bookings found</h3>
              <p className="text-gray-500 text-xs sm:text-sm mt-1">Ready for a ride? Book one now!</p>
              <button 
                onClick={() => window.location.href = "/book"}
                className="mt-4 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition active:scale-95"
              >
                Book a Ride
              </button>
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
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                    
                    {/* VEHICLE INFO WITH IMAGE */}
                    <div className="flex items-start sm:items-center gap-3 p-3.5 sm:p-4 bg-gray-50 border-b border-gray-200">
                      {/* VEHICLE IMAGE */}
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 border border-gray-300">
                        {booking.vehicle?.imageUrl ? (
                          <img 
                            src={booking.vehicle.imageUrl} 
                            alt={booking.vehicle.vehicleModel}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-300">
                            <Car className="w-7 h-7 sm:w-8 sm:h-8 text-gray-500" />
                          </div>
                        )}
                      </div>
                      
                      {/* VEHICLE DETAILS */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                            {booking.vehicle?.vehicleModel || "Standard Vehicle"}
                          </h3>
                          <span className={`px-2 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status.replace("_", " ")}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">
                          {booking.driver?.name ? `Driver: ${booking.driver.name}` : 'Driver assigning...'}
                        </p>
                        {booking.isScheduled && booking.scheduledPickupTime && (
                          <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 text-[11px] sm:text-xs font-bold px-2.5 py-0.5 sm:py-1 rounded-lg mt-1.5">
                            <span>⏰ Scheduled: {formatDate(booking.scheduledPickupTime)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ADDRESS SECTION - CLEARLY LABELED */}
                    <div className="p-3.5 sm:p-4 space-y-2.5 sm:space-y-3">
                      {/* PICKUP - GREEN */}
                      <div className="flex items-start gap-2.5 sm:gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                          <MapPin className="w-3 h-3 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] sm:text-xs font-medium text-green-600 uppercase tracking-wider">PICKUP</span>
                          <p className="text-xs sm:text-sm text-gray-700 mt-0.5 leading-relaxed">
                            {booking.pickupAddress}
                          </p>
                        </div>
                      </div>

                      {/* DROP - RED */}
                      <div className="flex items-start gap-2.5 sm:gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
                          <MapPin className="w-3 h-3 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] sm:text-xs font-medium text-red-600 uppercase tracking-wider">DROP</span>
                          <p className="text-xs sm:text-sm text-gray-700 mt-0.5 leading-relaxed">
                            {booking.dropAddress}
                          </p>
                        </div>
                      </div>

                      {/* CONTACT NUMBERS SECTION */}
                      <div className="pt-2.5 sm:pt-3 mt-2 border-t border-gray-100 space-y-2">
                        {/* USER MOBILE NUMBER */}
                        {booking.userMobileNumber && (
                          <div className="flex items-start gap-2.5 sm:gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <Phone className="w-3 h-3 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] sm:text-xs font-medium text-blue-600 uppercase tracking-wider">YOUR NUMBER</span>
                              <p className="text-xs sm:text-sm text-gray-700 mt-0.5">
                                {booking.userMobileNumber}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* DRIVER MOBILE NUMBER */}
                        {booking.driverMobileNumber && (
                          <div className="flex items-start gap-2.5 sm:gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                              <Phone className="w-3 h-3 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] sm:text-xs font-medium text-purple-600 uppercase tracking-wider">DRIVER CONTACT</span>
                              <p className="text-xs sm:text-sm text-gray-700 mt-0.5">
                                {(() => {
                                  const cleaned = booking.driverMobileNumber.replace(/\D/g, "");
                                  return cleaned.length >= 4 
                                    ? `XXXXXX${cleaned.slice(-4)}`
                                    : "Masked for Security";
                                })()}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* DATE AND FARE */}
                    <div className="flex items-center justify-between px-3.5 sm:px-4 py-2.5 sm:py-3 bg-gray-50 border-t border-gray-200">
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                        <span>{formatDate(booking.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1 font-semibold text-gray-900 text-sm sm:text-base">
                        <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>₹{booking.fare}</span>
                      </div>
                    </div>

                    {/* PAYMENT AND ACTION */}
                    <div className="flex items-center justify-between px-3.5 sm:px-4 py-2.5 sm:py-3 border-t border-gray-200">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className="text-[11px] sm:text-xs text-gray-500">Payment:</span>
                        
                        <span className={`text-[11px] sm:text-xs px-2 py-0.5 rounded-full ${
                          booking.paymentStatus === 'paid' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {booking.paymentStatus || 'pending'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {booking.status === "completed" && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBookingForInvoice(booking);
                              setShowInvoiceModal(true);
                            }}
                            className="flex items-center gap-1 text-xs font-bold text-zinc-700 hover:text-zinc-950 bg-zinc-100 hover:bg-zinc-200 px-2.5 sm:px-3 py-1.5 transition-colors border border-zinc-300 rounded-none cursor-pointer"
                            title="Download Official GST Tax Invoice"
                          >
                            <FileText size={13} />
                            <span>Invoice</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (["completed", "cancelled"].includes(booking.status)) {
                              setSelectedBookingForDetails(booking);
                              setShowDetailsModal(true);
                            } else {
                              window.location.href = `/ride/${booking._id}`;
                            }
                          }}
                          className="flex items-center gap-1 text-xs sm:text-sm font-bold text-white bg-zinc-900 hover:bg-black px-3 sm:px-4 py-1.5 transition-colors cursor-pointer rounded-none"
                        >
                          <span>View Details</span>
                          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>

      {/* ══ TRIP DETAILS MODAL (UBER STYLE ROUTE & RECEIPT) ══ */}
      <TripDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        booking={selectedBookingForDetails}
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

      <Footer />
    </div>
  );
}