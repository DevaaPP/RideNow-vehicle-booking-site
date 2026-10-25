import { NextRequest, NextResponse } from "next/server";

/**
 * 📱 POST /api/otp/send
 * Public API gateway route that forwards WhatsApp OTP generation & dispatch
 * to the persistent Node.js Baileys microservice.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const socketServerUrl =
      process.env.WHATSAPP_BAILEYS_URL ||
      process.env.NEXT_PUBLIC_SOCKET_SERVER ||
      process.env.SOCKET_SERVER_URL ||
      "http://localhost:5000";

    const targetUrl = `${socketServerUrl.replace(/\/$/, "")}/api/otp/send`;

    try {
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": clientIp,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } catch (networkErr: any) {
      console.warn("[API /api/otp/send] Microservice fetch note:", networkErr?.message);

      // Graceful fallback to internal auth route if microservice is offline during serverless deploy
      const fallbackUrl = new URL("/api/auth/phone/send-otp", req.url);
      const fallbackRes = await fetch(fallbackUrl.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": clientIp,
        },
        body: JSON.stringify({
          mobileNumber: body.mobileNumber || body.phone,
          channel: "whatsapp",
        }),
      });

      const fallbackData = await fallbackRes.json();
      return NextResponse.json(fallbackData, { status: fallbackRes.status });
    }
  } catch (err: any) {
    console.error("[API /api/otp/send] Exception:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error processing OTP request" },
      { status: 500 }
    );
  }
}
