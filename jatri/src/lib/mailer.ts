import { Resend } from "resend";

export interface MailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  isSimulated?: boolean;
}

export const sendMail = async (
  to: string,
  subject: string,
  html: string
): Promise<MailResult> => {
  const apiKey = process.env.RESEND_API_KEY;
  const isDummyOrMissing =
    !apiKey ||
    apiKey.trim() === "" ||
    apiKey.includes("your_") ||
    apiKey.startsWith("re_your");

  // Extract any 4 to 6 digit OTP code from subject/html for clear console logging
  const otpMatch = html.match(/>(\d{4,6})</) || html.match(/\b(\d{4,6})\b/);
  const otpCode = otpMatch ? otpMatch[1] : "N/A";

  if (isDummyOrMissing) {
    console.log("\n=======================================================");
    console.log(`📧 [EMAIL NOTIFICATION - DEV/SIMULATED]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    if (otpCode !== "N/A") {
      console.log(`🔐 OTP Code: ${otpCode}`);
    }
    console.log("=======================================================\n");

    return {
      success: true,
      isSimulated: true,
    };
  }

  try {
    const resend = new Resend(apiKey);
    // Use onboarding@resend.dev as reliable default if custom domain isn't verified
    const sender = process.env.RESEND_FROM_EMAIL || "RideNow <onboarding@resend.dev>";

    const response = await resend.emails.send({
      from: sender,
      to,
      subject,
      html,
    });

    if ((response as any)?.error) {
      console.warn("Resend API responded with error:", (response as any).error);
      console.log(`🔐 [FALLBACK OTP LOG] To: ${to} | Code: ${otpCode}`);
      return {
        success: false,
        error: (response as any).error?.message || "Failed to send email via Resend",
      };
    }

    return {
      success: true,
      messageId: (response as any)?.data?.id,
    };
  } catch (error: any) {
    console.warn("Resend Email Exception:", error?.message || error);
    console.log(`🔐 [FALLBACK OTP LOG] To: ${to} | Code: ${otpCode}`);
    return {
      success: false,
      error: error?.message || "Email dispatch failed",
      isSimulated: true,
    };
  }
};