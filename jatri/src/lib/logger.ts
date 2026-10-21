/**
 * Structured Logger for RideNow / Jaatri
 * Standard JSON log emitter for cloud observability (Vercel Log Drains, Datadog, Axiom, CloudWatch).
 */

export type LogLevel = "info" | "warn" | "error" | "critical";

export interface StructuredLogPayload {
  level: LogLevel;
  event: string;
  message?: string;
  timestamp: string;
  bookingId?: string;
  userId?: string;
  driverId?: string;
  transactionId?: string;
  paymentId?: string;
  amount?: number;
  error?: string;
  stack?: string;
  [key: string]: unknown;
}

export function logEvent(level: LogLevel, event: string, data?: Record<string, unknown>) {
  const payload: StructuredLogPayload = {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...data,
  };

  const jsonStr = JSON.stringify(payload);
  if (level === "error" || level === "critical") {
    console.error(jsonStr);
  } else if (level === "warn") {
    console.warn(jsonStr);
  } else {
    console.log(jsonStr);
  }
}

export const logger = {
  info: (event: string, data?: Record<string, unknown>) => logEvent("info", event, data),
  warn: (event: string, data?: Record<string, unknown>) => logEvent("warn", event, data),
  error: (event: string, data?: Record<string, unknown>) => logEvent("error", event, data),
  critical: (event: string, data?: Record<string, unknown>) => logEvent("critical", event, data),
};

export default logger;
