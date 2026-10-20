import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let savedAuthData: { userId?: string; token?: string; trackingToken?: string } = {};
const activeBookingRooms = new Map<string, string | undefined>(); // bookingId -> optional trackingToken
let listenersAttached = false;
let isFetchingToken = false;

/**
 * Fetches an authenticated, HMAC-signed socket token from the Next.js API.
 */
export async function fetchSocketToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  if (savedAuthData.token) return savedAuthData.token;
  if (isFetchingToken) return null;

  try {
    isFetchingToken = true;
    const res = await fetch("/api/socket/token", {
      headers: { "Cache-Control": "no-cache" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.success && data?.token) {
      savedAuthData.token = data.token;
      savedAuthData.userId = data.userId;
      if (socket) {
        socket.auth = { ...socket.auth, token: data.token, userId: data.userId };
        if (socket.connected) {
          socket.emit("authenticate", { token: data.token });
        }
      }
      return data.token;
    }
    return null;
  } catch (err) {
    console.warn("[SocketClient] Failed to fetch socket token:", err);
    return null;
  } finally {
    isFetchingToken = false;
  }
}

export const getSocket = (authData?: { userId?: string; token?: string; trackingToken?: string }): Socket => {
  if (authData?.userId || authData?.token || authData?.trackingToken) {
    savedAuthData = { ...savedAuthData, ...authData };
  }

  if (!socket) {
    const url = (
      process.env.NEXT_PUBLIC_SOCKET_SERVER ||
      process.env.NEXT_PUBLIC_SOCKET_SERVER_URL ||
      "http://localhost:5000"
    ).replace(/\/$/, "");

    socket = io(url, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity, // Continually reconnect during cellular dead zones
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 10000,
      autoConnect: true,
      auth: (cb) => {
        // Return latest saved authentication credentials
        cb(savedAuthData);
      },
    });

    // Auto-rejoin rooms and re-assert identity whenever connection is established or restored
    const reassertSubscriptions = () => {
      const currentSocket = socket;
      if (!currentSocket) return;

      // Re-authenticate if token exists
      if (savedAuthData.token) {
        currentSocket.emit("authenticate", { token: savedAuthData.token });
      } else if (savedAuthData.userId) {
        // Trigger lazy fetch for background token authentication
        fetchSocketToken();
      }

      // Rejoin all active booking rooms
      activeBookingRooms.forEach((trackingToken, bookingId) => {
        if (trackingToken) {
          currentSocket.emit("join-booking", { bookingId, trackingToken });
        } else {
          currentSocket.emit("join-booking", bookingId);
        }
      });
    };

    socket.on("connect", reassertSubscriptions);
    socket.io.on("reconnect", reassertSubscriptions);
  } else if (authData?.token || authData?.userId) {
    socket.auth = { ...socket.auth, ...authData };
    if (socket.connected) {
      if (authData.token) {
        socket.emit("authenticate", { token: authData.token });
      }
    }
  }

  // If we have userId but missing token, fetch token in background
  if (savedAuthData.userId && !savedAuthData.token && typeof window !== "undefined") {
    fetchSocketToken();
  }

  // Network and visibility change listeners: immediately re-connect on mobile network recovery
  if (typeof window !== "undefined" && !listenersAttached) {
    listenersAttached = true;
    window.addEventListener("online", () => {
      if (socket && !socket.connected) {
        socket.connect();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && socket && !socket.connected) {
        socket.connect();
      }
    });
  }

  return socket;
};

/**
 * Subscribes to a booking room with persistent auto-rejoin on reconnect.
 * Supports public read-only tracking via optional trackingToken.
 */
export const joinBookingRoom = (bookingId: string, trackingToken?: string) => {
  if (!bookingId) return;
  activeBookingRooms.set(bookingId, trackingToken);
  const s = getSocket();
  if (s && s.connected) {
    if (trackingToken) {
      s.emit("join-booking", { bookingId, trackingToken });
    } else {
      s.emit("join-booking", bookingId);
    }
  }
};

/**
 * Unsubscribes from a booking room when leaving the view.
 */
export const leaveBookingRoom = (bookingId: string) => {
  if (!bookingId) return;
  activeBookingRooms.delete(bookingId);
  const s = socket;
  if (s && s.connected) {
    s.emit("leave-booking", bookingId);
  }
};

/**
 * Resets socket authentication and cleanly disconnects upon user sign-out.
 */
export const resetSocketAuth = () => {
  savedAuthData = {};
  activeBookingRooms.clear();
  if (socket) {
    socket.auth = {};
    socket.disconnect();
    socket = null;
    listenersAttached = false;
  }
};
