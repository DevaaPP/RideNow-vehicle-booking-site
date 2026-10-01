import express from "express"
import http from "http"
import dotenv from "dotenv"
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

const app=express()
app.use(express.json())
const server=http.createServer(app)
const port=process.env.PORT || 5000

const nextBaseUrl = process.env.NEXT_BASE_URL ? process.env.NEXT_BASE_URL.replace(/\/$/, "") : "http://localhost:3000";

const io=new Server(server,{
    cors:{
        origin: nextBaseUrl
    }
})



app.post("/emit", async (req, res) => {
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

io.on("connection", (socket) => {

  socket.on("identity", async (userId) => {
    socket.userId = userId;
    socket.join(`user-${userId}`);
    try {
      const user = await User.findById(userId);
      const updateData = { socketId: socket.id };
      if (user && user.role !== "vendor") {
        updateData.isOnline = true;
      }
      await User.findByIdAndUpdate(userId, updateData);
    } catch (err) {
      console.error("Socket identity error:", err);
    }
  });

  socket.on("join-booking", (bookingId) => {
    console.log("joining room:", `booking-${bookingId}`);
    socket.join(`booking-${bookingId}`);
  });

  socket.on("driver-location-update", (data) => {
    io.to(`booking-${data.bookingId}`)
      .emit("driver-location", {
        latitude: data.latitude,
        longitude: data.longitude,
        status: data.status || "arriving"
      });
  });

  socket.on("chat-message", (msg) => {
    const bookingId = msg.rideId || msg.bookingId;
    console.log("chat to room:", `booking-${bookingId}`);
    io.to(`booking-${bookingId}`).emit("chat-message", msg);
  });

  // Call Signaling (WebRTC in-ride call)
  socket.on("call-user", (data) => {
    console.log("call-user in room:", `booking-${data.bookingId}`);
    socket.to(`booking-${data.bookingId}`).emit("incoming-call", data);
  });

  socket.on("accept-call", (data) => {
    socket.to(`booking-${data.bookingId}`).emit("call-accepted", data);
  });

  socket.on("reject-call", (data) => {
    socket.to(`booking-${data.bookingId}`).emit("call-rejected", data);
  });

  socket.on("end-call", (data) => {
    socket.to(`booking-${data.bookingId}`).emit("call-ended", data);
  });

  socket.on("update-location", async ({ latitude, longitude }) => {

    if (!socket.userId) return

    await User.findByIdAndUpdate(socket.userId, {
      location: {
        type: "Point",
        coordinates: [longitude, latitude]
      }
    })

  })
 

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
  })

})






server.listen(port,()=>{
    console.log("server started at",port)
})