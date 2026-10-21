import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";
import Wallet from "@/models/wallet.model";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ message: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    await connectDb();

    const { searchParams } = new URL(req.url);
    const shouldFix = searchParams.get("fix") === "true";

    const wallets = await Wallet.find({}).lean();
    const mismatches = [];
    const fixedUsers = [];

    for (const wallet of wallets) {
      const user = await User.findById(wallet.userId).select("walletBalance name mobileNumber").lean();
      if (!user) continue;

      const walletBal = Number(wallet.balance || 0);
      const userBal = Number((user as any).walletBalance || 0);
      const discrepancy = Math.abs(walletBal - userBal);

      if (discrepancy > 0.5) {
        mismatches.push({
          userId: wallet.userId,
          userName: (user as any).name || "Unknown",
          mobileNumber: (user as any).mobileNumber || "",
          walletDocBalance: walletBal,
          userDocBalance: userBal,
          diff: Math.round((walletBal - userBal) * 100) / 100,
        });

        if (shouldFix) {
          // Authoritative balance is Wallet document; synchronize User.walletBalance
          await User.findByIdAndUpdate(wallet.userId, {
            $set: { walletBalance: walletBal },
          });
          fixedUsers.push(wallet.userId.toString());
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      totalWalletsChecked: wallets.length,
      mismatchCount: mismatches.length,
      mismatches,
      repairedCount: fixedUsers.length,
      repairedUsers: shouldFix ? fixedUsers : undefined,
    });
  } catch (error: any) {
    console.error("GET /api/admin/wallet-audit error:", error);
    return NextResponse.json({ message: error?.message || "Audit failed" }, { status: 500 });
  }
}
