import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDb from "@/lib/db";
import ChatMessage from "@/models/chatMessage.model";
import Booking from "@/models/booking.model";
import { auth } from "@/auth";

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

    // Tenancy & Participant check
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

    const messages = await ChatMessage.find({ rideId })
      .sort({ createdAt: 1 })
      .limit(100)
      .lean();

    return NextResponse.json({
      success: true,
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
