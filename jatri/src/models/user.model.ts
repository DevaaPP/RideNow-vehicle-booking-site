import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "user" | "vendor" | "admin";
export type VendorStatus = "pending" | "approved" | "rejected";

export type VideoKycStatus =
  | "not_required"
  | "pending"
  | "in_progress"
  | "approved"
  | "rejected";

export type VehicleType =
  | "scooty"
  | "bike"
  | "auto"
  | "e-rickshaw"
  | "mini"
  | "car"
  | "priority"
  | "intercity"
  | "loading"
  | "truck";

export type VerificationItemStatus =
  | "not_submitted"
  | "pending"
  | "verified"
  | "rejected"
  | "expired";

export interface IDriverVerificationStatus {
  identity: VerificationItemStatus;
  drivingLicense: VerificationItemStatus;
  face: VerificationItemStatus;
  background: VerificationItemStatus;
  address: VerificationItemStatus;
  bank: VerificationItemStatus;
  vehicle: VerificationItemStatus;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  mobileNumber?: string;
  profilePicture?: string;

  role: UserRole;

  vendorStatus?: VendorStatus;
  vendorOnboardingStep: number;
  vendorProfileCompleted: boolean;
  vendorRejectionReason?: string;
  vendorApprovedAt?: Date;
  isVendorBlocked: boolean;

  videoKycStatus: VideoKycStatus;
  videoKycRoomId?: string;
  videoKycRejectionReason?: string;

  /* ===== DRIVER MULTI-FACTOR VERIFICATION ENGINE ===== */
  driverVerificationStatus?: IDriverVerificationStatus;

  /* ===== DRIVER REALTIME FIELDS ===== */
socketId:string | null
  isOnline: boolean;
  currentVehicleType?: VehicleType;

