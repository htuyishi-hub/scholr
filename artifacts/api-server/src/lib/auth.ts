import crypto from "crypto";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const verify = crypto
    .pbkdf2Sync(password, salt, 10000, 64, "sha512")
    .toString("hex");
  return crypto.timingSafeEqual(
    Buffer.from(hash, "hex"),
    Buffer.from(verify, "hex"),
  );
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // Fail closed: no secret means we cannot issue/verify tokens.
    throw new Error("JWT_SECRET environment variable is required");
  }
  return new TextEncoder().encode(secret);
}

type TokenClaims = {
  sub: string;
  role?: string;
};

// Access token lifetime: 30 days. The client silently refreshes long before
// this, so an active admin is never logged out mid-session.
const DEFAULT_EXP_SECONDS = 60 * 60 * 24 * 30;

// A token that expired at most this long ago can still be exchanged for a
// fresh one (sliding session). Beyond it, the admin must sign in again.
export const REFRESH_GRACE_SECONDS = 60 * 60 * 24 * 7;

export async function generateToken(userId: string, role?: string): Promise<string> {
  const secret = getJwtSecret();
  const iat = Math.floor(Date.now() / 1000);

  return await new SignJWT({ role } as TokenClaims)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt(iat)
    .setExpirationTime(iat + DEFAULT_EXP_SECONDS)
    .sign(secret);
}

export async function getUserIdFromToken(token: string): Promise<string | undefined> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    return (payload as JWTPayload).sub as string | undefined;
  } catch {
    return undefined;
  }
}

/**
 * Verify a token for the refresh endpoint, tolerating recent expiry so a user
 * who comes back after a few days keeps their session instead of hitting a
 * 401 wall.
 */
export async function getUserIdForRefresh(token: string): Promise<{ userId: string; role?: string } | undefined> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
      clockTolerance: REFRESH_GRACE_SECONDS,
    });
    const sub = (payload as JWTPayload).sub;
    if (!sub) return undefined;
    return { userId: sub, role: (payload as TokenClaims).role };
  } catch {
    return undefined;
  }
}

// Back-compat helpers for existing routes.
// With JWT we no longer store tokens server-side.
export function storeToken(_token: string, _userId: string): void {
  // no-op
}

export function removeToken(_token: string): void {
  // no-op (tokens expire naturally)
}

