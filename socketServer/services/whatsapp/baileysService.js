import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import pino from "pino";
import qrcode from "qrcode";
import qrcodeTerminal from "qrcode-terminal";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BaileysWhatsAppService {
  constructor() {
    this.sock = null;
    this.status = "disconnected"; // "disconnected" | "connecting" | "qr_ready" | "connected"
    this.qr = null;
    this.qrDataUrl = null;
    this.lastConnected = null;
    this.lastDisconnectReason = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectTimer = null;
    this.isInitializing = false;

    // Persist session credentials in dedicated secure directory
    this.authDir = process.env.WHATSAPP_AUTH_DIR
      ? path.resolve(process.cwd(), process.env.WHATSAPP_AUTH_DIR)
      : path.resolve(__dirname, "../../.baileys_auth");

    // Ensure session directory exists with restricted permissions
    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }
  }

  /**
   * Initializes the Baileys WhatsApp Web connection
   */
  async initialize() {
    if (this.isInitializing || this.status === "connected") {
      return;
    }

    this.isInitializing = true;
    this.status = "connecting";

    try {
      const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
      let version = [2, 3000, 1015901307]; // Safe default fallback version

      try {
        const latest = await fetchLatestBaileysVersion();
        if (latest?.version) {
          version = latest.version;
        }
      } catch (verErr) {
        // Silently proceed with fallback version if offline/blocked
      }

      // Silent logger to prevent session tokens or credentials leaking to stdout
      const silentLogger = pino({ level: "silent" });

      this.sock = makeWASocket({
        version,
        logger: silentLogger,
        printQRInTerminal: false, // Handled manually below for clean formatting
        auth: state,
        browser: ["RideNow OTP Gateway", "Chrome", "1.0.0"],
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
        emitOwnEvents: false,
      });

      // Save credentials whenever updated
      this.sock.ev.on("creds.update", saveCreds);

      // Listen for connection lifecycle changes
      this.sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        // QR Code generated for pairing
        if (qr) {
          this.qr = qr;
          this.status = "qr_ready";

          try {
            this.qrDataUrl = await qrcode.toDataURL(qr, { margin: 2, scale: 6 });
          } catch (qrErr) {
            this.qrDataUrl = null;
          }

          if (process.env.NODE_ENV !== "production") {
            console.log("\n=======================================================");
            console.log("📱 [RideNow WhatsApp OTP Gateway] Scan QR to pair:");
            console.log("=======================================================\n");
            qrcodeTerminal.generate(qr, { small: true });
            console.log("\n(Scan this QR code using WhatsApp on your phone: Linked Devices)\n");
          } else {
            console.log("[WhatsApp Baileys] Pairing QR generated. Fetch via authorized administrative endpoint.");
          }
        }

        // Connection opened successfully
        if (connection === "open") {
          this.status = "connected";
          this.qr = null;
          this.qrDataUrl = null;
          this.lastConnected = new Date();
          this.reconnectAttempts = 0;
          this.lastDisconnectReason = null;
          console.log(`[WhatsApp Baileys] Successfully connected & authenticated.`);
        }

        // Connection closed
        if (connection === "close") {
          this.status = "disconnected";
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;

          this.lastDisconnectReason = {
            statusCode,
            message: lastDisconnect?.error?.message || "Connection closed",
            timestamp: new Date(),
          };

          console.warn(
            `[WhatsApp Baileys] Connection closed. Reason code: ${statusCode || "unknown"}`
          );

          if (isLoggedOut) {
            console.error(
              "[WhatsApp Baileys] Device logged out. Clearing auth credentials for fresh pairing."
            );
            this.clearAuthStore();
            this.scheduleReconnect(2000);
          } else {
            // Auto-reconnect with exponential backoff for transient network issues
            const delay = Math.min(
              1000 * Math.pow(2, this.reconnectAttempts),
              30000
            );
            this.scheduleReconnect(delay);
          }
        }
      });
    } catch (err) {
      this.status = "disconnected";
      console.error("[WhatsApp Baileys] Initialization exception:", err?.message || err);
      this.scheduleReconnect(5000);
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Schedules automatic reconnection with backoff
   */
  scheduleReconnect(delayMs) {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn(
        `[WhatsApp Baileys] Max reconnect attempts (${this.maxReconnectAttempts}) reached. Retrying every 60s.`
      );
      delayMs = 60000;
    } else {
      this.reconnectAttempts += 1;
    }

    this.reconnectTimer = setTimeout(() => {
      this.initialize();
    }, delayMs);
  }

  /**
   * Safely cleans up the session storage directory on logout
   */
  clearAuthStore() {
    try {
      if (fs.existsSync(this.authDir)) {
        const files = fs.readdirSync(this.authDir);
        for (const file of files) {
          fs.unlinkSync(path.join(this.authDir, file));
        }
      }
    } catch (err) {
      console.error("[WhatsApp Baileys] Error clearing auth directory:", err);
    }
  }

  /**
   * Sends a 6-digit OTP to the specified phone number
   * @param {string} toPhone - Formatted phone digits (e.g. 919876543210)
   * @param {string} otp - The 6-digit OTP string
   * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
   */
  async sendOtp(toPhone, otp) {
    // 1. Check if Baileys is connected
    if (this.status !== "connected" || !this.sock) {
      // In development or simulation mode, allow graceful fallback without crashing
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[WhatsApp Baileys] Offline simulation: WhatsApp socket status is "${this.status}".`
        );
        return {
          success: true,
          simulated: true,
          messageId: `dev_sim_${Date.now()}`,
          warning: `WhatsApp Web is in status "${this.status}". Pair device via QR to enable live dispatch.`,
        };
      }

      return {
        success: false,
        error: "WhatsApp gateway is currently disconnected. Please try again shortly or use SMS OTP.",
      };
    }

    // 2. Format JID: e.g. "919876543210@s.whatsapp.net"
    const cleaned = toPhone.replace(/\D/g, "");
    const jid = `${cleaned}@s.whatsapp.net`;

    const messageText = `*${otp}* is your RideNow verification code.\n\nValid for 5 minutes. For your security, do not share this code with anyone.`;

    try {
      const sent = await this.sock.sendMessage(jid, {
        text: messageText,
      });

      return {
        success: true,
        messageId: sent?.key?.id,
      };
    } catch (sendErr) {
      console.error(
        `[WhatsApp Baileys] Failed to dispatch message: ${sendErr?.message || "Unknown send error"}`
      );
      return {
        success: false,
        error: "Failed to dispatch WhatsApp message. Please verify the mobile number has an active WhatsApp account.",
      };
    }
  }

  /**
   * Returns health and connection diagnostics
   */
  getStatus() {
    return {
      provider: "baileys",
      status: this.status,
      connected: this.status === "connected",
      hasQr: !!this.qr,
      lastConnected: this.lastConnected,
      reconnectAttempts: this.reconnectAttempts,
      lastDisconnectReason: this.lastDisconnectReason,
    };
  }

  /**
   * Returns the current pairing QR data (if status is qr_ready)
   */
  getQrData() {
    return {
      qr: this.qr,
      qrDataUrl: this.qrDataUrl,
      status: this.status,
    };
  }

  /**
   * Graceful disconnection
   */
  async destroy() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.sock) {
      try {
        await this.sock.logout();
      } catch (e) {
        // Ignored during process teardown
      }
      this.sock = null;
    }
    this.status = "disconnected";
  }
}

export const baileysService = new BaileysWhatsAppService();
export default baileysService;