  location?: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };

  lastLocationUpdate?: Date;
  lastHeartbeat?: Date;

  /* ===== RATINGS & REPUTATION ===== */
  rating?: number; // Rolling average 1.0 - 5.0
  totalRatingsCount?: number;
  totalRides?: number;

  /* ===== DRIVER CANCELLATION ACCOUNTABILITY & PERFORMANCE ===== */
  cancellationCount?: number;
  dailyCancellationCount?: number;
  lastCancellationDate?: Date;
  dispatchBlockedUntil?: Date;

  /* ===== COMMON ===== */

  isEmailVerified: boolean;
  isMobileVerified: boolean;
  otp?: string;
  otpExpiresAt?: Date;
  otpFailedAttempts?: number;
  otpLockedUntil?: Date | null;

  /* ===== STUDENT PROGRAM (ANNUAL 12-MONTH VERIFIED BENEFIT) ===== */
  isStudent?: boolean;
  studentVerification?: {
    status: "not_verified" | "pending" | "verified" | "expired" | "rejected";
    institutionName?: string;
    verificationMethod?: "institutional_email" | "student_id" | "enrollment_document";
    studentName?: string;
    studentIdNumber?: string;
    eduEmail?: string;
    documentType?: string;
    documentUrl?: string;
    academicYear?: string;
    submittedAt?: Date;
    verifiedAt?: Date;
    expiresAt?: Date;
    verificationReference?: string;
    rejectionReason?: string;
    activationOtp?: string;
    activationOtpExpiresAt?: Date;
    activationOtpSentAt?: Date;
    activationOtpFailedAttempts?: number;
  };
  studentDetails?: {
    eduEmail?: string;
    institution?: string;
    verifiedAt?: Date;
    expiresAt?: Date;
  };
  studentMonthlyUsage?: {
    monthKey: string;
    discountUsed: number;
    discountReserved: number;
    ridesCount: number;
    reservedRidesCount: number;
    lastResetAt: Date;
  };

  /* ===== WOMEN'S SAFETY MATCHING ===== */
  safetyMatching?: {
    driverCategory?: "woman" | "other" | "undisclosed";
    driverVerificationStatus?: "not_submitted" | "pending" | "verified" | "rejected" | "expired";
    verifiedAt?: Date;
    verificationNotes?: string;
    womenOnlyEligible?: boolean;
    consentedAt?: Date;
  };
  driverPassengerPolicy?: "all_eligible" | "women_only";

  /* ===== WALLET & OUTSTANDING DUES ===== */
  walletBalance: number;
  outstandingAmount?: number; // Unpaid cancellation charges recovered on next ride

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
    },

    password: {
      type: String,
    },

    mobileNumber: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },

    isMobileVerified: {
      type: Boolean,
      default: false,
      index: true,
    },

    profilePicture: String,

    role: {
      type: String,
      enum: ["user", "vendor", "admin"],
      default: "user",
      index: true,
    },

    /* ===== VENDOR ===== */

    vendorStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
    },

    vendorOnboardingStep: {
      type: Number,
      default: 0,
      min: 0,
      max: 8,
    },

    vendorProfileCompleted: {
      type: Boolean,
      default: false,
    },

    vendorRejectionReason: String,
    vendorApprovedAt: Date,

    isVendorBlocked: {
      type: Boolean,
      default: false,
    },

    /* ===== VIDEO KYC ===== */

    videoKycStatus: {
      type: String,
      enum: [
        "not_required",
        "pending",
        "in_progress",
        "approved",
        "rejected",
      ],
      default: "not_required",
    },

    videoKycRoomId: String,
    videoKycRejectionReason: String,

    /* ===== DRIVER MULTI-FACTOR VERIFICATION ENGINE ===== */
    driverVerificationStatus: {
      identity: {
        type: String,
        enum: ["not_submitted", "pending", "verified", "rejected", "expired"],
        default: "not_submitted",
      },
      drivingLicense: {
        type: String,
        enum: ["not_submitted", "pending", "verified", "rejected", "expired"],
        default: "not_submitted",
      },
      face: {
        type: String,
        enum: ["not_submitted", "pending", "verified", "rejected", "expired"],
        default: "not_submitted",
      },
      background: {
        type: String,
        enum: ["not_submitted", "pending", "verified", "rejected", "expired"],
        default: "not_submitted",
      },
      address: {
        type: String,
        enum: ["not_submitted", "pending", "verified", "rejected", "expired"],
        default: "not_submitted",
      },
      bank: {
        type: String,
        enum: ["not_submitted", "pending", "verified", "rejected", "expired"],
        default: "not_submitted",
      },
      vehicle: {
        type: String,
        enum: ["not_submitted", "pending", "verified", "rejected", "expired"],
        default: "not_submitted",
      },
    },

    /* ===== DRIVER REALTIME DATA ===== */

    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },

    socketId:{
      type:String,
      default:null
    },

    currentVehicleType: {
      type: String,
      enum: ["scooty", "bike", "auto", "e-rickshaw", "mini", "car", "priority", "intercity", "loading", "truck"],
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number], // [lng, lat]
      },
    },

    lastLocationUpdate: {
      type: Date,
    },
    lastHeartbeat: {
      type: Date,
      index: true,
    },

    /* ===== RATINGS & REPUTATION ===== */
    rating: {
      type: Number,
      default: 5.0,
      min: 1.0,
      max: 5.0,
    },
    totalRatingsCount: {
      type: Number,
      default: 0,
    },
    totalRides: {
      type: Number,
      default: 0,
    },

    /* ===== DRIVER CANCELLATION ACCOUNTABILITY ===== */
    cancellationCount: {
      type: Number,
      default: 0,
    },
    dailyCancellationCount: {
      type: Number,
      default: 0,
    },
    lastCancellationDate: {
      type: Date,
    },
    dispatchBlockedUntil: {
      type: Date,
      index: true,
    },

    /* ===== AUTH ===== */

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    otp: String,
    otpExpiresAt: Date,
    otpFailedAttempts: {
      type: Number,
      default: 0,
    },
    otpLockedUntil: {
      type: Date,
      default: null,
      index: true,
    },

    /* ===== STUDENT PROGRAM (ANNUAL 12-MONTH BENEFIT) ===== */
    isStudent: {
       type: Boolean,
       default: false,
       index: true,
    },
    studentVerification: {
      status: {
        type: String,
        enum: ["not_verified", "pending", "verified", "expired", "rejected"],
        default: "not_verified",
        index: true,
      },
      institutionName: { type: String, trim: true },
      verificationMethod: {
        type: String,
        enum: ["institutional_email", "student_id", "enrollment_document"],
      },
      studentName: { type: String, trim: true },
      studentIdNumber: { type: String, trim: true },
      eduEmail: { type: String, trim: true, lowercase: true },
      documentType: { type: String, trim: true },
      documentUrl: { type: String, trim: true },
      academicYear: { type: String, trim: true },
      submittedAt: { type: Date },
      verifiedAt: { type: Date },
      expiresAt: { type: Date, index: true },
      verificationReference: { type: String, trim: true },
      rejectionReason: { type: String, trim: true },
      activationOtp: { type: String },
      activationOtpExpiresAt: { type: Date },
      activationOtpSentAt: { type: Date },
      activationOtpFailedAttempts: { type: Number, default: 0 },
    },
    studentDetails: {
      eduEmail: String,
      institution: String,
      verifiedAt: Date,
      expiresAt: Date,
    },

    studentMonthlyUsage: {
      monthKey: { type: String, default: "" },
      discountUsed: { type: Number, default: 0, min: 0 },
      discountReserved: { type: Number, default: 0, min: 0 },
      ridesCount: { type: Number, default: 0, min: 0 },
      reservedRidesCount: { type: Number, default: 0, min: 0 },
      lastResetAt: { type: Date, default: Date.now },
    },
    /* ===== WOMEN'S SAFETY MATCHING ===== */
    safetyMatching: {
      driverCategory: {
        type: String,
        enum: ["woman", "other", "undisclosed"],
        default: "undisclosed",
      },
      driverVerificationStatus: {
        type: String,
        enum: ["not_submitted", "pending", "verified", "rejected", "expired"],
        default: "not_submitted",
        index: true,
      },
      verifiedAt: { type: Date },
      verificationNotes: { type: String, trim: true },
      womenOnlyEligible: { type: Boolean, default: false, index: true },
      consentedAt: { type: Date },
    },
    driverPassengerPolicy: {
      type: String,
      enum: ["all_eligible", "women_only"],
      default: "all_eligible",
      index: true,
    },

    /* ===== WALLET & OUTSTANDING DUES ===== */
    walletBalance: {
      type: Number,
      default: 0,
      index: true,
    },
    outstandingAmount: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
  },
  { timestamps: true }
);

/* ===== GEO INDEX ===== */
UserSchema.index({ location: "2dsphere" });
UserSchema.index({ location: "2dsphere", role: 1, isOnline: 1 });

const User =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
