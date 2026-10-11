/**
 * Server-Side Socket Emitter Helper
 * Dispatches real-time events to the standalone socket server with internal secret authentication.
 */

export async function emitSocketEvent(params: {
  userId?: string;
  event: string;
  data: any;
}) {
  const socketServer =
    process.env.NEXT_PUBLIC_SOCKET_SERVER || "http://localhost:5000";
  const internalSecret =
    process.env.SOCKET_INTERNAL_SECRET || "ridenow-internal-secret-2026";

  try {
    const res = await fetch(`${socketServer}/emit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-socket-secret": internalSecret,
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
