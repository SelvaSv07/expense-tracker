import { getRedis } from "@/lib/redis";
import type { MonthRef, TimePreset, TimeRange } from "@/lib/time-range";
import { getPreviousRange, getRangeFromPreset } from "@/lib/time-range";

const DATE_PREFIX = "__D:";

/** Bump this when serialized payload shape changes. */
const CACHE_SCHEMA = "v1";

const DEFAULT_TTL_SEC = 300;

function stringifyJson(value: unknown): string {
  return JSON.stringify(value, (_k, v) =>
    v instanceof Date ? `${DATE_PREFIX}${v.toISOString()}` : v,
  );
}

function parseJson<T>(raw: string): T {
  return JSON.parse(raw, (_k, v) => {
    if (typeof v === "string" && v.startsWith(DATE_PREFIX)) {
      return new Date(v.slice(DATE_PREFIX.length));
    }
    return v;
  }) as T;
}

async function getFinanceVersion(userId: string): Promise<string> {
  const redis = getRedis();
  if (!redis) return "0";
  const v = await redis.get(`expense:${CACHE_SCHEMA}:ver:${userId}`);
  return v ?? "0";
}

/** Invalidate all finance-related cache entries for a user (O(1); relies on versioned keys). */
export async function bumpUserFinanceCache(userId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  await redis.incr(`expense:${CACHE_SCHEMA}:ver:${userId}`);
}

export function financeRangeKey(
  preset: TimePreset,
  custom?: { from: Date; to: Date },
  monthRef?: MonthRef,
  opts?: { range?: TimeRange; prev?: TimeRange },
): string {
  const now = new Date();
  const range =
    opts?.range ?? getRangeFromPreset(preset, now, custom, monthRef);
  const prev =
    opts?.prev ?? getPreviousRange(preset, now, custom, monthRef);
  return [
    preset,
    custom ? `${custom.from.toISOString()}_${custom.to.toISOString()}` : "-",
    monthRef ? `${monthRef.year}-${monthRef.monthIndex}` : "-",
    `${range.start.toISOString()}_${range.end.toISOString()}`,
    `${prev.start.toISOString()}_${prev.end.toISOString()}`,
  ].join("|");
}

/** Same time window as `getRangeFromPreset` / optional `opts.range` — for queries that do not use a "previous" period. */
export function financeRangeKeyRangeOnly(
  preset: TimePreset,
  custom?: { from: Date; to: Date },
  monthRef?: MonthRef,
  opts?: { range?: TimeRange },
): string {
  const now = new Date();
  const range =
    opts?.range ?? getRangeFromPreset(preset, now, custom, monthRef);
  return [
    preset,
    custom ? `${custom.from.toISOString()}_${custom.to.toISOString()}` : "-",
    monthRef ? `${monthRef.year}-${monthRef.monthIndex}` : "-",
    `${range.start.toISOString()}_${range.end.toISOString()}`,
  ].join("|");
}

export async function cacheGetOrSet<T>(
  userId: string,
  part: string,
  fetcher: () => Promise<T>,
  ttlSec = DEFAULT_TTL_SEC,
): Promise<T> {
  const redis = getRedis();
  if (!redis) return fetcher();

  const ver = await getFinanceVersion(userId);
  const key = `expense:${CACHE_SCHEMA}:${userId}:${ver}:${part}`;

  const hit = await redis.get(key);
  if (hit) {
    try {
      return parseJson<T>(hit);
    } catch {
      // fall through
    }
  }

  const val = await fetcher();
  await redis.set(key, stringifyJson(val), "EX", ttlSec);
  return val;
}
