import { getDb } from "@/db/client";

const WINDOW_MS = 10 * 60 * 1000;

/**
 * Shared only by processes that use the same database.
 * An embedded database on one machine does not limit other instances.
 * A failed read or write rejects the attempt.
 */
export async function consumeRateLimit(input: {
  bucket: string;
  limit: number;
  windowMs?: number;
}): Promise<{ ok: true; remaining: number } | { ok: false; error: string }> {
  const windowMs = input.windowMs ?? WINDOW_MS;
  const windowStart = new Date(
    Math.floor(Date.now() / windowMs) * windowMs,
  ).toISOString();
  const bucket = input.bucket.slice(0, 200);
  try {
    const db = await getDb();
    const result = await db.query<{ count: number }>(
      `INSERT INTO rate_limit_buckets (bucket, window_start, count)
       VALUES ($1, $2::timestamptz, 1)
       ON CONFLICT (bucket, window_start)
       DO UPDATE SET count = rate_limit_buckets.count + 1
       RETURNING count`,
      [bucket, windowStart],
    );
    const count = Number(result.rows[0]?.count ?? input.limit + 1);
    if (!Number.isFinite(count) || count > input.limit) {
      return { ok: false, error: "Too many attempts. Wait a few minutes and try again." };
    }
    return { ok: true, remaining: input.limit - count };
  } catch {
    return { ok: false, error: "Too many attempts. Wait a few minutes and try again." };
  }
}

function boundedLimit(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 1000) return fallback;
  return value;
}

export function loginAttemptLimit(): number {
  return boundedLimit("RATE_LIMIT_LOGIN", 30);
}

export function reviewSubmitLimit(): number {
  return boundedLimit("RATE_LIMIT_REVIEW", 20);
}

export function pdfInspectLimit(): number {
  return boundedLimit("RATE_LIMIT_PDF", 8);
}
