import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let savedAuthData: { userId?: string } = {};
const activeBookingRooms = new Set<string>();
let listenersAttached = false;

export const getSocket = (authData?: { userId?: string }): Socket => {
  if (authData?.userId) {
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
      auth: savedAuthData,
    });

    // Auto-rejoin rooms and re-assert identity whenever connection is established or restored
    const reassertSubscriptions = () => {
      const currentSocket = socket;
      if (!currentSocket) return;
      if (savedAuthData.userId) {
        currentSocket.emit("identity", savedAuthData.userId);
      }
      activeBookingRooms.forEach((bookingId) => {
        currentSocket.emit("join-booking", bookingId);
      });
    };

    socket.on("connect", reassertSubscriptions);
    socket.io.on("reconnect", reassertSubscriptions);
  } else if (authData?.userId) {
    socket.auth = { ...socket.auth, ...authData };
    if (socket.connected) {
      socket.emit("identity", authData.userId);
    }
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
 */
export const joinBookingRoom = (bookingId: string) => {
  if (!bookingId) return;
  activeBookingRooms.add(bookingId);
  const s = getSocket();
  if (s && s.connected) {
    s.emit("join-booking", bookingId);
  }
};

/**
 * Unsubscribes from a booking room when leaving the view.
 */
export const leaveBookingRoom = (bookingId: string) => {
  if (!bookingId) return;
  activeBookingRooms.delete(bookingId);
};