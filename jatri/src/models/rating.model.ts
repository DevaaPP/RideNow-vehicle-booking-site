import mongoose, { Schema, Document } from "mongoose";

export interface IRating extends Document {
  booking: mongoose.Types.ObjectId;
  rider: mongoose.Types.ObjectId;
  driver: mongoose.Types.ObjectId;
  rating: number; // 1 to 5 stars
  feedback?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const RatingSchema = new Schema<IRating>(
  {
    booking: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true,
      index: true,
    },
    rider: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    driver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

RatingSchema.index({ driver: 1, createdAt: -1 });

const Rating =
  mongoose.models.Rating || mongoose.model<IRating>("Rating", RatingSchema);

export default Rating;
