import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import { getUserReferralDashboard } from "@/lib/referralEngine";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDb();
    const dashboard = await getUserReferralDashboard(session.user.id);

    return NextResponse.json({
      success: true,
      ...dashboard,
    });
  } catch (error: any) {
    console.error("[GET /api/user/referral] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load referral details." },
      { status: 500 }
    );
  }
}
