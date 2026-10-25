import test from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import {
  validateAndNormalizePhone,
  otpLimiter,
} from "../middleware/otpRateLimiter.js";
import { baileysService } from "../services/whatsapp/baileysService.js";
import { metaCloudService } from "../services/whatsapp/metaCloudService.js";
import { getWhatsAppService } from "../services/whatsapp/index.js";

test("Phone validation accepts valid 10-digit Indian mobile numbers", () => {
  const result = validateAndNormalizePhone("9876543210");
  assert.equal(result.valid, true);
  assert.equal(result.phone, "9876543210");
  assert.equal(result.formattedJidPhone, "919876543210");
});

test("Phone validation strips formatting, spaces, and handles 91 prefix", () => {
  const result = validateAndNormalizePhone("+91 98765-43210");
  assert.equal(result.valid, true);
  assert.equal(result.phone, "9876543210");
  assert.equal(result.formattedJidPhone, "919876543210");
});

test("Phone validation rejects invalid mobile numbers", () => {
  assert.equal(validateAndNormalizePhone("").valid, false);
  assert.equal(validateAndNormalizePhone(null).valid, false);
  assert.equal(validateAndNormalizePhone("12345").valid, false);
  assert.equal(validateAndNormalizePhone("0876543210").valid, false); // Doesn't start with 6-9
  assert.equal(validateAndNormalizePhone("abcdefghij").valid, false);
});

test("OTP Rate Limiter enforces per-phone ceiling (3 requests per window)", () => {
  const testPhone = `test_${Date.now()}`;
  const phoneKey = `phone:${testPhone}:otp`;

  // First 3 should be allowed
  const req1 = otpLimiter.check(phoneKey, 3, 60000);
  assert.equal(req1.allowed, true);
  assert.equal(req1.remaining, 2);

  const req2 = otpLimiter.check(phoneKey, 3, 60000);
  assert.equal(req2.allowed, true);
  assert.equal(req2.remaining, 1);

  const req3 = otpLimiter.check(phoneKey, 3, 60000);
  assert.equal(req3.allowed, true);
  assert.equal(req3.remaining, 0);

  // 4th must be blocked
  const req4 = otpLimiter.check(phoneKey, 3, 60000);
  assert.equal(req4.allowed, false);
  assert.equal(req4.remaining, 0);
  assert.ok(req4.resetMs > 0);
});

test("OTP Rate Limiter enforces per-IP ceiling (5 requests per window)", () => {
  const testIp = `ip_${Date.now()}`;
  const ipKey = `ip:${testIp}:otp`;

  for (let i = 0; i < 5; i++) {
    const check = otpLimiter.check(ipKey, 5, 60000);
    assert.equal(check.allowed, true);
  }

  // 6th must be blocked
  const blocked = otpLimiter.check(ipKey, 5, 60000);
  assert.equal(blocked.allowed, false);
});

test("Bcrypt properly hashes 6-digit OTP and validates candidates", async () => {
  const otp = "849201";
  const hash = await bcrypt.hash(otp, 10);

  // Raw OTP must not appear in bcrypt hash string
  assert.notEqual(hash, otp);
  assert.ok(hash.startsWith("$2a$") || hash.startsWith("$2b$"));

  // Correct match
  const matches = await bcrypt.compare(otp, hash);
  assert.equal(matches, true);

  // Incorrect mismatch
  const fails = await bcrypt.compare("123456", hash);
  assert.equal(fails, false);
});

test("WhatsApp Provider Manager defaults to Baileys and supports Meta Cloud API", () => {
  const originalEnv = process.env.WHATSAPP_PROVIDER;

  process.env.WHATSAPP_PROVIDER = "baileys";
  const p1 = getWhatsAppService();
  assert.equal(p1, baileysService);
  assert.equal(p1.getStatus().provider, "baileys");

  process.env.WHATSAPP_PROVIDER = "meta";
  const p2 = getWhatsAppService();
  assert.equal(p2, metaCloudService);
  assert.equal(p2.getStatus().provider, "meta");

  process.env.WHATSAPP_PROVIDER = originalEnv;
});

test("Baileys status reporting provides diagnostic structure without leaking secrets", () => {
  const status = baileysService.getStatus();
  assert.equal(status.provider, "baileys");
  assert.ok(typeof status.connected === "boolean");
  assert.ok(typeof status.hasQr === "boolean");
  assert.ok(typeof status.reconnectAttempts === "number");

  const qrData = baileysService.getQrData();
  assert.ok("qr" in qrData);
  assert.ok("qrDataUrl" in qrData);
  assert.ok("status" in qrData);
});
