type HeaderReader = {
  get(name: string): string | null;
};

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: number;
};

declare global {
  var __teseractoRateLimitStore: Map<string, RateLimitBucket> | undefined;
}

function getRateLimitStore(): Map<string, RateLimitBucket> {
  globalThis.__teseractoRateLimitStore ??= new Map<string, RateLimitBucket>();
  return globalThis.__teseractoRateLimitStore;
}

function cleanupExpiredBuckets(store: Map<string, RateLimitBucket>, now: number) {
  for (const [key, bucket] of store.entries()) {
    if (bucket.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function getClientIdentifier(headers: HeaderReader): string {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  const realIp = headers.get("x-real-ip") || headers.get("cf-connecting-ip");
  if (realIp?.trim()) {
    return realIp.trim();
  }

  return "unknown";
}

export function takeRateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  const now = Date.now();
  const store = getRateLimitStore();

  cleanupExpiredBuckets(store, now);

  const currentBucket = store.get(key);
  if (!currentBucket || currentBucket.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(limit - 1, 0),
      retryAfterSeconds: Math.ceil(windowMs / 1000),
      resetAt,
    };
  }

  if (currentBucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(Math.ceil((currentBucket.resetAt - now) / 1000), 1),
      resetAt: currentBucket.resetAt,
    };
  }

  currentBucket.count += 1;
  store.set(key, currentBucket);

  return {
    allowed: true,
    remaining: Math.max(limit - currentBucket.count, 0),
    retryAfterSeconds: Math.max(Math.ceil((currentBucket.resetAt - now) / 1000), 1),
    resetAt: currentBucket.resetAt,
  };
}
