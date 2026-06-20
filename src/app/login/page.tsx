"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AdvisorPortalExplainer,
  isAdvisorPortalLogin,
} from "@/components/advisor/advisor-portal-explainer";
import { signIn } from "./actions";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";
  const advisorLogin = isAdvisorPortalLogin(redirectTo);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (isSignUp) {
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}` },
        });
        if (error) throw error;
        setMessage({ type: "success", text: "Check your email to confirm your account." });
      } catch (err) {
        setMessage({
          type: "error",
          text: err instanceof Error ? err.message : "Something went wrong.",
        });
      } finally {
        setLoading(false);
      }
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("redirectTo", redirectTo);
    const result = await signIn(formData);
    setLoading(false);
    if (result?.error) {
      setMessage({ type: "error", text: result.error });
    }
  }

  const authError = searchParams.get("error");
  const displayError = authError === "auth" ? "Authentication failed. Please try again." : null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-transparent px-4 py-8">
      {advisorLogin && <AdvisorPortalExplainer />}
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader>
          <CardTitle className="font-serif text-2xl text-card-foreground">
            {advisorLogin ? "Advisor Portal sign in" : "Venue by Design"}
          </CardTitle>
          <CardDescription>
            {advisorLogin
              ? "Sign in to view linked venues or register as an advisor"
              : isSignUp
                ? "Create your account"
                : "Sign in to your account"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <CardContent className="space-y-4">
            {(message || displayError) && (
              <div
                data-testid="login-message"
                role="alert"
                className={`border-l-[3px] p-3 text-sm ${
                  (message?.type === "error" || displayError)
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-primary bg-primary/10 text-foreground"
                }`}
              >
                {displayError ?? message?.text}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@venue.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="border-input"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Please wait…" : isSignUp ? "Sign up" : "Sign in"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage(null);
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
            </button>
          </CardFooter>
        </form>
      </Card>
      <p className="text-sm text-muted-foreground/80">
        <Link href="/pricing" className="cursor-pointer hover:text-primary">
          View pricing
        </Link>
        {" · "}
        <Link href="/" className="cursor-pointer hover:text-primary">
          Home
        </Link>
        {advisorLogin && (
          <>
            {" · "}
            <Link href="/login" className="cursor-pointer hover:text-primary">
              Operator sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
