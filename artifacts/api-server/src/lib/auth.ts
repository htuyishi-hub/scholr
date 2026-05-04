import crypto from "crypto";

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
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verify, "hex"));
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

const tokenStore = new Map<string, string>(); // token -> userId

export function storeToken(token: string, userId: string): void {
  tokenStore.set(token, userId);
}

export function getUserIdFromToken(token: string): string | undefined {
  return tokenStore.get(token);
}

export function removeToken(token: string): void {
  tokenStore.delete(token);
}
