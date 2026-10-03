import mongoose, { Schema, Document } from "mongoose";

export interface IFareConfig extends Document {
  vehicleType: string; // e.g. bike, auto, car, loading, truck
  baseFare: number;
  pricePerKm: number;
  pricePerMinute: number;
  waitingChargePerMinute: number;
  freeWaitingMinutes: number;
  platformFee: number;
  taxRate: number;
  cancellationFee: number;
  multiplier: number;
  minDistance: number;
  maxDistance: number;
  createdAt: Date;
  updatedAt: Date;
}

const FareConfigSchema = new Schema<IFareConfig>(
  {
    vehicleType: { type: String, required: true, unique: true, lowercase: true, trim: true },
    baseFare: { type: Number, required: true, default: 0 },
    pricePerKm: { type: Number, required: true, default: 0 },
    pricePerMinute: { type: Number, required: true, default: 0 },
    waitingChargePerMinute: { type: Number, required: true, default: 2 },
    freeWaitingMinutes: { type: Number, required: true, default: 3 },
    platformFee: { type: Number, required: true, default: 15 },
    taxRate: { type: Number, required: true, default: 0.05 },
    cancellationFee: { type: Number, required: true, default: 50 },
    multiplier: { type: Number, required: true, default: 1.0 },
    minDistance: { type: Number, required: true, default: 0 },
    maxDistance: { type: Number, required: true, default: 9999 },
  },
  { timestamps: true }
);

const FareConfig = mongoose.models.FareConfig || mongoose.model<IFareConfig>("FareConfig", FareConfigSchema);
export default FareConfig;
