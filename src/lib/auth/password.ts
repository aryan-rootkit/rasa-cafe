import "server-only";

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

const KEY_LENGTH = 64;

// A throwaway hash so a wrong username costs the same time as a wrong password.
const DUMMY_HASH =
  "scrypt:AAAAAAAAAAAAAAAAAAAAAA:" + "A".repeat(86);

/** Same `scrypt:<salt>:<hash>` format as `npm run hash-password`. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEY_LENGTH);
  return `scrypt:${salt.toString("base64url")}:${hash.toString("base64url")}`;
}

/** Verifies against `scrypt:<salt>:<hash>` (base64url), as produced by `npm run hash-password`. */
export async function verifyPassword(
  password: string,
  stored: string | undefined
): Promise<boolean> {
  const [scheme, saltB64, hashB64] = (stored || DUMMY_HASH).split(":");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;

  const expected = Buffer.from(hashB64, "base64url");
  if (expected.length !== KEY_LENGTH) return false;

  const actual = await scryptAsync(
    password,
    Buffer.from(saltB64, "base64url"),
    KEY_LENGTH
  );
  return timingSafeEqual(actual, expected) && Boolean(stored);
}
