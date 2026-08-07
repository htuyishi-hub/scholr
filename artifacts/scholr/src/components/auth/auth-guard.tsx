import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { hasValidAdminToken } from "@/lib/admin-session";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, error, enabled } = useCurrentUser();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // No usable token (missing or locally expired): straight to login, no API
    // call. On a 401 the session hook attempts a silent refresh first and only
    // clears the token when that fails — so we key the redirect off the token,
    // never off the error alone. That's what stops the login/guard ping-pong
    // which used to hammer /api/auth/me.
    if (!hasValidAdminToken()) {
      setLocation("/admin/login");
    }
  }, [user, isLoading, error, enabled, setLocation]);

  if (enabled && isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-background"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
        <span className="sr-only">Checking your session…</span>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
