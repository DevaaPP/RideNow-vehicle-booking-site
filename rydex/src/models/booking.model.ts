import mongoose, { Schema, Document, Types } from "mongoose";

export type BookingStatus =
  | "requested"
  | "awaiting_payment"
  | "confirmed"
  | "started"
  | "completed"
  | "cancelled"
  | "rejected"
  | "expired"
  | "auto_rematching"
  | "no_drivers_available";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "cash"
  | "failed";

export interface IGroupMember {
  user?: Types.ObjectId;
  name: string;
  email: string;
  status: "creator" | "accepted" | "pending" | "declined";
  shareAmount: number;
}

export interface IBooking extends Document {
  user: Types.ObjectId;
  driver: Types.ObjectId;
  vehicle: Types.ObjectId;

  pickupAddress: string;
  dropAddress: string;

  pickupLocation: {
    type: "Point";
    coordinates: [number, number];
  };

  dropLocation: {
    type: "Point";
    coordinates: [number, number];
  };

  fare: number;

  status: BookingStatus;
  paymentStatus: PaymentStatus;

  paymentDeadline?: Date;

  userMobileNumber: string;
  driverMobileNumber: string;
  adminCommission: number
partnerAmount: number
    pickupOtp: string

  pickupOtpExpires: Date
  dropOtp: string

  dropOtpExpires: Date
  candidateDrivers: Types.ObjectId[];
  currentDriverIndex: number;
  isPanicActive?: boolean;
  panicActivatedAt?: Date;
  shareToken?: string;
  isGroupRide?: boolean;
  groupInviteCode?: string;
  groupMembers?: IGroupMember[];
  splitFarePerPerson?: number;
  isSmartPickup?: boolean;
  smartPickupDetails?: {
    venueName: string;
    spotName: string;
    instructions: string;
    walkingTimeText: string;
  };
  isAutoRematching?: boolean;
  cancelledDriverIds?: Types.ObjectId[];
  reMatchCount?: number;
  isRouteDeviated?: boolean;
  safetyStatus?: "normal" | "deviation_detected" | "passenger_confirmed_safe" | "sos_activated";
  lastSafetyCheckInAt?: Date;
  safetyNotes?: string;
  fareBreakdown?: {
    vehicleType: string;
    baseFare: number;
    distanceKm: number;
    pricePerKm: number;
    distanceFare: number;
    timeMinutes: number;
    pricePerMinute: number;
    timeFare: number;
    platformFee: number;
    surgeMultiplier: number;
    surgeAmount: number;
    taxes: number;
    discount: number;
    isStudentDiscountApplied?: boolean;
    studentDiscount?: number;
    totalFare: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    driver: { type: Schema.Types.ObjectId, ref: "User", required: true },
    vehicle: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true },

    pickupAddress: { type: String, required: true },
    dropAddress: { type: String, required: true },

    pickupLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },

    dropLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    

    fare: { type: Number, required: true },

    status: {
      type: String,
      default: "requested",
      index: true,
    },
adminCommission: {
  type: Number,
  default: 0,
},

partnerAmount: {
  type: Number,
  default: 0,
},
    paymentStatus: {
      type: String,
      default: "pending",
    },

    paymentDeadline: Date,

    pickupOtp: {
  type: String,
},

pickupOtpExpires: {
  type: Date,
},
   dropOtp: {
  type: String,
},

dropOtpExpires: {
  type: Date,
},

    userMobileNumber: { 
      type: String, 
      required: true,
      trim: true,
    },

    driverMobileNumber: { 
      type: String, 
      required: true,
      trim: true,
    },
    candidateDrivers: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    currentDriverIndex: {
      type: Number,
      default: 0,
    },
    isPanicActive: {
      type: Boolean,
      default: false,
    },
    panicActivatedAt: {
      type: Date,
    },
    shareToken: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    isGroupRide: {
      type: Boolean,
      default: false,
    },
    groupInviteCode: {
      type: String,
      index: true,
    },
    groupMembers: [
      {
        user: { type: Schema.Types.ObjectId, ref: "User" },
        name: { type: String, required: true },
        email: { type: String, required: true },
        status: { type: String, enum: ["creator", "accepted", "pending", "declined"], default: "pending" },
        shareAmount: { type: Number, default: 0 },
      },
    ],
    splitFarePerPerson: {
      type: Number,
    },
    isSmartPickup: {
      type: Boolean,
      default: false,
    },
    smartPickupDetails: {
      venueName: { type: String },
      spotName: { type: String },
      instructions: { type: String },
      walkingTimeText: { type: String },
    },
    isAutoRematching: {
      type: Boolean,
      default: false,
    },
    cancelledDriverIds: [
      { type: Schema.Types.ObjectId, ref: "User" }
    ],
    reMatchCount: {
      type: Number,
      default: 0,
    },
    isRouteDeviated: {
      type: Boolean,
      default: false,
    },
    safetyStatus: {
      type: String,
      enum: ["normal", "deviation_detected", "passenger_confirmed_safe", "sos_activated"],
      default: "normal",
    },
    lastSafetyCheckInAt: {
      type: Date,
    },
    safetyNotes: {
      type: String,
    },
    fareBreakdown: {
      vehicleType: { type: String },
      baseFare: { type: Number },
      distanceKm: { type: Number },
      pricePerKm: { type: Number },
      distanceFare: { type: Number },
      timeMinutes: { type: Number },
      pricePerMinute: { type: Number },
      timeFare: { type: Number },
      platformFee: { type: Number },
      surgeMultiplier: { type: Number },
      surgeAmount: { type: Number },
      taxes: { type: Number },
      discount: { type: Number },
      isStudentDiscountApplied: { type: Boolean, default: false },
      studentDiscount: { type: Number, default: 0 },
      totalFare: { type: Number },
    },
  },
  { timestamps: true }
);

const Booking = mongoose.models.Booking ||
  mongoose.model<IBooking>("Booking", BookingSchema);
export default Booking;