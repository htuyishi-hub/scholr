/**
 * Auth0 Callback Page
 * Auth0 redirects here after social login. We exchange the Auth0 user
 * for a Scholr student session and redirect to the dashboard.
 */
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useAuth0 } from "@auth0/auth0-react";
import { useStudent } from "@/hooks/use-student-auth";
import { Loader2 } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function Auth0Callback() {
  const { isLoading, isAuthenticated, user, error, getAccessTokenSilently } = useAuth0();
  const { setStudent } = useStudent();
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errMsg, setErrMsg] = useState("");
  const called = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (error) { setErrMsg(error.message); setStatus("error"); return; }
    if (!isAuthenticated || !user) { setLocation("/login"); return; }
    if (called.current) return;
    called.current = true;

    const exchange = async () => {
      try {
        const res = await fetch(`${BASE}/api/student/auth0`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            name: user.name || user.nickname || user.email,
            sub: user.sub,
            picture: user.picture,
          }),
        });
        if (!res.ok) throw new Error("Account linking failed");
        const data: { student: unknown; token: string } = await res.json();
        localStorage.setItem("scholr_student_token", data.token);
        setStudent(data.student as Parameters<typeof setStudent>[0]);
        setLocation("/dashboard");
      } catch (e) {
        setErrMsg((e as Error).message);
        setStatus("error");
      }
    };

    exchange();
  }, [isLoading, isAuthenticated, user, error]);

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{errMsg || "Authentication failed"}</p>
          <button onClick={() => setLocation("/login")} className="text-primary underline text-sm">
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 size={36} className="animate-spin text-primary mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Signing you in…</p>
      </div>
    </div>
  );
}
