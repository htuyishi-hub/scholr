import { useGetMe } from "@workspace/api-client-react";

export const ADMIN_TOKEN_KEY = "scholr_token";

export function hasAdminToken(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem(ADMIN_TOKEN_KEY));
}

/**
 * Current admin user.
 *
 * The query is only enabled when an admin token is present. Without this gate
 * every admin surface fired `GET /api/auth/me` on mount for signed-out
 * visitors, producing a burst of 401 responses that hurt both performance and
 * the browser's error console.
 */
export function useCurrentUser() {
  const enabled = hasAdminToken();
  const query = useGetMe({
    query: {
      enabled,
      retry: false,
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      // Prevent the 401 storm that fires when the browser reconnects after a
      // network drop (ERR_INTERNET_DISCONNECTED → reconnect → refetch loop).
      refetchOnReconnect: false,
    } as any,
  });

  return { ...query, enabled };
}
