import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import Vehicle from "@/models/vehicle.model";
import { recordAuditLog } from "@/lib/auditLogger";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDb();

    const vehicleId = (await context.params).id;
    const { reason } = await req.json();

    if (!reason) {
      return NextResponse.json(
        { message: "Rejection reason required" },
        { status: 400 }
      );
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return NextResponse.json({ message: "Vehicle not found" }, { status: 404 });
    }

    const beforeState = {
      status: vehicle.status,
      rejectionReason: vehicle.rejectionReason,
    };

    vehicle.status = "rejected";
    vehicle.rejectionReason = reason;
    await vehicle.save();

    await recordAuditLog({
      adminId: session.user.id,
      adminEmail: session.user.email || undefined,
      action: "REJECT_VEHICLE",
      targetId: vehicleId,
      targetType: "VEHICLE",
      reason,
      beforeState,
      afterState: {
        status: "rejected",
        rejectionReason: reason,
      },
      metadata: {
        owner: String(vehicle.owner),
        number: vehicle.number,
        type: vehicle.type,
        vehicleModel: vehicle.vehicleModel,
      },
      req,
    });

    return NextResponse.json({
      message: "Vehicle pricing rejected",
    });
  } catch (error) {
    console.error("VEHICLE REJECT ERROR:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
