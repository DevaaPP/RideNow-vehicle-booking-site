import express from "express"
import http from "http"
import dotenv from "dotenv"
import cors from "cors"
import { Server } from "socket.io"
import axios from "axios"

dotenv.config()

import mongoose from "mongoose"
import User from "./models/user.models.js"

const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_URL;
if (!mongoUri) {
  console.error("Error: MONGODB_URI or MONGODB_URL is missing in environment variables.");
  process.exit(1);
}

try {
  await mongoose.connect(mongoUri);
  console.log("Database connected successfully");
} catch (error) {
  console.error("Database connection error:", error);
  process.exit(1);
}

const app = express()
const server = http.createServer(app)
const port = process.env.PORT || 5000

// Multi-origin CORS support: accommodates custom domains, comma-separated lists, Vercel preview URLs, and localhost
const configuredOrigins = (process.env.NEXT_BASE_URL || "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);

const isOriginAllowed = (origin) => {
  if (!origin) return true; // Server-to-server or non-browser request
  if (configuredOrigins.length === 0) return true;
  if (configuredOrigins.includes(origin)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  if (/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(origin)) return true;
  return false;
};

const corsDelegate = (origin, callback) => {
  if (isOriginAllowed(origin)) {
    return callback(null, true);
  }
  return callback(new Error(`[SocketCORS] Blocked request from origin: ${origin}`));
};

app.use(cors({ origin: corsDelegate, credentials: true }));
app.use(express.json());

// Public health check routes for cloud container runners (Render, Railway, Fly.io, etc.)
app.get(["/", "/health"], (req, res) => {
  res.json({
    status: "ok",
    service: "RideNow Realtime Socket Gateway",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

const INTERNAL_SECRET = process.env.SOCKET_INTERNAL_SECRET;

if (!INTERNAL_SECRET) {
  console.warn("⚠️ WARNING: SOCKET_INTERNAL_SECRET is not configured in environment. /emit calls without secret will be rejected.");
}

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => callback(null, isOriginAllowed(origin)),
    credentials: true,
    methods: ["GET", "POST"],
  },
})

// Authoritative internal emission endpoint
app.post("/emit", async (req, res) => {
  const secret = req.headers["x-socket-secret"];
  if (!INTERNAL_SECRET || secret !== INTERNAL_SECRET) {
    return res.status(403).json({ success: false, error: "Unauthorized socket emission secret" });
  }

  const { userId, event, data } = req.body;

  try {
    // 1. Emit to user room and specific user socketId
    if (userId) {
      io.to(`user-${userId}`).emit(event, data);
      const user = await User.findById(userId);
      if (user?.socketId) {
        io.to(user.socketId).emit(event, data);
      }
    }

    // 2. Also broadcast to the booking room if bookingId is present
    const bookingId = data?.bookingId || data?._id;
    if (bookingId) {
      io.to(`booking-${bookingId}`).emit(event, data);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Socket emit endpoint error:", error);
    res.status(500).json({ success: false });
  }
});

// Handshake Authentication Middleware
io.use(async (socket, next) => {
  try {
    const authPayload = socket.handshake.auth || {};
    const userId = authPayload.userId || socket.handshake.query?.userId;

    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return next(new Error("Invalid user authentication credentials"));
      }
      const user = await User.findById(userId).select("_id role isVendorBlocked isOnline");
      if (user) {
        socket.userId = user._id.toString();
        socket.userRole = user.role;
        socket.data.userId = user._id.toString();
        socket.data.userRole = user.role;
      }
    }
    next();
  } catch (err) {
    console.error("Socket authentication middleware error:", err);
    next();
  }
});

io.on("connection", (socket) => {
  // Identity binding
  socket.on("identity", async (userId) => {
    if (!userId || typeof userId !== "string" || !mongoose.Types.ObjectId.isValid(userId)) {
      return;
    }

    // If socket was pre-authenticated during handshake, prevent impersonating another user
    if (socket.userId && socket.userId !== userId) {
      console.warn(`[SocketSecurity] Socket ${socket.id} attempted identity mismatch: ${socket.userId} vs ${userId}`);
      return;
    }

    try {
      const user = await User.findById(userId);
      if (!user) return;

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.data.userId = user._id.toString();
      socket.data.userRole = user.role;

      socket.join(`user-${userId}`);

      const updateData = {
        socketId: socket.id,
        lastHeartbeat: new Date(),
      };
      if (user.role !== "vendor") {
        updateData.isOnline = true;
      }
      await User.findByIdAndUpdate(userId, updateData);
    } catch (err) {
      console.error("Socket identity error:", err);
    }
  });

  // Strict Room Access Control: Only participants (rider, assigned driver, dispatch candidates, or admin) may join
  socket.on("join-booking", async (bookingId) => {
    if (!bookingId || typeof bookingId !== "string" || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return;
    }

    if (!socket.userId) {
      console.warn(`[SocketSecurity] Unauthenticated socket ${socket.id} attempted to join booking-${bookingId}`);
      return;
    }

    try {
      const booking = await mongoose.connection.collection("bookings").findOne(
        { _id: new mongoose.Types.ObjectId(bookingId) },
        { projection: { user: 1, driver: 1, candidateDrivers: 1 } }
      );

      if (!booking) {
        console.warn(`[SocketSecurity] Booking ${bookingId} not found`);
        return;
      }

      const currentUserId = socket.userId.toString();
      const isRider = booking.user && booking.user.toString() === currentUserId;
      const isDriver = booking.driver && booking.driver.toString() === currentUserId;
      const isCandidate =
        Array.isArray(booking.candidateDrivers) &&
        booking.candidateDrivers.some((c) => c && c.toString() === currentUserId);
      const isAdmin = socket.userRole === "admin";

      if (!isRider && !isDriver && !isCandidate && !isAdmin) {
        console.warn(`[SocketSecurity] Denied unauthorized user ${currentUserId} from joining booking-${bookingId}`);
        return;
      }

      socket.join(`booking-${bookingId}`);
      console.log(`[SocketSecurity] Authorized user ${currentUserId} (${socket.userRole}) joined room: booking-${bookingId}`);
    } catch (err) {
      console.error("[SocketSecurity] join-booking authorization error:", err);
    }
  });

  // Driver Location Updates: Verified against assigned booking driver
  socket.on("driver-location-update", async (data) => {
    if (!socket.userId || !data?.bookingId || !mongoose.Types.ObjectId.isValid(data.bookingId)) return;

    try {
      const booking = await mongoose.connection.collection("bookings").findOne(
        { _id: new mongoose.Types.ObjectId(data.bookingId) },
        { projection: { driver: 1 } }
      );

      if (!booking || booking.driver?.toString() !== socket.userId.toString()) {
        console.warn(`[SocketSecurity] Unauthorized location update for booking ${data.bookingId} by user ${socket.userId}`);
        return;
      }

      io.to(`booking-${data.bookingId}`).emit("driver-location", {
        latitude: data.latitude,
        longitude: data.longitude,
        status: data.status || "arriving",
      });
    } catch (err) {
      console.error("[SocketSecurity] driver-location-update error:", err);
    }
  });

  // Chat message authorization: Only booking participants
  socket.on("chat-message", async (msg) => {
    if (!socket.userId) return;
    const bookingId = msg?.rideId || msg?.bookingId;
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) return;

    try {
      const booking = await mongoose.connection.collection("bookings").findOne(
        { _id: new mongoose.Types.ObjectId(bookingId) },
        { projection: { user: 1, driver: 1 } }
      );
      if (!booking) return;

      const currentUserId = socket.userId.toString();
      const isParticipant =
        booking.user?.toString() === currentUserId ||
        booking.driver?.toString() === currentUserId ||
        socket.userRole === "admin";

      if (!isParticipant) {
        console.warn(`[SocketSecurity] Unauthorized chat message from user ${currentUserId} in booking ${bookingId}`);
        return;
      }

      io.to(`booking-${bookingId}`).emit("chat-message", msg);
    } catch (err) {
      console.error("[SocketSecurity] chat-message error:", err);
    }
  });

  // Call Signaling: Verified booking participants
  socket.on("call-user", async (data) => {
    if (!socket.userId || !data?.bookingId || !mongoose.Types.ObjectId.isValid(data.bookingId)) return;
    try {
      const booking = await mongoose.connection.collection("bookings").findOne(
        { _id: new mongoose.Types.ObjectId(data.bookingId) },
        { projection: { user: 1, driver: 1 } }
      );
      if (!booking) return;
      const currentUserId = socket.userId.toString();
      const isParticipant =
        booking.user?.toString() === currentUserId ||
        booking.driver?.toString() === currentUserId;
      if (!isParticipant) return;

      socket.to(`booking-${data.bookingId}`).emit("incoming-call", data);
    } catch (err) {
      console.error("[SocketSecurity] call-user error:", err);
    }
  });

  socket.on("accept-call", async (data) => {
    if (!socket.userId || !data?.bookingId) return;
    socket.to(`booking-${data.bookingId}`).emit("call-accepted", data);
  });

  socket.on("reject-call", async (data) => {
    if (!socket.userId || !data?.bookingId) return;
    socket.to(`booking-${data.bookingId}`).emit("call-rejected", data);
  });

  socket.on("end-call", async (data) => {
    if (!socket.userId || !data?.bookingId) return;
    socket.to(`booking-${data.bookingId}`).emit("call-ended", data);
  });

  socket.on("update-location", async ({ latitude, longitude }) => {
    if (!socket.userId) return;

    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      isNaN(latitude) ||
      isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return;
    }

    try {
      await User.findByIdAndUpdate(socket.userId, {
        location: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        lastLocationUpdate: new Date(),
        lastHeartbeat: new Date(),
      });
    } catch (err) {
      console.error("update-location db error:", err);
    }
  });

  socket.on("disconnect", async () => {
    if (!socket.userId) return;
    try {
      const user = await User.findById(socket.userId);
      const updateData = { socketId: null };
      if (user && user.role !== "vendor") {
        updateData.isOnline = false;
      }
      await User.findByIdAndUpdate(socket.userId, updateData);
    } catch (err) {
      console.error("Socket disconnect error:", err);
    }
  });
})

server.listen(port, () => {
  console.log("server started at", port)
})