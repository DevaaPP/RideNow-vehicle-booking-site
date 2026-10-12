import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import Booking from "@/models/booking.model";
import User from "@/models/user.model";
import Rating from "@/models/rating.model";
import { auth } from "@/auth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const { rating, feedback, tags } = body;

    // Validate rating value
    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return NextResponse.json(
        { success: false, message: "Rating must be a valid number between 1 and 5" },
        { status: 400 }
      );
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Tenancy: strictly only the customer who booked the ride can rate
    if (booking.user.toString() !== session.user.id.toString()) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Only the rider can rate this trip" },
        { status: 403 }
      );
    }

    // Lifecycle check: only completed rides can be rated
    if (booking.status !== "completed") {
      return NextResponse.json(
        { success: false, message: "Only completed rides can be rated" },
        { status: 400 }
      );
    }

    // Check if already rated
    if (booking.rating) {
      return NextResponse.json(
        { success: false, message: "This trip has already been rated" },
        { status: 400 }
      );
    }

    const existingRating = await Rating.findOne({ booking: booking._id });
    if (existingRating) {
      return NextResponse.json(
        { success: false, message: "This trip has already been rated" },
        { status: 400 }
      );
    }

    // 1. Create Rating document
    await Rating.create({
      booking: booking._id,
      rider: session.user.id,
      driver: booking.driver,
      rating: numericRating,
      feedback: typeof feedback === "string" ? feedback.trim() : "",
      tags: Array.isArray(tags) ? tags : [],
    });

    // 2. Update Booking with rating details
    booking.rating = numericRating;
    if (typeof feedback === "string") {
      booking.feedback = feedback.trim();
    }
    if (Array.isArray(tags)) {
      booking.ratingTags = tags;
    }
    booking.ratedAt = new Date();
    await booking.save();

    // 3. Update Driver rolling average rating and count
    let updatedDriverRating = 5.0;
    if (booking.driver) {
      const driver = await User.findById(booking.driver);
      if (driver) {
        const currentCount = driver.totalRatingsCount || 0;
        const currentRating = typeof driver.rating === "number" ? driver.rating : 5.0;
        const newCount = currentCount + 1;
        // Formula: (currentRating * currentCount + newRating) / newCount
        const rawNewRating = (currentRating * currentCount + numericRating) / newCount;
        updatedDriverRating = Math.round(rawNewRating * 10) / 10;

        driver.rating = updatedDriverRating;
        driver.totalRatingsCount = newCount;
        await driver.save();
      }
    }

    return NextResponse.json({
      success: true,
      message: "Thank you for rating your driver!",
      rating: numericRating,
      driverRating: updatedDriverRating,
    });
  } catch (error: any) {
    console.error("Error rating booking:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to submit rating" },
      { status: 500 }
    );
  }
}
