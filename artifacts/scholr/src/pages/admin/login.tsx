import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "@workspace/api-client-react";
import { hasValidAdminToken, setAdminToken } from "@/lib/admin-session";

export function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const loginMutation = useLogin();

  // Force light mode
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    // Only bounce back when the stored token is still usable; an expired one
    // is cleared by hasValidAdminToken so the sign-in form stays put.
    if (hasValidAdminToken()) setLocation("/admin/dashboard");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    loginMutation.mutate(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          if (data.token) {
            setAdminToken(data.token);
            setLocation("/admin/dashboard");
          }
        },
        onError: (err: any) => {
          setError(err?.response?.data?.error || "Invalid email or password.");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-serif font-bold text-xl text-primary-foreground">
              S
            </div>
            <span className="font-serif font-bold text-3xl tracking-tight">scholr.</span>
          </div>
          <p className="text-muted-foreground text-sm">Admin Dashboard</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl" data-testid="login-card">
          <div className="mb-6">
            <h1 className="font-serif text-2xl font-bold mb-1">Welcome back</h1>
            <p className="text-muted-foreground text-sm">Sign in to manage your scholarship listings.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="login-form">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@scholr.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-11 rounded-xl"
                data-testid="input-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-11 rounded-xl pr-10"
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  data-testid="button-toggle-password"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3 border border-destructive/20" data-testid="text-login-error">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 rounded-xl font-semibold gap-2"
              disabled={loginMutation.isPending}
              data-testid="button-login-submit"
            >
              {loginMutation.isPending ? (
                <><Loader2 size={16} className="animate-spin" /> Signing in...</>
              ) : (
                <><Lock size={16} /> Sign In</>
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Demo credentials: <span className="font-mono bg-muted px-2 py-0.5 rounded">admin@scholr.io</span> / <span className="font-mono bg-muted px-2 py-0.5 rounded">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
