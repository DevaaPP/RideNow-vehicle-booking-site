/**
 * RideNow OTP Service Abstraction
 * Decouples OTP verification logic from message transport providers (WhatsApp & SMS).
 */
import { sendWhatsAppOtp } from "./whatsapp";

export type OTPChannel = "whatsapp" | "sms";

export interface OTPDispatchResult {
  success: boolean;
  channel: OTPChannel;
  messageId?: string;
  devOtp?: string;
  error?: string;
}

export interface OTPProvider {
  channel: OTPChannel;
  sendOtp(toPhone: string, otp: string): Promise<{
    success: boolean;
    messageId?: string;
    devOtp?: string;
    error?: string;
  }>;
}

class WhatsAppProvider implements OTPProvider {
  channel: OTPChannel = "whatsapp";

  async sendOtp(toPhone: string, otp: string) {
    const res = await sendWhatsAppOtp(toPhone, otp);
    return {
      success: res.success,
      messageId: res.messageId,
      devOtp: res.devOtp,
      error: res.error,
    };
  }
}

class SMSProvider implements OTPProvider {
  channel: OTPChannel = "sms";

  async sendOtp(toPhone: string, otp: string) {
    const cleanedDigits = toPhone.replace(/\D/g, "");
    const tenDigits = cleanedDigits.slice(-10);

    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    const fast2smsKey = process.env.FAST2SMS_API_KEY;

    // 1. Twilio SMS Integration if configured
    if (twilioSid && twilioAuthToken && twilioPhone && !twilioSid.includes("your_")) {
      try {
        const auth = Buffer.from(`${twilioSid}:${twilioAuthToken}`).toString("base64");
        const body = new URLSearchParams({
          To: `+91${tenDigits}`,
          From: twilioPhone,
          Body: `${otp} is your RideNow verification code. Valid for 10 minutes.`,
        });

        const res = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${auth}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body,
          }
        );

        const data = await res.json();
        if (res.ok) {
          return { success: true, messageId: data.sid };
        }
      } catch (err: any) {
        console.error("Twilio SMS dispatch failed:", err);
      }
    }

    // 2. Fast2SMS Integration if configured
    if (fast2smsKey && !fast2smsKey.includes("your_")) {
      try {
        const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
          method: "POST",
          headers: {
            authorization: fast2smsKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            variables_values: otp,
            route: "otp",
            numbers: tenDigits,
          }),
        });
        const data = await res.json();
        if (data.return) {
          return { success: true, messageId: data.request_id };
        }
      } catch (err: any) {
        console.error("Fast2SMS dispatch failed:", err);
      }
    }

    // 3. Fallback to dev console logging
    console.log("\n=======================================================");
    console.log(`📱 [SMS OTP - DEV/FALLBACK] To: +91${tenDigits}`);
    console.log(`🔐 Verification Code: ${otp}`);
    console.log(`⏰ Valid for 10 minutes.`);
    console.log("=======================================================\n");

    return {
      success: true,
      devOtp: otp,
    };
  }
}

class OTPService {
  private providers: Record<OTPChannel, OTPProvider>;

  constructor() {
    this.providers = {
      whatsapp: new WhatsAppProvider(),
      sms: new SMSProvider(),
    };
  }

  async dispatch(toPhone: string, otp: string, preferredChannel: OTPChannel = "whatsapp"): Promise<OTPDispatchResult> {
    const provider = this.providers[preferredChannel] || this.providers.whatsapp;
    const result = await provider.sendOtp(toPhone, otp);

    return {
      success: result.success,
      channel: preferredChannel,
      messageId: result.messageId,
      devOtp: result.devOtp,
      error: result.error,
    };
  }
}

export const otpService = new OTPService();
