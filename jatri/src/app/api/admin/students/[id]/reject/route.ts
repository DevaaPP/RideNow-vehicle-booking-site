export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { auth } from "@/auth";
import User from "@/models/user.model";
import { emitSocketEvent } from "@/lib/socketServerEmit";
import { sendPushToUser } from "@/lib/webPush";
import logger from "@/lib/logger";

/**
 * POST /api/admin/students/[id]/reject
 * Rejects a student verification application with an administrative reason.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const session = await auth();

    if (!session?.user?.id || (session.user as any)?.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admin privileges required." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));
    const reason = body.reason?.trim() || "Documents could not be validated against official enrollment records.";

    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Student account not found." },
        { status: 404 }
      );
    }

    user.isStudent = false;
    user.studentVerification = {
      ...(user.studentVerification || {}),
      status: "rejected",
      rejectionReason: reason,
    };

    await user.save();

    // Realtime notification to student
    try {
      await emitSocketEvent({
        userId: user._id.toString(),
        event: "student-status-updated",
        data: {
          isStudent: false,
          status: "rejected",
          rejectionReason: reason,
        },
      });

      await sendPushToUser(user._id.toString(), {
        title: "Student Verification Update ⚠️",
        body: `Your student verification was not approved: ${reason}`,
        url: "/profile",
        tag: "student-pass-rejected",
      });
    } catch (notifyErr: any) {
      logger.warn("admin.student_reject_notify_error", {
        userId: user._id.toString(),
        error: notifyErr?.message,
      });
    }

    logger.info("admin.student_rejected", {
      adminId: session.user.id,
      studentId: user._id.toString(),
      reason,
    });

    return NextResponse.json({
      success: true,
      message: `Student verification rejected for ${user.name || "user"}.`,
      studentVerification: user.studentVerification,
    });
  } catch (error: any) {
    logger.error("admin.student_reject_error", {
      error: error?.message || String(error),
      stack: error?.stack,
    });
    return NextResponse.json(
      { success: false, message: "Failed to reject student verification", error: error.message },
      { status: 500 }
    );
  }
}
