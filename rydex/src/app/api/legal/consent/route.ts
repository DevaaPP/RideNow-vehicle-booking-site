import { auth } from "@/auth";
import connectDb from "@/lib/db";
import LegalConsent from "@/models/legal-consent.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();

    const body = await req.json();
    const { documentType, version = "1.0", metadata = {} } = body;

    if (!documentType) {
      return NextResponse.json(
        { error: "documentType is required" },
        { status: 400 }
      );
    }

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const userAgent = req.headers.get("user-agent") || "unknown";

    const consentRecord = await LegalConsent.create({
      userId: session?.user?.id ? session.user.id : null,
      documentType,
      version,
      ipAddress,
      userAgent,
      acceptedAt: new Date(),
      metadata,
    });

    return NextResponse.json({
      success: true,
      message: "Consent recorded successfully",
      recordId: consentRecord._id,
    });
  } catch (error: any) {
    console.error("Legal consent logging error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to record legal consent" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const consents = await LegalConsent.find({ userId: session.user.id })
      .sort({ acceptedAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({
      success: true,
      consents,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to fetch consents" },
      { status: 500 }
    );
  }
}
