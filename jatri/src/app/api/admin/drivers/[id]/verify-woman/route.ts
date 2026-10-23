import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { emitSocketEvent } from "@/lib/socketServerEmit";
import { sendPushToUser } from "@/lib/webPush";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/drivers/[id]/verify-woman
 * Admin endpoint to approve, reject, or revoke woman-driver verification status.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden: Admin privileges required" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const { action, notes } = body;

    if (!["approve", "reject", "revoke"].includes(action)) {
      return NextResponse.json(
        { success: false, message: "Action must be 'approve', 'reject', or 'revoke'" },
        { status: 400 }
      );
    }

    await connectDb();

    const driver = await User.findById(id);
    if (!driver) {
      return NextResponse.json(
        { success: false, message: "Driver not found" },
        { status: 404 }
      );
    }

    const updateFields: any = {};

    if (action === "approve") {
      updateFields["safetyMatching.driverCategory"] = "woman";
      updateFields["safetyMatching.driverVerificationStatus"] = "verified";
      updateFields["safetyMatching.verifiedAt"] = new Date();
      if (notes) updateFields["safetyMatching.verificationNotes"] = notes;
    } else if (action === "reject") {
      updateFields["safetyMatching.driverVerificationStatus"] = "rejected";
      if (notes) updateFields["safetyMatching.verificationNotes"] = notes;
    } else if (action === "revoke") {
      updateFields["safetyMatching.driverVerificationStatus"] = "expired";
      updateFields["driverPassengerPolicy"] = "all_eligible"; // Reset policy to all_eligible on revocation
      if (notes) updateFields["safetyMatching.verificationNotes"] = notes;
    }

    const updatedDriver = await User.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    )
      .select("name safetyMatching driverPassengerPolicy")
      .lean();

    // Notify driver via real-time WebSocket & Web Push
    try {
      await emitSocketEvent({
        userId: id,
        event: "woman-driver-status-updated",
        data: {
          status: (updatedDriver as any)?.safetyMatching?.driverVerificationStatus,
          driverPassengerPolicy: (updatedDriver as any)?.driverPassengerPolicy,
          action,
        },
      });

      const pushTitle =
        action === "approve"
          ? "Woman Driver Verification Approved! 🌸"
          : action === "reject"
          ? "Woman Driver Application Update"
          : "Woman Driver Status Expired";

      const pushBody =
        action === "approve"
          ? "You are now verified for RideNow women's safety matching."
          : `Your woman-driver verification has been updated: ${action}.`;

      await sendPushToUser(id, {
        title: pushTitle,
        body: pushBody,
        url: "/partner",
        tag: `woman-verify-${id}`,
      });
    } catch (notifyErr) {
      console.warn("[admin:verify-woman] Notification error (continuing):", notifyErr);
    }

    return NextResponse.json({
      success: true,
      message: `Woman driver status successfully updated: ${action}`,
      driver: updatedDriver,
    });
  } catch (error: any) {
    console.error("[admin:verify-woman] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update driver verification" },
      { status: 500 }
    );
  }
}
