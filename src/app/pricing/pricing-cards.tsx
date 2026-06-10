"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const VENUE_PULSE = [
  { id: "essentials", name: "Essentials", price: 79, desc: "Weekly check-in, Calm Index, domain tracking" },
  { id: "pro", name: "Pro", price: 149, desc: "Everything in Essentials, plus AI Prescription Brief" },
  { id: "group", name: "Group", price: 299, desc: "Multi-venue, team insights, priority support" },
] as const;

const DEEP_DIAGNOSTIC = [
  { id: "solo", name: "Solo", price: 997, desc: "40-question audit, Calm Index Report, 90-Day Prescription" },
  { id: "staff_pulse", name: "Staff Pulse", price: 1497, desc: "Solo + staff survey insights, 60-min walkthrough" },
] as const;

export function PricingCards() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout(planId: string) {
    setLoading(planId);
    setError(null);
    try {
      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (res.status === 401) {
        window.location.href = `/login?redirectTo=${encodeURIComponent("/pricing")}`;
        return;
      }
      const msg = data.error ?? "Failed to create checkout";
      throw new Error(msg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
      {VENUE_PULSE.map((plan) => (
        <Card
          key={plan.id}
          className="flex flex-col border-border bg-card"
        >
          <CardHeader>
            <CardTitle className="text-card-foreground">{plan.name}</CardTitle>
            <CardDescription>Venue Pulse · Monthly</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-3xl font-serif text-primary">
              ${plan.price}
              <span className="text-base font-normal text-muted-foreground">/mo</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{plan.desc}</p>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              disabled={!!loading}
              onClick={() => handleCheckout(plan.id)}
            >
              {loading === plan.id ? "Redirecting…" : "Subscribe"}
            </Button>
          </CardFooter>
        </Card>
      ))}
      {DEEP_DIAGNOSTIC.map((plan) => (
        <Card
          key={plan.id}
          className="flex flex-col border-border bg-card"
        >
          <CardHeader>
            <CardTitle className="text-card-foreground">{plan.name}</CardTitle>
            <CardDescription>Deep Diagnostic · One-time</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <p className="text-3xl font-serif text-primary">${plan.price}</p>
            <p className="mt-2 text-sm text-muted-foreground">{plan.desc}</p>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              disabled={!!loading}
              onClick={() => handleCheckout(plan.id)}
            >
              {loading === plan.id ? "Redirecting…" : "Book now"}
            </Button>
          </CardFooter>
        </Card>
      ))}
      </div>
    </div>
  );
}
