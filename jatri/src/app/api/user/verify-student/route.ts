export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { auth } from "@/auth";
import User from "@/models/user.model";
import StudentConfig from "@/models/studentConfig.model";

import { validateStudentEmail } from "@/lib/studentVerification";
import { generateSecureOtp, hashOtpCode, verifyOtpCode } from "@/lib/cryptoOtp";
import { sendMail } from "@/lib/mailer";
import logger from "@/lib/logger";

/**
 * GET /api/user/verify-student
 * Returns current verified student status, validity lifecycle, days remaining, and active rules.
 */
export async function GET() {
  try {
    await connectDb();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await User.findById(session.user.id).select(
      "isStudent studentVerification studentDetails"
    );
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Dynamic config or defaults
    const config = (await StudentConfig.findOne({ isActive: true })) || {
      discountPercentage: 10,
      maxDiscountCap: 50,
      minFare: 100,
      validityMonths: 12,
      eligibleVehicleTypes: ["bike", "auto", "car"],
      allowStackingWithPromo: false,
    };

    let status = user.studentVerification?.status || (user.isStudent ? "verified" : "not_verified");
    const expiresAt = user.studentVerification?.expiresAt || user.studentDetails?.expiresAt;
    const now = new Date();

    // Lifecycle audit: check if 12-month period has expired
    if (status === "verified" && expiresAt && new Date(expiresAt).getTime() < now.getTime()) {
      status = "expired";
      user.isStudent = false;
      if (user.studentVerification) {
        user.studentVerification.status = "expired";
      }
      await user.save();
    }

    let daysRemaining = 0;
    if (status === "verified" && expiresAt) {
      const diffMs = new Date(expiresAt).getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    const canReverify = status === "expired" || (status === "verified" && daysRemaining <= 30);

    return NextResponse.json({
      success: true,
      isStudent: status === "verified",
      status,
      verification: user.studentVerification || {
        status,
        institutionName: user.studentDetails?.institution,
        eduEmail: user.studentDetails?.eduEmail,
        verifiedAt: user.studentDetails?.verifiedAt,
        expiresAt,
      },
      daysRemaining,
      canReverify,
      config: {
        discountPercentage: config.discountPercentage,
        maxDiscountCap: config.maxDiscountCap,
        minFare: config.minFare,
        validityMonths: config.validityMonths,
        eligibleVehicleTypes: config.eligibleVehicleTypes,
        allowStackingWithPromo: config.allowStackingWithPromo,
      },
    });
  } catch (error: any) {
    logger.error("student.status_fetch_error", {
      error: error?.message || String(error),
      stack: error?.stack,
    });
    return NextResponse.json(
      { success: false, message: "Failed to fetch student status", error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/verify-student
 * Multi-level student verification:
 * 1. Institutional Email (Instant activation after 6-digit email OTP verification)
 * 2. Student ID (Enters 'pending' state; requires administrative review)
 * 3. Enrollment Document (Enters 'pending' state; requires administrative review)
 */
export async function POST(req: Request) {
  try {
    await connectDb();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userDoc = await User.findById(session.user.id);
    if (!userDoc) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const {
      method = "institutional_email",
      action,
      otp,
      institutionName,
      eduEmail,
      studentName,
      studentIdNumber,
      documentType,
      documentUrl,
      academicYear,
    } = body;

    const trimmedInstitution = (institutionName || "").trim();
    if (!trimmedInstitution) {
      return NextResponse.json(
        { success: false, message: "Please enter your college or university name." },
        { status: 400 }
      );
    }

    // ── METHOD 1: INSTITUTIONAL EMAIL (Requires Verified OTP) ────────────────
    if (method === "institutional_email") {
      const cleanEduEmail = (eduEmail || "").toLowerCase().trim();
      if (!cleanEduEmail) {
        return NextResponse.json(
          { success: false, message: "Please provide a valid institutional email address." },
          { status: 400 }
        );
      }

      const emailValidation = validateStudentEmail(cleanEduEmail);
      if (!emailValidation.isValid) {
        return NextResponse.json(
          {
            success: false,
            message:
              emailValidation.reason ||
              "Invalid educational domain. Email must end with .edu, .ac.in, .edu.in, .res.in, or an accredited university domain.",
          },
          { status: 400 }
        );
      }

      // Check if this institutional email is already claimed by another active verified student
      const existing = await User.findOne({
        _id: { $ne: session.user.id },
        isStudent: true,
        $or: [
          { "studentVerification.eduEmail": cleanEduEmail },
          { "studentDetails.eduEmail": cleanEduEmail },
        ],
      });

      if (existing) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This institutional email is already linked to another RideNow account. Each verified student identity may only be attached to one account.",
          },
          { status: 400 }
        );
      }

      // Action A: Request/Send OTP
      if (action === "send_otp") {
        // Rate-limit resend: minimum 60 seconds
        const lastSent = userDoc.studentVerification?.activationOtpSentAt;
        if (lastSent && Date.now() - new Date(lastSent).getTime() < 60 * 1000) {
          const waitSec = Math.ceil((60 * 1000 - (Date.now() - new Date(lastSent).getTime())) / 1000);
          return NextResponse.json(
            {
              success: false,
              message: `Please wait ${waitSec}s before requesting a new verification code.`,
            },
            { status: 429 }
          );
        }

        const otpCode = generateSecureOtp(6);
        const hashedOtp = await hashOtpCode(otpCode);

        userDoc.studentVerification = {
          ...(userDoc.studentVerification || {}),
          status: "pending",
          institutionName: trimmedInstitution,
          verificationMethod: "institutional_email",
          eduEmail: cleanEduEmail,
          studentName: studentName?.trim() || userDoc.name,
          activationOtp: hashedOtp,
          activationOtpExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
          activationOtpSentAt: new Date(),
          activationOtpFailedAttempts: 0,
        };
        await userDoc.save();

        // Dispatch Email with Resend / mailer
        await sendMail(
          cleanEduEmail,
          "RideNow Student Pass Verification Code",
          `<div style="font-family:sans-serif;padding:24px;background:#f9fafb;border-radius:16px;">
            <h2 style="color:#111827;margin-bottom:8px;">RideNow Student Verification</h2>
            <p style="color:#4b5563;font-size:14px;">Use the following 6-digit confirmation code to activate your 10% student discount for <strong>${trimmedInstitution}</strong>:</p>
            <div style="margin:24px 0;text-align:center;">
              <span style="display:inline-block;padding:12px 28px;background:#046A38;color:#ffffff;font-size:28px;font-weight:900;letter-spacing:6px;border-radius:12px;">${otpCode}</span>
            </div>
            <p style="color:#6b7280;font-size:12px;">This code is valid for 15 minutes. If you did not request this, you can safely ignore this email.</p>
          </div>`
        );

        logger.info("student.email_otp_sent", {
          userId: userDoc._id.toString(),
          eduEmail: cleanEduEmail,
        });

        return NextResponse.json({
          success: true,
          requiresOtp: true,
          message: `Verification code sent to ${cleanEduEmail}. Please enter the 6-digit code.`,
        });
      }

      // Action B: Verify OTP Code
      if (action === "verify_otp" || otp) {
        const submittedOtp = String(otp || "").trim();
        if (!submittedOtp) {
          return NextResponse.json(
            { success: false, message: "Please enter the 6-digit verification code." },
            { status: 400 }
          );
        }

        if (!userDoc.studentVerification?.activationOtp) {
          return NextResponse.json(
            { success: false, message: "No active verification code found. Please request a new code.", requiresOtp: true },
            { status: 400 }
          );
        }

        // Hard lockout check (max 5 failed attempts)
        const currentFailedAttempts = userDoc.studentVerification.activationOtpFailedAttempts || 0;
        if (currentFailedAttempts >= 5) {
          return NextResponse.json(
            {
              success: false,
              message: "Too many failed attempts. For your security, this verification code has been invalidated. Please request a new code.",
              requiresOtp: true,
            },
            { status: 429 }
          );
        }

        if (
          userDoc.studentVerification.activationOtpExpiresAt &&
          new Date(userDoc.studentVerification.activationOtpExpiresAt) < new Date()
        ) {
          return NextResponse.json(
            { success: false, message: "Verification code expired. Please request a new code.", requiresOtp: true },
            { status: 400 }
          );
        }

        const isMatch = await verifyOtpCode(
          submittedOtp,
          userDoc.studentVerification.activationOtp
        );

        if (!isMatch) {
          const attempts = currentFailedAttempts + 1;
          userDoc.studentVerification.activationOtpFailedAttempts = attempts;
          await userDoc.save();
          const remaining = Math.max(0, 5 - attempts);
          return NextResponse.json(
            {
              success: false,
              message: remaining > 0
                ? `Invalid verification code. ${remaining} attempt(s) remaining.`
                : "Too many failed attempts. Please request a fresh code.",
              requiresOtp: true,
            },
            { status: 400 }
          );
        }

        // OTP Match: Authoritatively grant 12-month verified student status
        const verifiedAt = new Date();
        const expiresAt = new Date(verifiedAt.getTime() + 365 * 24 * 60 * 60 * 1000);
        const verificationReference = `RN-STU-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        userDoc.isStudent = true;
        userDoc.studentVerification = {
          status: "verified",
          institutionName: trimmedInstitution,
          verificationMethod: "institutional_email",
          studentName: studentName?.trim() || userDoc.name,
          eduEmail: cleanEduEmail,
          verifiedAt,
          expiresAt,
          verificationReference,
          activationOtp: undefined,
          activationOtpExpiresAt: undefined,
          activationOtpSentAt: undefined,
          activationOtpFailedAttempts: 0,
        };

        userDoc.studentDetails = {
          eduEmail: cleanEduEmail,
          institution: trimmedInstitution,
          verifiedAt,
          expiresAt,
        };

        await userDoc.save();

        logger.info("student.verified_via_email", {
          userId: userDoc._id.toString(),
          eduEmail: cleanEduEmail,
          institution: trimmedInstitution,
        });

        return NextResponse.json({
          success: true,
          message: "✓ Student Status VERIFIED! 10% discount is now active on your account for 12 months.",
          isStudent: true,
          status: "verified",
          verification: userDoc.studentVerification,
        });
      }

      // ── CRITICAL BYPASS FIX: Reject request if action and OTP are omitted ──
      return NextResponse.json(
        {
          success: false,
          requiresOtp: true,
          message: "Institutional email requires OTP verification. Please request a verification code.",
        },
        { status: 400 }
      );
    }

    // ── METHOD 2: STUDENT ID / ROLL NUMBER (Enters Pending Administrative Review) ──
    if (method === "student_id") {
      if (!studentName?.trim() || !studentIdNumber?.trim()) {
        return NextResponse.json(
          { success: false, message: "Student name and Student ID / Roll number are required." },
          { status: 400 }
        );
      }

      const cleanStudentId = studentIdNumber.trim().toUpperCase();

      // Check if this student ID at this institution is already claimed on another account
      const existing = await User.findOne({
        _id: { $ne: session.user.id },
        isStudent: true,
        "studentVerification.studentIdNumber": cleanStudentId,
        "studentVerification.institutionName": trimmedInstitution,
      });

      if (existing) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This Student ID is already linked to an active account. Please contact support if you believe this is an error.",
          },
          { status: 400 }
        );
      }

      // DO NOT activate student status automatically. Enters pending administrative review.
      userDoc.isStudent = false;
      userDoc.studentVerification = {
        status: "pending",
        institutionName: trimmedInstitution,
        verificationMethod: "student_id",
        studentName: studentName.trim(),
        studentIdNumber: cleanStudentId,
        documentUrl: documentUrl?.trim() || undefined,
        academicYear: academicYear?.trim() || "Current Academic Year",
        submittedAt: new Date(),
      };

      await userDoc.save();

      logger.info("student.application_submitted", {
        userId: userDoc._id.toString(),
        method: "student_id",
        institution: trimmedInstitution,
      });

      return NextResponse.json({
        success: true,
        isStudent: false,
        status: "pending",
        message: "Your Student ID has been submitted for review. An administrator will verify your enrollment within 24-48 hours.",
        verification: userDoc.studentVerification,
      });
    }

    // ── METHOD 3: ENROLLMENT DOCUMENT (Enters Pending Administrative Review) ──
    if (method === "enrollment_document") {
      if (!studentName?.trim() || !documentType?.trim()) {
        return NextResponse.json(
          { success: false, message: "Student name and document type are required." },
          { status: 400 }
        );
      }

      // DO NOT activate student status automatically. Enters pending administrative review.
      userDoc.isStudent = false;
      userDoc.studentVerification = {
        status: "pending",
        institutionName: trimmedInstitution,
        verificationMethod: "enrollment_document",
        studentName: studentName.trim(),
        documentType: documentType.trim(),
        documentUrl: documentUrl?.trim() || undefined,
        academicYear: academicYear?.trim() || "Current Academic Year",
        submittedAt: new Date(),
      };

      await userDoc.save();

      logger.info("student.application_submitted", {
        userId: userDoc._id.toString(),
        method: "enrollment_document",
        institution: trimmedInstitution,
      });

      return NextResponse.json({
        success: true,
        isStudent: false,
        status: "pending",
        message: "Your enrollment documents have been submitted for review. An administrator will verify your credentials within 24-48 hours.",
        verification: userDoc.studentVerification,
      });
    }

    return NextResponse.json(
      { success: false, message: "Invalid verification method selected." },
      { status: 400 }
    );
  } catch (error: any) {
    logger.error("student.verify_post_error", {
      error: error?.message || String(error),
      stack: error?.stack,
    });
    return NextResponse.json(
      { success: false, message: "Failed to submit student verification", error: error.message },
      { status: 500 }
    );
  }
}
