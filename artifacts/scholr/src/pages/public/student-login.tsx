import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { studentLogin } from "@/hooks/use-student-auth";
import { useStudent } from "@/hooks/use-student-auth";
import { Loader2, GraduationCap } from "lucide-react";
import { Auth0Button } from "@/components/auth/auth0-button";

export function StudentLogin() {
  const [, setLocation] = useLocation();
  const { setStudent } = useStudent();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const student = await studentLogin(email, password);
      setStudent(student);
      setLocation("/dashboard");
    } catch (e: unknown) {
      setError((e as Error).message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-serif font-bold text-2xl mx-auto mb-4">
            S
          </div>
          <h1 className="font-serif text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your Scholr account</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 space-y-5">
          {/* Google / Social sign-in */}
          <Auth0Button mode="login" />

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or continue with email</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Email Address</Label>
              <Input
                className="mt-1"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                className="mt-1"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full gap-2 mt-2" disabled={loading}>
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> Signing in…</>
              ) : (
                <><GraduationCap size={16} /> Sign In with Email</>
              )}
            </Button>
          </form>
        </div>

        <div className="text-center space-y-3 mt-6">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">Create one free</Link>
          </p>
          <p className="text-xs text-muted-foreground">
            Admin?{" "}
            <Link href="/admin/login" className="text-muted-foreground hover:text-foreground underline">Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
