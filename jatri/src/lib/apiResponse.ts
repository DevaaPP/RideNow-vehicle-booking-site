/**
 * RideNow Centralized API Response & Standardized Architecture Framework (Phase 12)
 *
 * Implements:
 * 1. Standardized Response Envelope (success, data, error, meta)
 * 2. Proper HTTP Status Codes & Helpers
 * 3. Request ID Tracing (X-Request-Id)
 * 4. Pagination Parser & Meta Calculator
 * 5. Secure Structured Logging with Automatic Secret/PII Redaction
 */

import { NextResponse } from "next/server";

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiMeta {
  requestId: string;
  timestamp: string;
  pagination?: PaginationMeta;
  [key: string]: any;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: any;
}

export interface StandardApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiErrorPayload;
  meta: ApiMeta;
}

/**
 * Extracts or generates a unique request ID.
 */
export function getRequestId(req?: Request): string {
  if (req) {
    const existing = req.headers.get("x-request-id") || req.headers.get("x-correlation-id");
    if (existing) return existing;
  }
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Formats a successful API response envelope.
 */
export function apiSuccess<T>(
  data: T,
  options?: {
    message?: string;
    status?: number;
    meta?: Record<string, any>;
    pagination?: {
      page: number;
      limit: number;
      total: number;
    };
    req?: Request;
    headers?: HeadersInit;
  }
): NextResponse<StandardApiResponse<T>> {
  const status = options?.status ?? HTTP_STATUS.OK;
  const requestId = getRequestId(options?.req);
  const now = new Date().toISOString();

  let paginationMeta: PaginationMeta | undefined;
  if (options?.pagination) {
    const { page, limit, total } = options.pagination;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    paginationMeta = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  const payload: StandardApiResponse<T> = {
    success: true,
    data,
    message: options?.message,
    meta: {
      requestId,
      timestamp: now,
      ...(paginationMeta ? { pagination: paginationMeta } : {}),
      ...(options?.meta || {}),
    },
  };

  const responseHeaders = new Headers(options?.headers);
  responseHeaders.set("X-Request-Id", requestId);

  return NextResponse.json(payload, {
    status,
    headers: responseHeaders,
  });
}

/**
 * Formats a standardized error API response envelope.
 */
export function apiError(
  message: string,
  options?: {
    status?: number;
    code?: string;
    details?: any;
    req?: Request;
    headers?: HeadersInit;
  }
): NextResponse<StandardApiResponse<never>> {
  const status = options?.status ?? HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const code = options?.code ?? getDefaultErrorCode(status);
  const requestId = getRequestId(options?.req);
  const now = new Date().toISOString();

  const payload: StandardApiResponse<never> = {
    success: false,
    message,
    error: {
      code,
      message,
      ...(options?.details ? { details: options.details } : {}),
    },
    meta: {
      requestId,
      timestamp: now,
    },
  };

  const responseHeaders = new Headers(options?.headers);
  responseHeaders.set("X-Request-Id", requestId);

  return NextResponse.json(payload, {
    status,
    headers: responseHeaders,
  });
}

function getDefaultErrorCode(status: number): string {
  switch (status) {
    case 400: return "BAD_REQUEST";
    case 401: return "UNAUTHORIZED";
    case 403: return "FORBIDDEN";
    case 404: return "NOT_FOUND";
    case 409: return "CONFLICT";
    case 422: return "UNPROCESSABLE_ENTITY";
    case 429: return "RATE_LIMIT_EXCEEDED";
    case 503: return "SERVICE_UNAVAILABLE";
    default: return "INTERNAL_SERVER_ERROR";
  }
}

/**
 * Parses and sanitizes URL pagination query parameters.
 */
export function parsePagination(
  req: Request,
  defaultLimit = 20,
  maxLimit = 100
): { page: number; limit: number; skip: number } {
  try {
    const url = new URL(req.url);
    const rawPage = parseInt(url.searchParams.get("page") || "1", 10);
    const rawLimit = parseInt(url.searchParams.get("limit") || defaultLimit.toString(), 10);

    const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
    const limit = isNaN(rawLimit) || rawLimit < 1 ? defaultLimit : Math.min(rawLimit, maxLimit);
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  } catch {
    return { page: 1, limit: defaultLimit, skip: 0 };
  }
}

/**
 * Masking utility for sensitive keys in logs and payloads.
 */
const SENSITIVE_KEYS = new Set([
  "password",
  "otp",
  "secret",
  "authorization",
  "token",
  "apikey",
  "api_key",
  "cookie",
  "session",
  "bankaccount",
  "accountnumber",
  "cvv",
]);

export function sanitizeForLogging(obj: any, depth = 0): any {
  if (depth > 5 || !obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeForLogging(item, depth + 1));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase().replace(/[-_]/g, "");
    if (SENSITIVE_KEYS.has(lowerKey)) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeForLogging(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Structured logger with request-tagging and secret redaction.
 */
export const logger = {
  info: (message: string, meta?: any, req?: Request) => {
    const reqId = getRequestId(req);
    console.log(
      JSON.stringify({
        level: "INFO",
        requestId: reqId,
        message,
        ...(meta ? { meta: sanitizeForLogging(meta) } : {}),
        timestamp: new Date().toISOString(),
      })
    );
  },
  warn: (message: string, meta?: any, req?: Request) => {
    const reqId = getRequestId(req);
    console.warn(
      JSON.stringify({
        level: "WARN",
        requestId: reqId,
        message,
        ...(meta ? { meta: sanitizeForLogging(meta) } : {}),
        timestamp: new Date().toISOString(),
      })
    );
  },
  error: (message: string, error?: any, req?: Request) => {
    const reqId = getRequestId(req);
    console.error(
      JSON.stringify({
        level: "ERROR",
        requestId: reqId,
        message,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      })
    );
  },
};
