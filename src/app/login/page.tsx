"use client";

import React, { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldAlert, LogIn, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/gewci/Button";
import { Card, CardContent } from "@/components/gewci/Card";
import { Input } from "@/components/gewci/Input";

/**
 * Default export wraps the inner form in <Suspense>. Required by Next.js 16:
 * useSearchParams() forces a client-render bailout, which breaks static
 * prerendering of /login unless the consuming component sits inside a
 * Suspense boundary. The fallback covers the brief hydration window.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gewci-white">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [authError, setAuthError] = React.useState("");
  const [showSandbox, setShowSandbox] = React.useState(false);

  const errorParam = searchParams.get("error");
  const redirectTo = searchParams.get("redirectTo") || "/document-review";

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setAuthError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setAuthError(err.message || "Failed to initialize Google login");
      setIsLoading(false);
    }
  };

  // Email/password login. Pre-existing users only — no auto-signup fallback,
  // which would otherwise burn the Supabase email rate limit whenever a user
  // mistypes their password. Create users in the Supabase dashboard
  // (Authentication > Users > Add user, with "Auto Confirm User" enabled).
  const handleSandboxLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    setAuthError("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // Pass through Supabase's message verbatim so the user sees the real
        // failure ("Invalid login credentials", "Email not confirmed", etc.)
        // instead of being silently re-routed into a signup that triggers
        // emails.
        throw error;
      }

      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : "Authentication failed",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gewci-white px-4 py-12 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none select-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-secondary/5 blur-[120px] pointer-events-none select-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Title/Header */}
        <div className="text-center flex flex-col items-center select-none gap-2">
          <span className="font-heading font-black text-3xl tracking-tight text-primary">
            GEWCI<span className="text-secondary font-medium ml-1">Tools</span>
          </span>
          <p className="text-xs font-bold text-gewci-gold uppercase tracking-widest mt-1">
            Great Emmanuel Worship Church Inc.
          </p>
        </div>

        <Card className="border border-gewci-gray/30 shadow-lg">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-1.5 select-none">
              <h2 className="text-lg font-bold font-heading text-primary">
                Sign In to Ministry Suite
              </h2>
              <p className="text-xs text-gewci-dark/50">
                Authorized credentials required for access.
              </p>
            </div>

            {/* Error notifications */}
            {(errorParam || authError) && (
              <div className="bg-error/5 border border-error/20 text-error rounded-xl p-3 flex items-start gap-2 text-xs">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{authError || errorParam}</span>
              </div>
            )}

            {/* Google Login Button */}
            <div className="space-y-4">
              <Button
                onClick={handleGoogleLogin}
                isLoading={isLoading && !showSandbox}
                variant="primary"
                className="w-full justify-center h-11 relative border border-primary-dark"
              >
                {/* Google Icon SVG */}
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
                <span>Continue with Google</span>
              </Button>
            </div>

            {/* Developer Sandbox Section */}
            <div className="border-t border-gewci-gray/10 pt-4 flex flex-col gap-3 select-none">
              <button
                type="button"
                onClick={() => setShowSandbox(!showSandbox)}
                className="text-[10px] text-center font-bold tracking-wider text-gewci-dark/40 uppercase hover:text-primary transition-colors cursor-pointer"
              >
                {showSandbox ? "Hide email sign-in" : "Sign in with email"}
              </button>

              {showSandbox && (
                <form onSubmit={handleSandboxLogin} className="space-y-4 animate-[slide-up_0.2s_ease-out] text-left">
                  <div className="bg-primary/5 rounded-xl p-3 border border-primary/10 text-[10px] text-primary leading-normal">
                    <p className="font-bold uppercase tracking-wider mb-1">Account required</p>
                    Sign in with the email and password set for your account in
                    Supabase. Accounts are created by an administrator from the
                    Supabase dashboard.
                  </div>

                  <Input
                    label="Email"
                    type="email"
                    placeholder="you@gewci.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />

                  <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />

                  <Button
                    type="submit"
                    variant="outline"
                    className="w-full justify-center text-xs h-10 gap-1.5"
                    isLoading={isLoading && showSandbox}
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Sign in</span>
                  </Button>
                </form>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-[10px] text-center text-gewci-dark/40 leading-normal select-none">
          GEWCI Security Center &bull; Authorized Personnel Only
        </p>
      </div>
    </div>
  );
}
