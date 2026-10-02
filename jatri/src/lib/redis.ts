import { Redis } from "@upstash/redis";

/**
 * Upstash Redis Client Singleton
 *
 * Configured via:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 *
 * If environment variables are missing (e.g. in local dev before setup),
 * all cache functions fail safely and silently so the application continues
 * to function using MongoDB and local fallbacks without throwing errors.
 */

let redisInstance: Redis | null = null;
let hasLoggedMissingEnv = false;

export function getRedis(): Redis | null {
  if (redisInstance) return redisInstance;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (!hasLoggedMissingEnv && process.env.NODE_ENV !== "production") {
      console.info(
        "[Upstash Redis] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not configured. Using local/direct fallbacks."
      );
      hasLoggedMissingEnv = true;
    }
    return null;
  }

  try {
    redisInstance = new Redis({
      url,
      token,
    });
    return redisInstance;
  } catch (err) {
    console.error("[Upstash Redis] Initialization error:", err);
    return null;
  }
}

/**
 * Safe Get from Redis
 */
export async function redisGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const data = await redis.get<T>(key);
    return data ?? null;
  } catch (err) {
    console.warn(`[Upstash Redis] Failed to get key "${key}":`, err);
    return null;
  }
}

/**
 * Safe Set in Redis with optional TTL (in seconds)
 */
export async function redisSet(
  key: string,
  value: any,
  ttlSeconds?: number
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    if (ttlSeconds && ttlSeconds > 0) {
      await redis.set(key, value, { ex: ttlSeconds });
    } else {
      await redis.set(key, value);
    }
    return true;
  } catch (err) {
    console.warn(`[Upstash Redis] Failed to set key "${key}":`, err);
    return false;
  }
}

/**
 * Safe Delete from Redis
 */
export async function redisDel(key: string | string[]): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;

  try {
    if (Array.isArray(key)) {
      if (key.length > 0) await redis.del(...key);
    } else {
      await redis.del(key);
    }
    return true;
  } catch (err) {
    console.warn(`[Upstash Redis] Failed to delete key(s):`, err);
    return false;
  }
}

/**
 * Safe Atomic Increment (e.g. for rate limiting or request counters)
 */
export async function redisIncr(
  key: string,
  ttlSeconds?: number
): Promise<number | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const count = await redis.incr(key);
    if (ttlSeconds && count === 1) {
      await redis.expire(key, ttlSeconds);
    }
    return count;
  } catch (err) {
    console.warn(`[Upstash Redis] Failed to incr key "${key}":`, err);
    return null;
  }
}

export default getRedis;
