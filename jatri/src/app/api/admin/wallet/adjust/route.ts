import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import { executeAdminAdjustment } from "@/lib/walletLedger";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();

    if (!session || !session.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 403 });
    }

    const { targetUserId, amount, type, reason, notes } = await req.json();

    if (!targetUserId || !amount || !type || !reason) {
      return NextResponse.json(
        { error: "targetUserId, amount, type (credit|debit), and reason are required" },
        { status: 400 }
      );
    }

    if (type !== "credit" && type !== "debit") {
      return NextResponse.json(
        { error: "type must be either 'credit' or 'debit'" },
        { status: 400 }
      );
    }

    const result = await executeAdminAdjustment({
      adminId: session.user.id,
      targetUserId,
      amount,
      type,
      reason,
      notes,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully executed admin ${type} adjustment of ₹${result.amount}`,
      data: result,
    });
  } catch (error: any) {
    console.error("POST /api/admin/wallet/adjust error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to execute admin wallet adjustment" },
      { status: 400 }
    );
  }
}
