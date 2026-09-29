import "server-only";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const attempts = new Map<string, { count: number; resetAt: number }>();

/** In-memory per-IP limiter for login attempts (single-server deployments). */
export function checkLoginRateLimit(key: string): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    return { allowed: true, retryAfterSeconds: 0 };
  }
  return {
    allowed: entry.count < MAX_ATTEMPTS,
    retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
  };
}

export function recordFailedLogin(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export function clearLoginAttempts(key: string) {
  attempts.delete(key);
}
