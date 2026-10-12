import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { auth } from "@/auth";

import User from "@/models/user.model";
import VehicleDocument from "@/models/vehicleDocument.model";
import { recordAuditLog } from "@/lib/auditLogger";

export async function POST(
  req: NextRequest,
   context:{params: Promise<{ id: string; }> }
) {
  try {
    await connectDb();

    /* ---------- AUTH ---------- */
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const vendorId = (await context.params).id;
    const { reason } = await req.json();

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { message: "Rejection reason required" },
        { status: 400 }
      );
    }

    /* ---------- USER ---------- */
    const user = await User.findById(vendorId);
    if (!user || user.role !== "vendor") {
      return NextResponse.json(
        { message: "Vendor not found" },
        { status: 404 }
      );
    }

    const beforeState = {
      vendorStatus: user.vendorStatus,
      vendorRejectionReason: user.vendorRejectionReason,
    };

    /* ---------- UPDATE STATUS ---------- */
    user.vendorStatus = "rejected";
    user.vendorRejectionReason = reason;
    user.vendorRejectedAt = new Date(); // optional
    await user.save();

    /* ---------- OPTIONAL: MARK DOCS ---------- */
    await VehicleDocument.findOneAndUpdate(
      { owner: vendorId },
      {
        status: "rejected",
        rejectionReason: reason,
      }
    );

    await recordAuditLog({
      adminId: session.user.id || (session.user as any)._id,
      adminEmail: session.user.email || undefined,
      action: "REJECT_VENDOR",
      targetId: vendorId,
      targetType: "VENDOR",
      reason,
      beforeState,
      afterState: {
        vendorStatus: "rejected",
        vendorRejectionReason: reason,
      },
      metadata: {
        vendorName: user.name,
        vendorPhone: user.phone,
        vendorEmail: user.email,
      },
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Vendor rejected successfully",
    });
  } catch (error) {
    console.error("REJECT VENDOR ERROR:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
