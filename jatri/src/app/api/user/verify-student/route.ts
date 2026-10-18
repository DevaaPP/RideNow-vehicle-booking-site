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
    console.error("GET STUDENT STATUS ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch student status", error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/verify-student
 * Multi-level student verification:
 * 1. Institutional Email (Level 1)
 * 2. Student ID (Level 2)
 * 3. Enrollment Document (Level 3)
 * Grants 12-month (365 days) verified status with abuse prevention.
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

    const body = await req.json();
    const {
      method = "institutional_email",
      institutionName,
      eduEmail,
      studentName,
      studentIdNumber,
      documentType,
      academicYear,
    } = body;

    const trimmedInstitution = (institutionName || "").trim();
    if (!trimmedInstitution) {
      return NextResponse.json(
        { success: false, message: "Please enter your college or university name." },
        { status: 400 }
      );
    }

    // Abuse prevention: ensure 1 verified student identity per RideNow account
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

      // Check if this institutional email is already claimed by another active user
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

      // If client requests activation OTP dispatch
      if (body.action === "send_otp") {
        const otpCode = generateSecureOtp(6);
        const hashedOtp = await hashOtpCode(otpCode);
        const userDoc = await User.findById(session.user.id);
        if (!userDoc) {
          return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
        }

        userDoc.studentVerification = {
          ...(userDoc.studentVerification || {}),
          status: "pending",
          institutionName: trimmedInstitution,
          verificationMethod: "institutional_email",
          eduEmail: cleanEduEmail,
          studentName: studentName?.trim() || userDoc.name,
          activationOtp: hashedOtp,
          activationOtpExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
          activationOtpFailedAttempts: 0,
        };
        await userDoc.save();

        // Dispatch Email with Resend / Dev simulator
        await sendMail(
          cleanEduEmail,
          "RideNow Student Pass Verification Code",
          `<div style="font-family:sans-serif;padding:24px;background:#f9fafb;border-radius:16px;">
            <h2 style="color:#111827;margin-bottom:8px;">RideNow Student Verification</h2>
            <p style="color:#4b5563;font-size:14px;">Use the following 6-digit confirmation code to activate your 10% student discount for <strong>${trimmedInstitution}</strong>:</p>
            <div style="margin:24px 0;text-align:center;">
              <span style="display:inline-block;padding:12px 28px;background:#10b981;color:#ffffff;font-size:28px;font-weight:900;letter-spacing:6px;border-radius:12px;">${otpCode}</span>
            </div>
            <p style="color:#6b7280;font-size:12px;">This code is valid for 15 minutes. If you did not request this, you can safely ignore this email.</p>
          </div>`
        );

        return NextResponse.json({
          success: true,
          requiresOtp: true,
          message: `Verification code sent to ${cleanEduEmail}. Please enter the 6-digit code.`,
        });
      }

      // If client provides OTP for activation
      if (body.action === "verify_otp" || body.otp) {
        const submittedOtp = String(body.otp || "").trim();
        const userDoc = await User.findById(session.user.id);
        if (!userDoc || !userDoc.studentVerification?.activationOtp) {
          return NextResponse.json(
            { success: false, message: "No active verification code found. Please request a new code." },
            { status: 400 }
          );
        }

        if (
          userDoc.studentVerification.activationOtpExpiresAt &&
          new Date(userDoc.studentVerification.activationOtpExpiresAt) < new Date()
        ) {
          return NextResponse.json(
            { success: false, message: "Verification code expired. Please request a new one." },
            { status: 400 }
          );
        }

        const isMatch = await verifyOtpCode(
          submittedOtp,
          userDoc.studentVerification.activationOtp
        );

        if (!isMatch) {
          const attempts = (userDoc.studentVerification.activationOtpFailedAttempts || 0) + 1;
          userDoc.studentVerification.activationOtpFailedAttempts = attempts;
          await userDoc.save();
          const remaining = Math.max(0, 3 - attempts);
          return NextResponse.json(
            {
              success: false,
              message: remaining > 0
                ? `Invalid verification code. ${remaining} attempt(s) remaining.`
                : "Too many failed attempts. Please request a fresh code.",
            },
            { status: 400 }
          );
        }
      }
    } else if (method === "student_id") {
      if (!studentName?.trim() || !studentIdNumber?.trim()) {
        return NextResponse.json(
          { success: false, message: "Student name and Student ID / Roll number are required." },
          { status: 400 }
        );
      }

      // Check if this student ID at this institution is already active on another account
      const cleanStudentId = studentIdNumber.trim().toUpperCase();
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
    } else if (method === "enrollment_document") {
      if (!studentName?.trim() || !documentType?.trim()) {
        return NextResponse.json(
          { success: false, message: "Student name and document type are required." },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid verification method selected." },
        { status: 400 }
      );
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const verifiedAt = new Date();
    // 12 months (365 days) verified lifecycle
    const expiresAt = new Date(verifiedAt.getTime() + 365 * 24 * 60 * 60 * 1000);
    const verificationReference = `RN-STU-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    user.isStudent = true;
    user.studentVerification = {
      status: "verified",
      institutionName: trimmedInstitution,
      verificationMethod: method,
      studentName: studentName?.trim() || user.name,
      studentIdNumber: studentIdNumber?.trim()?.toUpperCase(),
      eduEmail: eduEmail ? eduEmail.toLowerCase().trim() : undefined,
      documentType: documentType?.trim(),
      academicYear: academicYear?.trim() || "Current Academic Year",
      verifiedAt,
      expiresAt,
      verificationReference,
    };

    user.studentDetails = {
      eduEmail: user.studentVerification.eduEmail,
      institution: trimmedInstitution,
      verifiedAt,
      expiresAt,
    };

    await user.save();

    return NextResponse.json({
      success: true,
      message: "✓ Student Status VERIFIED! 10% discount (up to ₹50 per eligible ride) is now active for 12 months.",
      isStudent: true,
      verification: user.studentVerification,
    });
  } catch (error: any) {
    console.error("VERIFY STUDENT ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to verify student status", error: error.message },
      { status: 500 }
    );
  }
}
