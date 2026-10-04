/**
 * RideNow Idempotency Engine (Phase 12)
 *
 * Prevents duplicate transactions, double payments, and race-condition double-bookings
 * when clients retry API calls over unreliable mobile connections.
 */

interface CachedIdempotentResponse {
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
   * Retrieves any cached response for this key.
   */
  public get(key: string): CachedIdempotentResponse | null {
    const record = this.store.get(key);
    if (!record) return null;

    if (Date.now() > record.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return record;
  }

  /**
   * Stores response under this idempotency key.
   * Default TTL is 24 hours (86,400,000 ms).
   */
  public set(
    key: string,
    status: number,
    body: any,
    headers?: Record<string, string>,
    ttlMs: number = 24 * 60 * 60 * 1000
  ): void {
    const now = Date.now();
    this.store.set(key, {
      status,
      body,
      headers,
      createdAt: now,
      expiresAt: now + ttlMs,
    });
  }

  /**
   * Cleans up expired idempotency records.
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
