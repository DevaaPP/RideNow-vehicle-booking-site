/**
 * Server-Side Socket Emitter Helper
 * Dispatches real-time events to the standalone socket server with internal secret authentication.
 *
 * Requires SOCKET_INTERNAL_SECRET (or AUTH_SECRET) to be set in the environment.
 * Rejects silent hardcoded fallbacks that could compromise production gateways.
 */

export async function emitSocketEvent(params: {
  userId?: string;
  event: string;
  data: any;
  directBookingId?: string;
  room?: string;
}) {
  const socketServer = (
    process.env.SOCKET_SERVER_URL ||
    process.env.NEXT_PUBLIC_SOCKET_SERVER ||
    "http://localhost:5000"
  ).replace(/\/$/, "");

  const internalSecret =
    process.env.SOCKET_INTERNAL_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET;

  if (!internalSecret) {
    console.error("[SocketEmit] FATAL: SOCKET_INTERNAL_SECRET or AUTH_SECRET is missing. Cannot emit authenticated socket events.");
    return false;
  }

  try {
    const res = await fetch(`${socketServer}/emit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-socket-secret": internalSecret,
        "x-internal-secret": internalSecret,
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      console.warn(`[SocketEmit] Socket gateway returned status ${res.status}`);
      return false;
    }

    const data = await res.json();
    return data.success ?? true;
  } catch (error: any) {
    console.warn(`[SocketEmit] Failed to broadcast event '${params.event}':`, error?.message);
    return false;
  }
}
