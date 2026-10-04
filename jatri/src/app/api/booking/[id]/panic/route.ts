import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import { triggerEmergencySos } from "@/lib/safetyEngine";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const session = await auth();
    const id = (await context.params).id;

    const body = await req.json().catch(() => ({}));
    const reason = body.reason || "Emergency SOS Panic button pressed";
    const coordinates = Array.isArray(body.coordinates) ? body.coordinates : undefined;

    const reporterRole =
      session?.user?.role === "vendor" || session?.user?.role === "driver"
        ? "driver"
        : session?.user?.role === "admin"
        ? "admin"
        : "user";

    const result = await triggerEmergencySos({
      bookingId: id,
      reporterId: session?.user?.id || id,
      reporterRole,
      coordinates,
      reason,
    });

    return NextResponse.json({
      success: true,
      isPanicActive: true,
      incidentId: result.incidentId,
      shareUrl: result.shareUrl,
      emergencyContactsAlerted: result.emergencyContactsAlerted,
    });
  } catch (error: any) {
    console.error("POST /api/booking/[id]/panic error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to trigger emergency SOS" },
      { status: 500 }
    );
  }
}
