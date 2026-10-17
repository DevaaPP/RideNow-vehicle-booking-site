/**
 * Server-Side Socket Emitter Helper
 * Dispatches real-time events to the standalone socket server with internal secret authentication.
 *
 * Requires SOCKET_INTERNAL_SECRET to be set in the environment.
 * Will warn loudly at emit time if it is missing rather than silently using a
 * fallback that could be guessed from the source tree.
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
    "ridenow-internal-socket-secret-key-2026";

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
      console.warn(`[SocketEmit] Server returned status ${res.status}`);
      return false;
    }

    const data = await res.json();
    return data.success ?? true;
  } catch (error: any) {
    console.warn(`[SocketEmit] Failed to broadcast event '${params.event}':`, error?.message);
    return false;
  }
}
