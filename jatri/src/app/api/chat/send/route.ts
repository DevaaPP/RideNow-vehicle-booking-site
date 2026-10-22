import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDb from "@/lib/db";
import ChatMessage from "@/models/chatMessage.model";
import Booking from "@/models/booking.model";
import { auth } from "@/auth";
import { sanitizeChatText } from "@/lib/validation";
import { rateLimiter } from "@/lib/rateLimit";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Please sign in to send messages" },
        { status: 401 }
      );
    }

    const userId = session.user.id.toString();

    // 1. Rate limiting: max 30 chat messages per minute per participant
    const limit = rateLimiter.check(`chat:send:${userId}`, 30, 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, message: "Too many messages sent. Please slow down." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { rideId, text } = body;

    // 2. Validate rideId ObjectId format
    if (!rideId || !mongoose.Types.ObjectId.isValid(rideId)) {
      return NextResponse.json(
        { success: false, message: "Invalid or missing rideId parameter" },
        { status: 400 }
      );
    }

    // 3. Sanitize and validate message payload
    const textValidation = sanitizeChatText(text, 500);
    if (!textValidation.isValid) {
      return NextResponse.json(
        { success: false, message: textValidation.error || "Invalid message text" },
        { status: 400 }
      );
    }

    await connectDb();

    // 4. Tenancy & Participant check: caller must be the rider or driver of this ride
    const booking = await Booking.findById(rideId).select("user driver status");
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Ride booking not found" },
        { status: 404 }
      );
    }

    const isRider = booking.user?.toString() === userId;
    const isDriver = booking.driver && booking.driver.toString() === userId;
    const isAdmin = session.user.role === "admin";

    if (!isRider && !isDriver && !isAdmin) {
      return NextResponse.json(
        { success: false, message: "Forbidden: You are not an active participant in this ride" },
        { status: 403 }
      );
    }

    // 5. Prevent role spoofing: sender is derived securely from session tenancy
    const authoritativeSender: "user" | "driver" = isRider ? "user" : "driver";

    const msg = await ChatMessage.create({
      rideId,
      text: textValidation.sanitized,
      sender: authoritativeSender,
    });

    return NextResponse.json({
      success: true,
      message: msg,
    });
  } catch (error: any) {
    console.error("[chat:send] Server error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send chat message" },
      { status: 500 }
    );
  }
}
