import { NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import { getDriverWeeklyIncentiveProgress } from "@/lib/driverIncentiveEngine";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    if (session.user.role !== "vendor" && session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden: Driver account required." },
        { status: 403 }
      );
    }

    await connectDb();

    const progress = await getDriverWeeklyIncentiveProgress(session.user.id);

    return NextResponse.json({
      success: true,
      incentives: progress,
    });
  } catch (error: any) {
    console.error("[api/partner/incentives] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch driver incentives progress" },
      { status: 500 }
    );
  }
}
