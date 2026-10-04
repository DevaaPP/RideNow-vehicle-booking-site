import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import { submitSafetyReport } from "@/lib/safetyEngine";
import Booking from "@/models/booking.model";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId, type, severity, description, coordinates } = await req.json();

    if (!bookingId || !type || !description) {
      return NextResponse.json(
        { error: "bookingId, type, and description are required" },
        { status: 400 }
      );
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const isDriver = booking.driver?.toString() === session.user.id;
    const isRider = booking.user?.toString() === session.user.id;
    const isAdmin = session.user.role === "admin";

    if (!isDriver && !isRider && !isAdmin) {
      return NextResponse.json(
        { error: "You are not authorized to file a safety incident for this ride" },
        { status: 403 }
      );
    }

    const reporterRole = isDriver ? "driver" : isAdmin ? "admin" : "user";

    const incident = await submitSafetyReport({
      bookingId,
      reporterId: session.user.id,
      reporterRole,
      type,
      severity: severity || "medium",
      description,
      coordinates,
    });

    return NextResponse.json({
      success: true,
      message: "Safety incident reported successfully. Our Trust & Safety team is reviewing.",
      incidentId: incident.incidentId,
      incident,
    });
  } catch (error: any) {
    console.error("POST /api/safety/incident error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to submit safety incident" },
      { status: 500 }
    );
  }
}
