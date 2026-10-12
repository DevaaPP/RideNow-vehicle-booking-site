import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import { executeAdminAdjustment } from "@/lib/walletLedger";
import { recordAuditLog } from "@/lib/auditLogger";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();

    if (!session || !session.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized admin access" }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { targetUserId, amount, type, reason, notes } = body;

    const idempotencyKey =
      req.headers.get("x-idempotency-key") ||
      req.headers.get("idempotency-key") ||
      body.idempotencyKey;

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
      idempotencyKey,
    });

    if (!(result as any).isIdempotentReplay) {
      await recordAuditLog({
        adminId: session.user.id,
        adminEmail: session.user.email || undefined,
        action: "ADJUST_WALLET",
        targetId: targetUserId,
        targetType: "WALLET",
        reason: `${reason}${notes ? ` - ${notes}` : ""}`,
        metadata: {
          amount,
          type,
          idempotencyKey,
          transactionId:
            (result as any).transaction?.transactionId ||
            (result as any).transaction?._id,
          newBalance: result.newBalance,
        },
        req,
      });
    }

    return NextResponse.json({
      success: true,
      isIdempotentReplay: Boolean((result as any).isIdempotentReplay),
      message: (result as any).isIdempotentReplay
        ? `Idempotent replay: adjustment already recorded previously`
        : `Successfully executed admin ${type} adjustment of ₹${result.amount}`,
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
