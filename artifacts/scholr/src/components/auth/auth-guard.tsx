import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useCurrentUser, hasAdminToken } from "@/hooks/use-current-user";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, error, enabled } = useCurrentUser();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // No token at all: redirect immediately without hitting the API.
    if (!hasAdminToken()) {
      setLocation("/admin/login");
      return;
    }
    if (!isLoading && (!user || error)) {
      setLocation("/admin/login");
    }
  }, [user, isLoading, error, setLocation]);

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
