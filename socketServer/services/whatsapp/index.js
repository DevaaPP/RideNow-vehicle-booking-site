import baileysService from "./baileysService.js";
import metaCloudService from "./metaCloudService.js";

/**
 * Returns the configured WhatsApp transport provider
 * Default: Baileys (WhatsApp Web QR session)
 * Migration path: Set WHATSAPP_PROVIDER=meta to switch to Meta Cloud API
 */
export function getWhatsAppService() {
  const provider = (process.env.WHATSAPP_PROVIDER || "baileys").toLowerCase().trim();

  if (provider === "meta") {
    return metaCloudService;
  }

  return baileysService;
}

/**
 * Initializes background WhatsApp transport service
 */
export async function initializeWhatsApp() {
  const provider = (process.env.WHATSAPP_PROVIDER || "baileys").toLowerCase().trim();

  if (provider === "baileys") {
    console.log("[WhatsApp Service] Booting Baileys WhatsApp Web QR pairing engine...");
    await baileysService.initialize();
  } else if (provider === "meta") {
    console.log("[WhatsApp Service] Configured with official Meta WhatsApp Cloud API.");
  }
}

export { baileysService, metaCloudService };
export default getWhatsAppService;
