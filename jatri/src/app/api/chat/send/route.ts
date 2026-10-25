import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDb from "@/lib/db";
import ChatMessage from "@/models/chatMessage.model";
import Booking from "@/models/booking.model";
import { auth } from "@/auth";
import { sanitizeChatText } from "@/lib/validation";
import { rateLimiter } from "@/lib/rateLimit";
import { maskChatPii, isChatLocked, calculateMessageExpiryDate } from "@/lib/chatPrivacy";

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

    // 4. Tenancy & Participant check: caller must be the rider, driver, or admin of this ride
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

    // 5. Post-Ride Communication Lockout
    // Once ride is completed, cancelled, or expired, reject new messages permanently
    if (isChatLocked(booking.status)) {
      return NextResponse.json(
        {
          success: false,
          isLocked: true,
          message: "This ride has ended. In-app messaging is closed for safety and privacy.",
        },
        { status: 403 }
      );
    }

    // 6. Contact Masking (PII Protection): Strip phone numbers and email addresses
    const { maskedText, hadPii } = maskChatPii(textValidation.sanitized);

    // 7. Prevent role spoofing: sender is derived securely from session tenancy
    const authoritativeSender: "user" | "driver" = isRider ? "user" : "driver";

    // 8. Auto-expiring 7-day TTL retention
    const expiresAt = calculateMessageExpiryDate();

    const msg = await ChatMessage.create({
      rideId,
      text: maskedText,
      hasPiiMasked: hadPii,
      sender: authoritativeSender,
      expiresAt,
    });

    return NextResponse.json({
      success: true,
      message: msg,
      hasPiiMasked: hadPii,
    });
  } catch (error: any) {
    console.error("[chat:send] Server error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send chat message" },
      { status: 500 }
    );
  }
}
