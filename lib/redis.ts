import Redis from "ioredis";

declare global {
  // Avoid duplicate connections during Next.js dev HMR. Only store a real client — never cache "no redis".
  // Otherwise the first load (e.g. build without REDIS_URL) locks out Redis until process restart.
  // eslint-disable-next-line no-var
  var __expenseRedis: Redis | undefined;
}

function createRedis(url: string): Redis {
  return new Redis(url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    connectTimeout: 10_000,
    lazyConnect: true,
  });
}

/** Shared Redis client for Better Auth secondary storage and app caching. Returns null when `REDIS_URL` is unset. */
export function getRedis(): Redis | null {
  if (globalThis.__expenseRedis) {
    return globalThis.__expenseRedis;
  }

  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    return null;
  }

  globalThis.__expenseRedis = createRedis(url);
  return globalThis.__expenseRedis;
}
