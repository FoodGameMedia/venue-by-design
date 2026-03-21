"use client";

import { useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
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

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") ?? "/dashboard";

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${redirectTo}` },
        });
        if (error) throw error;
        setMessage({ type: "success", text: "Check your email to confirm your account." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }

  const authError = searchParams.get("error");
  const displayError = authError === "auth" ? "Authentication failed. Please try again." : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F2EBE2] px-4">
      <Card className="w-full max-w-md border-[#3C3F43]/20 bg-white">
        <CardHeader>
          <CardTitle className="text-2xl text-[#1A1A1A] font-serif">Venue by Design</CardTitle>
          <CardDescription>
            {isSignUp ? "Create your account" : "Sign in to your account"}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {(message || displayError) && (
              <div
                className={`rounded-lg p-3 text-sm ${
                  (message?.type === "error" || displayError)
                    ? "bg-red-50 text-red-700"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {displayError ?? message?.text}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@venue.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-[#3C3F43]/30"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="border-[#3C3F43]/30"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#B9704B] hover:bg-[#A3603B] text-white"
            >
              {loading ? "Please wait…" : isSignUp ? "Sign up" : "Sign in"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setMessage(null);
              }}
              className="text-sm text-[#3C3F43] hover:text-[#1A1A1A]"
            >
              {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up"}
            </button>
          </CardFooter>
        </form>
      </Card>
      <p className="absolute bottom-4 text-sm text-[#3C3F43]/70">
        <Link href="/pricing" className="hover:text-[#B9704B]">
          View pricing
        </Link>
        {" · "}
        <Link href="/" className="hover:text-[#B9704B]">
          Home
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F2EBE2]">
        <p className="text-[#3C3F43]">Loading…</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
