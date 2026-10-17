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

    const isRider = booking.user?.toString() === session.user.id.toString();
    const isDriver = booking.driver && booking.driver.toString() === session.user.id.toString();

    // Tenancy: only the customer or the assigned driver can submit ratings
    if (!isRider && !isDriver) {
      return NextResponse.json(
        { success: false, message: "Forbidden: You are not authorized to rate this trip" },
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

    if (isRider) {
      // Check if rider already rated driver
      if (booking.rating) {
        return NextResponse.json(
          { success: false, message: "You have already rated this driver" },
          { status: 400 }
        );
      }

      // 1. Create or update Rating document for driver
      await Rating.findOneAndUpdate(
        { booking: booking._id, rider: session.user.id },
        {
          booking: booking._id,
          rider: session.user.id,
          driver: booking.driver,
          rating: numericRating,
          feedback: typeof feedback === "string" ? feedback.trim() : "",
          tags: Array.isArray(tags) ? tags : [],
        },
        { upsert: true, new: true }
      );

      // 2. Update Booking with driver rating
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
    } else {
      // Driver is rating the customer / passenger
      if (booking.customerRating) {
        return NextResponse.json(
          { success: false, message: "You have already rated this passenger" },
          { status: 400 }
        );
      }

      booking.customerRating = numericRating;
      if (typeof feedback === "string") {
        booking.customerFeedback = feedback.trim();
      }
      booking.customerRatedAt = new Date();
      await booking.save();

      // Update Passenger rolling average rating and count
      let updatedCustomerRating = 5.0;
      if (booking.user) {
        const customer = await User.findById(booking.user);
        if (customer) {
          const currentCount = customer.totalRatingsCount || 0;
          const currentRating = typeof customer.rating === "number" ? customer.rating : 5.0;
          const newCount = currentCount + 1;
          const rawNewRating = (currentRating * currentCount + numericRating) / newCount;
          updatedCustomerRating = Math.round(rawNewRating * 10) / 10;

          customer.rating = updatedCustomerRating;
          customer.totalRatingsCount = newCount;
          await customer.save();
        }
      }

      return NextResponse.json({
        success: true,
        message: "Thank you for rating your passenger!",
        rating: numericRating,
        customerRating: updatedCustomerRating,
      });
    }
  } catch (error: any) {
    console.error("Error rating booking:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to submit rating" },
      { status: 500 }
    );
  }
}
