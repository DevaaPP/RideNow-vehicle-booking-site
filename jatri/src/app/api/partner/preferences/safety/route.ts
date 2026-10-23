import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import Booking from "@/models/booking.model";
import { isDriverVerifiedWoman } from "@/lib/safetyMatching";

export const dynamic = "force-dynamic";

/**
 * GET /api/partner/preferences/safety
 * Retrieves driver's current passenger preference policy & verification status.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDb();
    const driver = await User.findById(session.user.id)
      .select("safetyMatching driverPassengerPolicy isOnline role")
      .lean();

    if (!driver) {
      return NextResponse.json(
        { success: false, message: "Driver account not found" },
        { status: 404 }
      );
    }

    const isVerifiedWoman = isDriverVerifiedWoman(driver);

    return NextResponse.json({
      success: true,
      driverPassengerPolicy: (driver as any).driverPassengerPolicy || "all_eligible",
      isVerifiedWoman,
      driverVerificationStatus: (driver as any).safetyMatching?.driverVerificationStatus || "not_submitted",
      driverCategory: (driver as any).safetyMatching?.driverCategory || "undisclosed",
      verifiedAt: (driver as any).safetyMatching?.verifiedAt || null,
      canActivateWomenOnly: isVerifiedWoman,
    });
  } catch (error: any) {
    console.error("[partner:preferences:safety:GET] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve safety preferences" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/partner/preferences/safety
 * Updates driver's passenger preference policy ("all_eligible" | "women_only").
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { driverPassengerPolicy } = body;

    if (!["all_eligible", "women_only"].includes(driverPassengerPolicy)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid driverPassengerPolicy. Must be 'all_eligible' or 'women_only'",
        },
        { status: 400 }
      );
    }

    await connectDb();

    const driver = await User.findById(session.user.id)
      .select("safetyMatching driverPassengerPolicy isOnline")
      .lean();

    if (!driver) {
      return NextResponse.json(
        { success: false, message: "Driver account not found" },
        { status: 404 }
      );
    }

    // Guard 1: Only approved/verified woman drivers can activate "women_only"
    const isVerifiedWoman = isDriverVerifiedWoman(driver);
    if (driverPassengerPolicy === "women_only" && !isVerifiedWoman) {
      return NextResponse.json(
        {
          success: false,
          message: "Only verified woman drivers can activate the Women Passengers Only setting. Please complete woman-driver verification first.",
          errorCode: "NOT_ELIGIBLE_FOR_WOMEN_ONLY",
        },
        { status: 403 }
      );
    }

    // Guard 2: Driver must not have an active ride in progress
    const activeRide = await Booking.findOne({
      driver: session.user.id,
      status: {
        $in: [
          "confirmed",
          "driver_assigned",
          "driver_arriving",
          "driver_arrived",
          "started",
          "ride_started",
          "ride_in_progress",
        ],
      },
    }).select("_id status").lean();

    if (activeRide) {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot change passenger preferences while a ride is in progress. Please complete or conclude your current ride first.",
          errorCode: "ACTIVE_RIDE_IN_PROGRESS",
        },
        { status: 409 }
      );
    }

    const updated = await User.findByIdAndUpdate(
      session.user.id,
      { $set: { driverPassengerPolicy } },
      { new: true }
    )
      .select("driverPassengerPolicy safetyMatching")
      .lean();

    return NextResponse.json({
      success: true,
      message: `Passenger preference updated to ${
        driverPassengerPolicy === "women_only" ? "Women Passengers Only" : "All Eligible Passengers"
      }`,
      driverPassengerPolicy: (updated as any)?.driverPassengerPolicy,
    });
  } catch (error: any) {
    console.error("[partner:preferences:safety:PUT] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update safety preferences" },
      { status: 500 }
    );
  }
}
