/**
 * RideNow Distributed Idempotency Engine (Phase 12)
 *
 * Prevents duplicate transactions, double payments, and race-condition double-bookings
 * across distributed serverless lambda instances using Upstash Redis with local Map fallback.
 */
import { redisGet, redisSet } from "./redis";

export interface CachedIdempotentResponse {
  status: number;
  body: any;
  headers?: Record<string, string>;
  createdAt: number;
  expiresAt: number;
}

class IdempotencyEngine {
  private store: Map<string, CachedIdempotentResponse> = new Map();
  private cleanupTimer: NodeJS.Timeout;

  constructor() {
    this.cleanupTimer = setInterval(() => {
      this.evict();
    }, 15 * 60 * 1000); // 15 mins

    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Extracts idempotency key from request headers.
   */
  public getKey(req: Request): string | null {
    const key = req.headers.get("x-idempotency-key") || req.headers.get("idempotency-key");
    if (!key || key.trim().length === 0) return null;
    return key.trim();
  }

  /**
   * Retrieves any cached response for this key from distributed Redis or local store.
   */
  public async get(key: string): Promise<CachedIdempotentResponse | null> {
    // 1. Try distributed Upstash Redis first
    try {
      const redisRecord = await redisGet<CachedIdempotentResponse>(`idemp:${key}`);
      if (redisRecord && Date.now() <= redisRecord.expiresAt) {
        return redisRecord;
      }
    } catch (_) {}

    // 2. Fall back to local memory store
    const record = this.store.get(key);
    if (!record) return null;

    if (Date.now() > record.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return record;
  }

  /**
   * Stores response under this idempotency key in both Redis and memory.
   * Default TTL is 24 hours (86,400,000 ms).
   */
  public async set(
    key: string,
    status: number,
    body: any,
    headers?: Record<string, string>,
    ttlMs: number = 24 * 60 * 60 * 1000
  ): Promise<void> {
    const now = Date.now();
    const record: CachedIdempotentResponse = {
      status,
      body,
      headers,
      createdAt: now,
      expiresAt: now + ttlMs,
    };

    this.store.set(key, record);

    try {
      const ttlSeconds = Math.max(60, Math.round(ttlMs / 1000));
      await redisSet(`idemp:${key}`, record, ttlSeconds);
    } catch (_) {}
  }

  /**
   * Cleans up expired idempotency records from memory.
   */
  private evict(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

export const idempotency = new IdempotencyEngine();
