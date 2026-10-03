import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import PushSubscription from "@/models/push-subscription.model";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { endpoint } = body;

    if (endpoint) {
      await PushSubscription.updateOne(
        { endpoint, user: session.user.id },
        { isActive: false }
      );
    } else {
      await PushSubscription.updateMany(
        { user: session.user.id },
        { isActive: false }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Push notifications disabled",
    });
  } catch (error: any) {
    console.error("Push unsubscribe error:", error);
    return NextResponse.json(
      { message: "Failed to unsubscribe" },
      { status: 500 }
    );
  }
}
