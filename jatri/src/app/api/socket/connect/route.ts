import connectDb from "@/lib/db";
import User from "@/models/user.model";
import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await connectDb();

    // ── Authentication ───────────────────────────────────────────────────
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = await User.findOne({ email: session.user.email })
      .select("_id role")
      .lean();

    if (!sessionUser) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { userId, socketId } = await req.json();

    if (!userId || !socketId) {
      return NextResponse.json({ message: "Missing userId or socketId" }, { status: 400 });
    }

    // ── Authorization: caller can only bind their own socket ────────────
    const isOwner = (sessionUser as any)._id.toString() === userId.toString();
    const isAdmin = (sessionUser as any).role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        socketId,
        isOnline: true,
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error) {
    console.error("POST /api/socket/connect error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}