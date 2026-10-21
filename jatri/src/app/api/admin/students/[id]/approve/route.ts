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
 * POST /api/admin/students/[id]/approve
 * Authoritatively approves a pending student verification application.
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
    const user = await User.findById(id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Student account not found." },
        { status: 404 }
      );
    }

    const verifiedAt = new Date();
    const expiresAt = new Date(verifiedAt.getTime() + 365 * 24 * 60 * 60 * 1000); // 12 months
    const verificationReference = `RN-STU-ADM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    user.isStudent = true;
    user.studentVerification = {
      ...(user.studentVerification || {}),
      status: "verified",
      verifiedAt,
      expiresAt,
      verificationReference,
      rejectionReason: undefined,
    };

    user.studentDetails = {
      eduEmail: user.studentVerification.eduEmail,
      institution: user.studentVerification.institutionName,
      verifiedAt,
      expiresAt,
    };

    await user.save();

    // Realtime notification to student
    try {
      await emitSocketEvent({
        userId: user._id.toString(),
        event: "student-status-updated",
        data: {
          isStudent: true,
          status: "verified",
          expiresAt,
        },
      });

      await sendPushToUser(user._id.toString(), {
        title: "Student Pass Approved! 🎓",
        body: "Your student status has been verified. 10% discount is now active on your eligible rides!",
        url: "/profile",
        tag: "student-pass-approved",
      });
    } catch (notifyErr: any) {
      logger.warn("admin.student_approve_notify_error", {
        userId: user._id.toString(),
        error: notifyErr?.message,
      });
    }

    logger.info("admin.student_approved", {
      adminId: session.user.id,
      studentId: user._id.toString(),
      institution: user.studentVerification?.institutionName,
    });

    return NextResponse.json({
      success: true,
      message: `Student verification approved for ${user.name || "user"}.`,
      studentVerification: user.studentVerification,
    });
  } catch (error: any) {
    logger.error("admin.student_approve_error", {
      error: error?.message || String(error),
      stack: error?.stack,
    });
    return NextResponse.json(
      { success: false, message: "Failed to approve student verification", error: error.message },
      { status: 500 }
    );
  }
}
