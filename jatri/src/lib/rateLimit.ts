/**
 * RideNow Rate Limiting & Brute-Force Protection Utility (Phase 11)
 *
 * Implements an in-memory sliding window rate limiter with auto-eviction
 * to protect against:
 * 1. OTP flooding / SMS & WhatsApp quota exhaustion
 * 2. OTP brute-force guessing attacks
 * 3. Credential stuffing and automated registration bots
 * 4. API scraping & DDoS attacks
 */

interface RateLimitRecord {
  timestamps: number[];
  blockedUntil?: number;
}

class SlidingWindowRateLimiter {
  private store: Map<string, RateLimitRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Evict expired entries every 5 minutes to prevent memory leaks
    this.cleanupInterval = setInterval(() => {
      this.evict();
    }, 5 * 60 * 1000);

    // Unref so this timer doesn't prevent Node.js from exiting in scripts
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Evaluates if a request from an identifier is allowed under the rate limit.
   */
  public check(
    identifier: string,
    limit: number,
    windowMs: number
  ): {
    allowed: boolean;
    remaining: number;
    resetMs: number;
    blockedRemainingMs?: number;
  } {
    const now = Date.now();
    const windowStart = now - windowMs;

    let record = this.store.get(identifier);
    if (!record) {
      record = { timestamps: [] };
      this.store.set(identifier, record);
    }

    // Check if identifier is under an active temporary lockout block
    if (record.blockedUntil && record.blockedUntil > now) {
      return {
        allowed: false,
        remaining: 0,
        resetMs: record.blockedUntil - now,
        blockedRemainingMs: record.blockedUntil - now,
      };
    }

    // Filter timestamps within the current sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= limit) {
      // Over limit - calculate time until oldest entry rolls out of window
      const oldest = record.timestamps[0];
      const resetMs = Math.max(1000, oldest + windowMs - now);

      return {
        allowed: false,
        remaining: 0,
        resetMs,
      };
    }

    // Add current timestamp and allow
    record.timestamps.push(now);
    const remaining = Math.max(0, limit - record.timestamps.length);

    return {
      allowed: true,
      remaining,
      resetMs: windowMs,
    };
  }

  /**
   * Explicitly locks out an identifier for a penalizing duration (e.g. after 5 failed OTP attempts).
   */
  public lockout(identifier: string, lockoutMs: number) {
    const now = Date.now();
    let record = this.store.get(identifier);
    if (!record) {
      record = { timestamps: [] };
      this.store.set(identifier, record);
    }
    record.blockedUntil = now + lockoutMs;
  }

  /**
   * Resets limit for an identifier (e.g. on successful login/verification).
   */
  public reset(identifier: string) {
    this.store.delete(identifier);
  }

  /**
   * Garbage collection of inactive records.
   */
  private evict() {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour
    for (const [key, record] of this.store.entries()) {
      if (
        (!record.blockedUntil || record.blockedUntil <= now) &&
        (record.timestamps.length === 0 || now - record.timestamps[record.timestamps.length - 1] > maxAge)
      ) {
        this.store.delete(key);
      }
    }
  }
}

export const rateLimiter = new SlidingWindowRateLimiter();

/**
 * Extracts a dependable client identifier from the request headers and IP.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

/**
 * Generates standard rate limit headers.
 */
export function getRateLimitHeaders(limit: number, remaining: number, resetMs: number): HeadersInit {
  return {
    "X-RateLimit-Limit": limit.toString(),
    "X-RateLimit-Remaining": Math.max(0, remaining).toString(),
    "X-RateLimit-Reset": Math.ceil((Date.now() + resetMs) / 1000).toString(),
    "Retry-After": Math.ceil(resetMs / 1000).toString(),
  };
}
