import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import mongoose from "mongoose";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import otpRoutes from "../routes/otpRoutes.js";
import Otp from "../models/otp.model.js";

// Create test express app
const app = express();
app.use(express.json());
app.use("/api/otp", otpRoutes);

const server = http.createServer(app);

let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test("GET /api/otp/status returns 200 and engine health", async () => {
  const res = await fetch(`${baseUrl}/api/otp/status`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.provider, "baileys");
  assert.equal(typeof data.connected, "boolean");
});

test("GET /api/otp/qr returns 200 and QR structure", async () => {
  const res = await fetch(`${baseUrl}/api/otp/qr`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok("qr" in data);
  assert.ok("qrDataUrl" in data);
});

test("POST /api/otp/send rejects missing or invalid mobile numbers", async () => {
  // Empty body
  const res1 = await fetch(`${baseUrl}/api/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.equal(res1.status, 400);

  // Short invalid number
  const res2 = await fetch(`${baseUrl}/api/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "12345" }),
  });
  assert.equal(res2.status, 400);
});

test("POST /api/otp/send handles valid mobile number and triggers cooldown", async () => {
  const testPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;

  const res1 = await fetch(`${baseUrl}/api/otp/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "192.168.1.100",
    },
    body: JSON.stringify({ mobileNumber: testPhone }),
  });

  const data1 = await res1.json();
  assert.equal(res1.status, 200);
  assert.equal(data1.success, true);
  assert.equal(data1.channel, "whatsapp");
  assert.equal(data1.expiresInSeconds, 300);

  // Immediate second request should be blocked by 60s cooldown
  const res2 = await fetch(`${baseUrl}/api/otp/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "192.168.1.100",
    },
    body: JSON.stringify({ mobileNumber: testPhone }),
  });

  assert.equal(res2.status, 429);
  const data2 = await res2.json();
  assert.equal(data2.success, false);
  assert.ok(data2.cooldownSeconds > 0);
});

test("POST /api/otp/verify rejects invalid 6-digit candidate format", async () => {
  const res = await fetch(`${baseUrl}/api/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: "9876543210", otp: "12" }),
  });
  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.success, false);
});
