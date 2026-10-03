import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { requestDriverWithdrawal } from "@/lib/walletLedger";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();

    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount, idempotencyKey } = await req.json();
    const withdrawAmount = Math.round(Number(amount));

    if (!withdrawAmount || isNaN(withdrawAmount) || withdrawAmount < 100) {
      return NextResponse.json(
        { error: "Minimum withdrawal amount is ₹100" },
        { status: 400 }
      );
    }

    const driver = await User.findById(session.user.id);
    if (!driver || driver.role !== "vendor") {
      return NextResponse.json(
        { error: "Driver account not found or unauthorized" },
        { status: 403 }
      );
    }

    const result = await requestDriverWithdrawal({
      driverId: driver._id,
      amount: withdrawAmount,
      idempotencyKey,
    });

    return NextResponse.json({
      success: true,
      message: `₹${withdrawAmount.toLocaleString("en-IN")} payout requested. Transfer is currently pending processing.`,
      withdrawal: result.withdrawal,
      newBalance: result.newBalance,
      isDuplicate: result.isDuplicate,
    });
  } catch (error: any) {
    console.error("POST /api/partner/wallet/withdraw error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process withdrawal" },
      { status: 400 }
    );
  }
}
