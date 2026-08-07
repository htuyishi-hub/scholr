import { useEffect } from "react";
import { useGetMe } from "@workspace/api-client-react";

export const ADMIN_TOKEN_KEY = "scholr_token";

export function hasAdminToken(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem(ADMIN_TOKEN_KEY));
}

export function clearAdminToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

function isUnauthorized(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status;
  return status === 401 || status === 403;
}

/**
 * Current admin user.
 *
 * The query is only enabled when an admin token is present, and a stale or
 * rejected token is wiped on the spot. Without that wipe, an expired token
 * produced an endless ping-pong: AuthGuard sees the 401 and redirects to
 * /admin/login, the login page still sees a token in localStorage and
 * redirects back to /admin/dashboard, the guard remounts and (because React
 * Query refetches errored queries on mount) fires `GET /api/auth/me` again —
 * several requests per second, which is the 401 storm in the server logs.
 */
export function useCurrentUser() {
  const enabled = hasAdminToken();
  const query = useGetMe({
    query: {
      enabled,
      retry: false,
      // Errored queries refetch on every remount by default; that turns any
      // redirect loop into a request storm.
      retryOnMount: false,
      staleTime: 5 * 60 * 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    } as any,
  });

  const { error } = query;
  useEffect(() => {
    if (error && isUnauthorized(error)) clearAdminToken();
  }, [error]);

  return { ...query, enabled };
}
