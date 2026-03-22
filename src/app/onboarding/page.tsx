"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
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

const VENUE_TYPES = [
  { value: "restaurant", label: "Restaurant" },
  { value: "cafe", label: "Café" },
  { value: "bar", label: "Bar" },
  { value: "pub", label: "Pub" },
  { value: "hotel_fb", label: "Hotel F&B" },
  { value: "large_format", label: "Large format" },
] as const;

export default function OnboardingPage() {
  const [name, setName] = useState("");
  const [venueType, setVenueType] = useState<string>("");
  const [staffCount, setStaffCount] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function check() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?redirectTo=/onboarding");
        return;
      }
      const res = await fetch("/api/venues", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.venues?.length > 0) {
          router.replace("/dashboard");
          return;
        }
      }
      setChecking(false);
    }
    check();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          venueType: venueType || null,
          staffCount: staffCount ? parseInt(staffCount, 10) : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to save venue");
      }
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader>
          <CardTitle className="text-2xl font-serif text-card-foreground">
            Welcome to Venue by Design
          </CardTitle>
          <CardDescription>Tell us about your venue</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Venue name</Label>
              <Input
                id="name"
                placeholder="e.g. The Local Kitchen"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venueType">Venue type</Label>
              <select
                id="venueType"
                value={venueType}
                onChange={(e) => setVenueType(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select type</option>
                {VENUE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="staffCount">Number of staff</Label>
              <Input
                id="staffCount"
                type="number"
                min={1}
                placeholder="e.g. 12"
                value={staffCount}
                onChange={(e) => setStaffCount(e.target.value)}
                className="border-input"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Saving…" : "Continue"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
