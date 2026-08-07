import { useEffect } from "react";
import { useGetMe } from "@workspace/api-client-react";
import {
  ADMIN_TOKEN_KEY,
  clearAdminToken,
  ensureFreshAdminToken,
  hasValidAdminToken,
  refreshAdminToken,
} from "@/lib/admin-session";

export { ADMIN_TOKEN_KEY, clearAdminToken };
export const hasAdminToken = hasValidAdminToken;

function isUnauthorized(error: unknown): boolean {
  const status = (error as { status?: number } | null)?.status;
  return status === 401 || status === 403;
}

/**
 * Current admin user.
 *
 * Three rules keep this sustainable:
 *  1. The query only runs when a locally-valid (unexpired) token exists — an
 *     expired token never produces a 401 round-trip.
 *  2. A token nearing expiry is refreshed in the background, so an active admin
 *     keeps a sliding session instead of being logged out after N days.
 *  3. A token the server rejects is dropped immediately, which stops the
 *     guard/login redirect ping-pong that produced the `/api/auth/me` storm.
 */
export function useCurrentUser() {
  const enabled = hasValidAdminToken();

  useEffect(() => {
    if (enabled) void ensureFreshAdminToken();
  }, [enabled]);

  const query = useGetMe({
    query: {
      enabled,
      retry: false,
      retryOnMount: false,
      staleTime: 5 * 60 * 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    } as any,
  });

  const { error, refetch } = query;
  useEffect(() => {
    if (!error || !isUnauthorized(error)) return;
    // One last chance: the token may simply have aged out while the tab slept.
    void refreshAdminToken().then((ok) => {
      if (ok) void refetch();
      else clearAdminToken();
    });
  }, [error, refetch]);

  return { ...query, enabled };
}
