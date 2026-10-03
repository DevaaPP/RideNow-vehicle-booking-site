/**
 * RideNow WhatsApp Service
 * Dispatches verification OTPs and ride updates via WhatsApp.
 * Supports Meta WhatsApp Cloud API (Graph API) with development console fallback.
 */

interface WhatsAppResult {
  success: boolean;
  messageId?: string;
  devOtp?: string;
  error?: string;
}

export async function sendWhatsAppOtp(
  toPhone: string,
  otp: string
): Promise<WhatsAppResult> {
  // Normalize Indian mobile number to 91XXXXXXXXXX
  const cleanedDigits = toPhone.replace(/\D/g, "");
  const formattedPhone =
    cleanedDigits.length === 10
      ? `91${cleanedDigits}`
      : cleanedDigits.startsWith("91") && cleanedDigits.length === 12
      ? cleanedDigits
      : `91${cleanedDigits.slice(-10)}`;

  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const isPlaceholder =
    !token ||
    !phoneNumberId ||
    token.trim() === "" ||
    phoneNumberId.trim() === "" ||
    token.includes("your_") ||
    phoneNumberId.includes("your_");

  // Development / fallback mode: Log OTP clearly to console for instant testing
  if (isPlaceholder) {
    console.log("\n=======================================================");
    console.log(`💬 [WHATSAPP OTP - DEV/FALLBACK] To: +${formattedPhone}`);
    console.log(`🔐 Verification Code: ${otp}`);
    console.log(`⏰ Valid for 10 minutes.`);
    console.log("=======================================================\n");

    return {
      success: true,
      devOtp: otp,
    };
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

    // Standard WhatsApp text message or template
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone,
      type: "text",
      text: {
        preview_url: false,
        body: `*${otp}* is your RideNow verification code.\n\nValid for 10 minutes. For your security, do not share this code with anyone.`,
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("WhatsApp API dispatch error:", data);
      console.log(`🔐 [FALLBACK WHATSAPP OTP] To: +${formattedPhone} | Code: ${otp}`);
      return {
        success: process.env.NODE_ENV !== "production",
        devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
        error: data?.error?.message || "WhatsApp dispatch failed",
      };
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (err: any) {
    console.error("WhatsApp network exception:", err);
    console.log(`🔐 [FALLBACK WHATSAPP OTP] To: +${formattedPhone} | Code: ${otp}`);
    return {
      success: process.env.NODE_ENV !== "production",
      devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
      error: err?.message || "WhatsApp network error",
    };
  }
}
