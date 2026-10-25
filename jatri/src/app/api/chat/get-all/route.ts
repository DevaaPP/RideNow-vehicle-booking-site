import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDb from "@/lib/db";
import ChatMessage from "@/models/chatMessage.model";
import Booking from "@/models/booking.model";
import { auth } from "@/auth";
import { isChatLocked } from "@/lib/chatPrivacy";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Please sign in to view messages" },
        { status: 401 }
      );
    }

    const userId = session.user.id.toString();
    const body = await req.json().catch(() => ({}));
    const { rideId } = body;

    if (!rideId || !mongoose.Types.ObjectId.isValid(rideId)) {
      return NextResponse.json(
        { success: false, message: "Invalid or missing rideId parameter" },
        { status: 400 }
      );
    }

    await connectDb();

    // 1. Tenancy & Participant check: caller must be participant or admin
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
        { success: false, message: "Forbidden: You are not authorized to view messages for this ride" },
        { status: 403 }
      );
    }

    // 2. Query active messages respecting the 7-day TTL retention window
    // Accounts for MongoDB's asynchronous TTL deletion interval by filtering server-side
    const now = new Date();
    const messages = await ChatMessage.find({
      rideId,
      $or: [
        { expiresAt: { $gt: now } },
        { expiresAt: { $exists: false } },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      success: true,
      isChatLocked: isChatLocked(booking.status),
      bookingStatus: booking.status,
      messages,
    });
  } catch (error: any) {
    console.error("[chat:get-all] Server error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load chat history" },
      { status: 500 }
    );
  }
}
