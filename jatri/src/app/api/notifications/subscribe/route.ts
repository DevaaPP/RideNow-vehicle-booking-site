import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import connectDb from "@/lib/db";
import PushSubscription from "@/models/push-subscription.model";

export async function POST(req: NextRequest) {
  try {
    await connectDb();
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Please sign in to enable push notifications" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { subscription, userAgent } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { message: "Invalid push subscription object" },
        { status: 400 }
      );
    }

    // Upsert subscription
    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        user: session.user.id,
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        userAgent: userAgent || req.headers.get("user-agent") || undefined,
        isActive: true,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Push notifications enabled successfully",
    });
  } catch (error: any) {
    console.error("Push subscribe error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to save push subscription" },
      { status: 500 }
    );
  }
}
