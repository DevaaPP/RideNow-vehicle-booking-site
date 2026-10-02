import { NextResponse } from "next/server";
import connectDb from "@/lib/db";
import { auth } from "@/auth";
import FamilyAccount from "@/models/family.model";

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
    const { name, email, phone, relation } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { success: false, message: "Member name is required" },
        { status: 400 }
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

    if (family.members.length >= 5) {
      return NextResponse.json(
        { success: false, message: "Maximum of 5 family members allowed" },
        { status: 400 }
      );
    }

    const newMember = {
      name: name.trim(),
      email: email ? email.trim().toLowerCase() : undefined,
      phone: phone ? phone.trim() : undefined,
      relation: relation || "Other",
      addedAt: new Date(),
    };

    family.members.push(newMember);
    await family.save();

    return NextResponse.json({
      success: true,
      message: `Added ${name} to Family Account`,
      family,
    });
  } catch (error: any) {
    console.error("ADD FAMILY MEMBER ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add family member", error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    await connectDb();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json(
        { success: false, message: "Member ID is required" },
        { status: 400 }
      );
    }

    const family = await FamilyAccount.findOne({ owner: session.user.id });
    if (!family) {
      return NextResponse.json(
        { success: false, message: "Family account not found" },
        { status: 404 }
      );
    }

    family.members = family.members.filter((m: any) => m._id.toString() !== memberId);
    await family.save();

    return NextResponse.json({
      success: true,
      message: "Member removed from Family Account",
      family,
    });
  } catch (error: any) {
    console.error("DELETE FAMILY MEMBER ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Failed to remove member", error: error.message },
      { status: 500 }
    );
  }
}
