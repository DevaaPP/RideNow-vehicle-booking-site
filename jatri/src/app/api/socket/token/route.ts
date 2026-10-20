import { NextResponse } from "next/server";
import { auth } from "@/auth";
import crypto from "crypto";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    const secret =
      process.env.SOCKET_INTERNAL_SECRET ||
      process.env.AUTH_SECRET ||
      process.env.NEXTAUTH_SECRET;

    if (!secret) {
      console.error("[SocketToken] Missing SOCKET_INTERNAL_SECRET or AUTH_SECRET in server environment");
      return NextResponse.json(
        { success: false, message: "Socket gateway authentication is misconfigured on the server" },
        { status: 500 }
      );
    }

    const userId = String(session.user.id);
    const role = String(session.user.role || "user");
    // Token valid for 24 hours
    const exp = Date.now() + 24 * 60 * 60 * 1000;

    const payload = { userId, role, exp };
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto
      .createHmac("sha256", secret)
      .update(payloadB64)
      .digest("base64url");

    const token = `${payloadB64}.${signature}`;

    return NextResponse.json({
      success: true,
      token,
      userId,
      role,
      expiresAt: exp,
    });
  } catch (error: any) {
    console.error("[SocketToken] Error generating socket token:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
