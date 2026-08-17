/**
 * Admin session helpers.
 *
 * The admin token is a JWT. Instead of waiting for it to expire and letting the
 * app discover that through a 401 on `/api/auth/me`, we read the `exp` claim
 * locally and refresh the token in the background well before it lapses. That
 * makes the session sustainable: an admin who keeps using the dashboard is
 * never signed out, and an admin whose token is truly dead is sent to the login
 * page without hitting the API at all.
 */

export const ADMIN_TOKEN_KEY = "scholr_token";

// Refresh once the token is inside this window of its expiry.
const REFRESH_WINDOW_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
// Treat a token expiring within this many ms as already dead.
const CLOCK_SKEW_MS = 30 * 1000;

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

function decodeExpiryMs(token: string): number | null {
  const part = token.split(".")[1];
  if (!part) return null;
  try {
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(json) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/** True when a token exists and has not (locally) expired. */
export function hasValidAdminToken(): boolean {
  const token = getAdminToken();
  if (!token) return false;
  const expiresAt = decodeExpiryMs(token);
  // Opaque/unknown shape: let the server be the judge.
  if (expiresAt === null) return true;
  if (expiresAt - CLOCK_SKEW_MS <= Date.now()) {
    clearAdminToken();
    return false;
  }
  return true;
}

/** Back-compat alias used by existing call sites. */
export const hasAdminToken = hasValidAdminToken;

function apiBase(): string {
  const configured = (
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    ""
  )
    .trim()
    .replace(/\/+$/, "");
  return configured || window.location.origin;
}

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Swap the current token for a fresh one. De-duplicated so concurrent callers
 * (several admin screens mounting at once) never stampede the endpoint.
 */
export async function refreshAdminToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  const token = getAdminToken();
  if (!token) return false;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${apiBase()}/api/auth/refresh`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        clearAdminToken();
        return false;
      }
      if (!res.ok) return false;
      const data = (await res.json()) as { token?: string };
      if (!data.token) return false;
      setAdminToken(data.token);
      return true;
    } catch {
      // Network hiccup: keep the existing token, try again later.
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/** Refresh in the background when the token is close to expiring. */
export async function ensureFreshAdminToken(): Promise<void> {
  const token = getAdminToken();
  if (!token) return;
  const expiresAt = decodeExpiryMs(token);
  if (expiresAt === null) return;
  if (expiresAt - Date.now() > REFRESH_WINDOW_MS) return;
  await refreshAdminToken();
}
