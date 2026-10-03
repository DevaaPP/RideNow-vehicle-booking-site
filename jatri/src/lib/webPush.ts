import webpush from "web-push";
import PushSubscription from "@/models/push-subscription.model";
import connectDb from "./db";

// Fallback VAPID keys if not specified in environment
// In production, these should be set in .env as NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY
const DEFAULT_VAPID_PUBLIC =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";

const DEFAULT_VAPID_PRIVATE =
  process.env.VAPID_PRIVATE_KEY || "UU2DehFsA0TqGq6Tz5pW7P0q_zK5S8XfU1Pj5vYj5R8";

const DEFAULT_SUBJECT = process.env.VAPID_SUBJECT || "mailto:support@ridenow.com";

let vapidConfigured = false;

function ensureVapidConfig() {
  if (!vapidConfigured) {
    try {
      webpush.setVapidDetails(DEFAULT_SUBJECT, DEFAULT_VAPID_PUBLIC, DEFAULT_VAPID_PRIVATE);
      vapidConfigured = true;
    } catch (err) {
      console.error("Failed to configure VAPID details for Web Push:", err);
    }
  }
}

export function getVapidPublicKey() {
  return DEFAULT_VAPID_PUBLIC;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
  actions?: Array<{ action: string; title: string }>;
}

/**
 * Send push notification to a specific user across all their registered active devices
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  try {
    ensureVapidConfig();
    await connectDb();

    const subscriptions = await PushSubscription.find({
      user: userId,
      isActive: true,
    });

    if (!subscriptions || subscriptions.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const payloadString = JSON.stringify({
      title: payload.title || "RideNow Update",
      body: payload.body || "",
      url: payload.url || "/",
      tag: payload.tag || "ridenow-notification",
      icon: payload.icon || "/logo.jpeg",
      badge: payload.badge || "/logo.jpeg",
      actions: payload.actions,
    });

    let sent = 0;
    let failed = 0;

    const pushPromises = subscriptions.map(async (sub) => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
        },
      };

      try {
        await webpush.sendNotification(pushConfig, payloadString);
        sent++;
      } catch (error: any) {
        failed++;
        // If subscription is expired or unsubscribed (404 or 410 Gone), deactivate it
        if (error.statusCode === 404 || error.statusCode === 410) {
          sub.isActive = false;
          await sub.save().catch(() => {});
        } else {
          console.warn("Error sending web push to endpoint:", error.message || error);
        }
      }
    });

    await Promise.all(pushPromises);
    return { sent, failed };
  } catch (error) {
    console.error("sendPushToUser general error:", error);
    return { sent: 0, failed: 0 };
  }
}
