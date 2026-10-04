import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import SafetyIncident from "@/models/safetyIncident.model";
import { resolveSafetyIncident } from "@/lib/safetyEngine";

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));

    const query: any = {};
    if (status && ["active", "investigating", "resolved", "false_alarm"].includes(status)) {
      query.status = status;
    }
    if (severity && ["low", "medium", "high", "critical"].includes(severity)) {
      query.severity = severity;
    }

    const incidents = await SafetyIncident.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate({
        path: "booking",
        select: "pickupAddress dropAddress fare vehicle status isPanicActive",
      })
      .populate({
        path: "reporter",
        select: "name email phone role",
      })
      .populate({
        path: "resolvedBy",
        select: "name email",
      })
      .lean();

    const counts = {
      active: await SafetyIncident.countDocuments({ status: "active" }),
      investigating: await SafetyIncident.countDocuments({ status: "investigating" }),
      critical: await SafetyIncident.countDocuments({ severity: "critical", status: "active" }),
      resolved: await SafetyIncident.countDocuments({ status: "resolved" }),
    };

    return NextResponse.json({
      success: true,
      incidents,
      counts,
    });
  } catch (error: any) {
    console.error("GET /api/admin/safety/incidents error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch safety incidents" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 403 });
    }

    const { incidentId, status, resolutionNotes } = await req.json();

    if (!incidentId || !status || !resolutionNotes) {
      return NextResponse.json(
        { error: "incidentId, status ('resolved' | 'false_alarm'), and resolutionNotes are required" },
        { status: 400 }
      );
    }

    if (status !== "resolved" && status !== "false_alarm") {
      return NextResponse.json(
        { error: "status must be either 'resolved' or 'false_alarm'" },
        { status: 400 }
      );
    }

    const result = await resolveSafetyIncident({
      incidentId,
      adminId: session.user.id,
      resolutionStatus: status,
      resolutionNotes,
    });

    return NextResponse.json({
      success: true,
      message: `Safety incident marked as ${status}.`,
      incident: result.incident,
    });
  } catch (error: any) {
    console.error("POST /api/admin/safety/incidents error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to resolve safety incident" },
      { status: 400 }
    );
  }
}
