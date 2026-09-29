import "server-only";

import { scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import bcrypt from "bcryptjs";

const BCRYPT_COST = 12;

// A throwaway hash so a wrong username costs the same time as a wrong password.
const DUMMY_HASH = "$2b$12$.2GtaN0rid0TEoDBMQSrc.9DSm5icg3dQoJhkvEwHpCXlMZTXUS96";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

/**
 * Checks a bcrypt hash, or the older `scrypt:<salt>:<hash>` format that an
 * ADMIN_PASSWORD_HASH env value may still use.
 */
export async function verifyPassword(
  password: string,
  stored: string | undefined
): Promise<boolean> {
  if (stored?.startsWith("scrypt:")) {
    const [, saltB64, hashB64] = stored.split(":");
    const expected = Buffer.from(hashB64 ?? "", "base64url");
    if (!saltB64 || expected.length !== 64) return false;
    const actual = await scryptAsync(password, Buffer.from(saltB64, "base64url"), 64);
    return timingSafeEqual(actual, expected);
  }
  const ok = await bcrypt.compare(password, stored || DUMMY_HASH);
  return ok && Boolean(stored);
}
