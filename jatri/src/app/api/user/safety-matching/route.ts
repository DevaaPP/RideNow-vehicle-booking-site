import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import User from "@/models/user.model";

export const dynamic = "force-dynamic";

/**
 * GET /api/user/safety-matching
 * Retrieves authenticated passenger's private safety-matching status.
 */
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
    const user = await User.findById(session.user.id)
      .select("safetyMatching")
      .lean();

    return NextResponse.json({
      success: true,
      womenOnlyEligible: Boolean((user as any)?.safetyMatching?.womenOnlyEligible),
      consentedAt: (user as any)?.safetyMatching?.consentedAt || null,
    });
  } catch (error: any) {
    console.error("[user:safety-matching:GET] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to retrieve safety preferences" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/safety-matching
 * Updates authenticated passenger's private women-only matching eligibility with consent.
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { womenOnlyEligible } = body;

    if (typeof womenOnlyEligible !== "boolean") {
      return NextResponse.json(
        { success: false, message: "womenOnlyEligible must be a boolean" },
        { status: 400 }
      );
    }

    await connectDb();

    const updatePayload: any = {
      "safetyMatching.womenOnlyEligible": womenOnlyEligible,
    };

    if (womenOnlyEligible) {
      updatePayload["safetyMatching.consentedAt"] = new Date();
    }

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updatePayload },
      { new: true }
    )
      .select("safetyMatching")
      .lean();

    return NextResponse.json({
      success: true,
      message: womenOnlyEligible
        ? "Enrolled in women-only passenger matching"
        : "Disabled women-only passenger matching",
      womenOnlyEligible: Boolean((updatedUser as any)?.safetyMatching?.womenOnlyEligible),
      consentedAt: (updatedUser as any)?.safetyMatching?.consentedAt || null,
    });
  } catch (error: any) {
    console.error("[user:safety-matching:PATCH] Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update safety preferences" },
      { status: 500 }
    );
  }
}
