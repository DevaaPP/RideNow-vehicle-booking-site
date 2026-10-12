import AuditLog from "@/models/auditLog.model";
import { NextRequest } from "next/server";
import mongoose from "mongoose";

export interface LogAdminActionParams {
  adminId: string | mongoose.Types.ObjectId;
  adminEmail?: string;
  action: string;
  targetId: string | mongoose.Types.ObjectId;
  targetType:
    | "VENDOR"
    | "VEHICLE"
    | "WALLET"
    | "WITHDRAWAL"
    | "PRICING"
    | "STUDENT_CONFIG"
    | "USER"
    | "SAFETY_INCIDENT"
    | string;
  reason?: string;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
  metadata?: Record<string, any>;
  req?: NextRequest;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Authoritative admin action audit logging service.
 * Records immutable audit logs for administrative decisions,
 * including document approvals, wallet adjustments, and withdrawals.
 */
export async function recordAuditLog(params: LogAdminActionParams) {
  try {
    let ip = params.ipAddress;
    let ua = params.userAgent;

    if (params.req) {
      ip =
        ip ||
        params.req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        params.req.headers.get("x-real-ip") ||
        "127.0.0.1";
      ua = ua || params.req.headers.get("user-agent") || undefined;
    }

    const logEntry = await AuditLog.create({
      admin: params.adminId,
      adminEmail: params.adminEmail,
      action: params.action,
      targetId: String(params.targetId),
      targetType: params.targetType,
      reason: params.reason,
      beforeState: params.beforeState,
      afterState: params.afterState,
      metadata: params.metadata,
      ipAddress: ip,
      userAgent: ua,
    });

    return logEntry;
  } catch (error) {
    // Audit logging failure is caught and logged to prevent aborting core transactions
    console.error("Failed to record admin audit log:", error);
    return null;
  }
}
