import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "@/models/user.model";
import connectDb from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import { rateLimiter, getClientIp, getRateLimitHeaders } from "@/lib/rateLimit";

/* ---------------- POST: REGISTER ---------------- */

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);

    // IP-level rate limiting: 5 registrations per 15 minutes
    const ipCheck = rateLimiter.check(`ip:${clientIp}:register`, 5, 15 * 60 * 1000);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        { message: "Too many registration attempts. Please try again later." },
        {
          status: 429,
          headers: getRateLimitHeaders(5, ipCheck.remaining, ipCheck.resetMs),
        }
      );
    }

    await connectDb();

    const body = await req.json();
    const { name, email, password } = body;

    /* ---------- VALIDATION ---------- */

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Email-level rate limiting: 3 attempts per 15 minutes
    const emailCheck = rateLimiter.check(`email:${email.toLowerCase().trim()}:register`, 3, 15 * 60 * 1000);
    if (!emailCheck.allowed) {
      return NextResponse.json(
        { message: "Too many attempts for this email address. Please try again later." },
        {
          status: 429,
          headers: getRateLimitHeaders(3, emailCheck.remaining, emailCheck.resetMs),
        }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    /* ---------- CHECK EXISTING USER ---------- */

    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser.isEmailVerified) {
      return NextResponse.json(
        { message: "User already exists. Please login." },
        { status: 409 }
      );
    }

    /* ---------- HASH PASSWORD ---------- */

    const hashedPassword = await bcrypt.hash(password, 10);

    /* ---------- GENERATE OTP ---------- */

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    /* ---------- CREATE / UPDATE USER ---------- */

    if (existingUser && !existingUser.isEmailVerified) {
      // Update OTP for unverified user
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.otp = otp;
      existingUser.otpExpiresAt = otpExpiresAt;

      await existingUser.save();
    } else {
      await User.create({
        name,
        email,
        password: hashedPassword,
        role: "user",
        isEmailVerified: false,
        otp,
        otpExpiresAt,
      });
    }

    /* ---------- SEND OTP  ---------- */

    let mailResult;
    try {
      mailResult = await sendMail(
        email,
        "Your OTP for Email Verification - RideNow",
        `
          <div style="font-family: Arial; padding: 20px;">
          <h2>Verify your email - RideNow</h2>
          <p>Your OTP code is:</p>
          <h1 style="letter-spacing: 3px;">${otp}</h1>
          <p>This code expires in 10 minutes.</p>
          <hr />
          <p>If you didn’t request this, ignore this email.</p>
         </div>
        `
      );
    } catch (mailErr) {
      console.warn("Mail dispatch error in register route:", mailErr);
    }

    const shouldReturnDevOtp =
      process.env.NODE_ENV !== "production" ||
      mailResult?.isSimulated ||
      !mailResult?.success;

    return NextResponse.json(
      {
        success: true,
        message: "OTP sent to email. Please verify.",
        devOtp: shouldReturnDevOtp ? otp : undefined,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("REGISTER ERROR:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
