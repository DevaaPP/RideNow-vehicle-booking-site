import axios from "axios";

/**
 * Meta WhatsApp Cloud API Provider
 * Offically supported Meta Graph API transport for RideNow WhatsApp OTP.
 */
class MetaCloudWhatsAppService {
  constructor() {
    this.token = process.env.WHATSAPP_API_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  }

  isConfigured() {
    return Boolean(
      this.token &&
      this.phoneNumberId &&
      !this.token.includes("your_") &&
      !this.phoneNumberId.includes("your_")
    );
  }

  async sendOtp(toPhone, otp) {
    if (!this.isConfigured()) {
      if (process.env.NODE_ENV !== "production") {
        return {
          success: true,
          simulated: true,
          messageId: `dev_meta_${Date.now()}`,
          warning: "Meta WhatsApp credentials unconfigured. Running in development mode.",
        };
      }
      return {
        success: false,
        error: "Meta WhatsApp Cloud API credentials are not configured in production.",
      };
    }

    const cleaned = toPhone.replace(/\D/g, "");
    const formattedPhone = cleaned.startsWith("91") && cleaned.length === 12
      ? cleaned
      : `91${cleaned.slice(-10)}`;

    const url = `https://graph.facebook.com/v21.0/${this.phoneNumberId}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formattedPhone,
      type: "text",
      text: {
        preview_url: false,
        body: `*${otp}* is your RideNow verification code.\n\nValid for 5 minutes. For your security, do not share this code with anyone.`,
      },
    };

    try {
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      return {
        success: true,
        messageId: response.data?.messages?.[0]?.id,
      };
    } catch (err) {
      console.error(
        "[Meta WhatsApp] Send failure:",
        err.response?.data?.error?.message || err.message
      );
      return {
        success: false,
        error: err.response?.data?.error?.message || "Meta WhatsApp Cloud API delivery failed",
      };
    }
  }

  getStatus() {
    return {
      provider: "meta",
      configured: this.isConfigured(),
      connected: this.isConfigured(),
    };
  }
}

export const metaCloudService = new MetaCloudWhatsAppService();
export default metaCloudService;
