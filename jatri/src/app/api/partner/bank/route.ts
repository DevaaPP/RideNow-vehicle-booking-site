export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import PartnerBank from "@/models/partnerBank.model";
import {
  validateIfsc,
  validateBankAccount,
  validateUpiId,
  validateMobileNumber,
} from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Please sign in as a driver partner" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { name, account, ifsc, upi, mobileNumber } = body;

    // 1. Account holder name validation
    const trimmedName = typeof name === "string" ? name.trim() : "";
    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 70) {
      return NextResponse.json(
        { success: false, message: "Account holder name must be between 2 and 70 characters" },
        { status: 400 }
      );
    }

    // 2. Account number validation
    const accountCheck = validateBankAccount(account);
    if (!accountCheck.isValid) {
      return NextResponse.json(
        { success: false, message: accountCheck.error || "Invalid bank account number" },
        { status: 400 }
      );
    }

    // 3. IFSC code validation
    const ifscCheck = validateIfsc(ifsc);
    if (!ifscCheck.isValid) {
      return NextResponse.json(
        { success: false, message: ifscCheck.error || "Invalid IFSC code" },
        { status: 400 }
      );
    }

    // 4. UPI handle validation (optional)
    const upiCheck = validateUpiId(upi);
    if (!upiCheck.isValid) {
      return NextResponse.json(
        { success: false, message: upiCheck.error || "Invalid UPI ID" },
        { status: 400 }
      );
    }

    // 5. Mobile number validation (optional)
    const mobileCheck = validateMobileNumber(mobileNumber);
    if (!mobileCheck.isValid) {
      return NextResponse.json(
        { success: false, message: mobileCheck.error || "Invalid mobile number" },
        { status: 400 }
      );
    }

    await connectDb();

    // 🔁 UPSERT bank details with normalized values
    await PartnerBank.findOneAndUpdate(
      { owner: session.user.id },
      {
        accountHolderName: trimmedName,
        accountNumber: accountCheck.normalized,
        ifsc: ifscCheck.normalized,
        upi: upiCheck.normalized || undefined,
        status: "details_added",
      },
      { upsert: true, new: true }
    );

    // 🔥 UPDATE USER STEP AND MOBILE NUMBER
    const updateData: any = {
      vendorOnboardingStep: 3,
      vendorStatus: "pending",
    };

    if (mobileCheck.normalized) {
      updateData.mobileNumber = mobileCheck.normalized;
    }

    await User.findByIdAndUpdate(session.user.id, updateData);

    return NextResponse.json({
      success: true,
      message: "Bank details saved and verified successfully",
    });
  } catch (error: any) {
    console.error("[partner/bank] Error saving bank details:", error);
    return NextResponse.json(
      { success: false, message: "Server error occurred while saving bank details" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDb();

    const bank = await PartnerBank.findOne({
      owner: session.user.id,
    }).lean();

    return NextResponse.json({ success: true, bank });
  } catch (error: any) {
    console.error("[partner/bank] Error fetching bank details:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve bank details" },
      { status: 500 }
    );
  }
}
