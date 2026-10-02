import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { auth } from "@/auth";
import FamilyAccount from "@/models/family.model";

export async function GET() {
  try {
    await connectDb();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    let family = await FamilyAccount.findOne({ owner: session.user.id });

    if (!family) {
      family = await FamilyAccount.create({
        owner: session.user.id,
        familyName: `${session.user.name || "My"} Family`,
        members: [],
        sharedPaymentEnabled: true,
      });
    }

    return NextResponse.json({
      success: true,
      family,
    });
  } catch (error: any) {
    console.error("GET FAMILY ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch family account", error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDb();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { familyName, sharedPaymentEnabled } = body;

    let family = await FamilyAccount.findOne({ owner: session.user.id });

    if (!family) {
      family = new FamilyAccount({
        owner: session.user.id,
        familyName: familyName || `${session.user.name || "My"} Family`,
        members: [],
        sharedPaymentEnabled: sharedPaymentEnabled !== undefined ? sharedPaymentEnabled : true,
      });
    } else {
      if (familyName) family.familyName = familyName.trim();
      if (sharedPaymentEnabled !== undefined) family.sharedPaymentEnabled = Boolean(sharedPaymentEnabled);
    }

    await family.save();

    return NextResponse.json({
      success: true,
      message: "Family account updated successfully",
      family,
    });
  } catch (error: any) {
    console.error("UPDATE FAMILY ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update family account", error: error.message },
      { status: 500 }
    );
  }
}
