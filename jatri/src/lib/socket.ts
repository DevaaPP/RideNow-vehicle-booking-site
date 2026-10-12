import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (authData?: { userId?: string }): Socket => {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_SERVER || "http://localhost:5000";
    socket = io(url, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      autoConnect: true,
      auth: authData || {},
    });
  } else if (authData?.userId) {
    socket.auth = { ...socket.auth, ...authData };
  }
  return socket;
};