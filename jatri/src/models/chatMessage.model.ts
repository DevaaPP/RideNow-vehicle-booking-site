import mongoose, { Schema, Document, Types } from "mongoose";

export interface IChatMessage extends Document {
  rideId: Types.ObjectId;
  sender: "user" | "driver";
  text: string;
  hasPiiMasked?: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    rideId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },

    sender: {
      type: String,
      enum: ["user", "driver"],
      required: true,
    },

    text: {
      type: String,
      required: true,
      maxlength: 1000,
    },

    hasPiiMasked: {
      type: Boolean,
      default: false,
    },

    // 7-day privacy retention TTL: documents automatically purged after expiresAt
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound query index for ordered chat retrieval
ChatMessageSchema.index({ rideId: 1, createdAt: 1 });

// MongoDB TTL Index (auto-expire documents after expiresAt timestamp)
ChatMessageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const ChatMessage =
  mongoose.models.ChatMessage ||
  mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);

export default ChatMessage;
