import mongoose, { Schema, Document, Types } from "mongoose";

export type IncidentType =
  | "sos_panic"
  | "route_deviation"
  | "unexpected_stop"
  | "gps_signal_lost"
  | "driver_misbehavior"
  | "passenger_misbehavior"
  | "accident"
  | "overcharging"
  | "other";

export type IncidentStatus =
  | "active"
  | "investigating"
  | "resolved"
  | "false_alarm";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export interface ISafetyIncident extends Document {
  incidentId: string;
  booking: Types.ObjectId;
  reporter: Types.ObjectId;
  reporterRole: "user" | "driver" | "system" | "admin";
  type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description: string;
  location?: {
    type: string;
    coordinates: number[]; // [lng, lat]
    address?: string;
  };
  metrics?: {
    deviationMeters?: number;
    stationaryMinutes?: number;
    signalLostSeconds?: number;
  };
  emergencyContactsNotified: boolean;
  notifiedContactsCount: number;
  resolutionNotes?: string;
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SafetyIncidentSchema = new Schema<ISafetyIncident>(
  {
    incidentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    reporter: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reporterRole: {
      type: String,
      enum: ["user", "driver", "system", "admin"],
      required: true,
    },
    type: {
      type: String,
      enum: [
        "sos_panic",
        "route_deviation",
        "unexpected_stop",
        "gps_signal_lost",
        "driver_misbehavior",
        "passenger_misbehavior",
        "accident",
        "overcharging",
        "other",
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "investigating", "resolved", "false_alarm"],
      default: "active",
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: undefined,
      },
      address: String,
    },
    metrics: {
      deviationMeters: Number,
      stationaryMinutes: Number,
      signalLostSeconds: Number,
    },
    emergencyContactsNotified: {
      type: Boolean,
      default: false,
    },
    notifiedContactsCount: {
      type: Number,
      default: 0,
    },
    resolutionNotes: String,
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

SafetyIncidentSchema.index({ booking: 1, createdAt: -1 });
SafetyIncidentSchema.index({ status: 1, severity: 1 });

const SafetyIncident =
  mongoose.models.SafetyIncident ||
  mongoose.model<ISafetyIncident>("SafetyIncident", SafetyIncidentSchema);

export default SafetyIncident;
