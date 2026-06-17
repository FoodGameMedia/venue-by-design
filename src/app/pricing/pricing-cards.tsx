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
  { id: "essentials", name: "Essentials", price: 39, desc: "Weekly check-in, Calm Index, domain tracking", recommended: false },
  { id: "pro", name: "Pro", price: 99, desc: "Everything in Essentials, plus AI Prescription Brief", recommended: true },
  { id: "group", name: "Group", price: 299, desc: "Multi-venue, team insights, priority support", recommended: false },
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
    <div className="space-y-12">
      {error && (
        <div className="border-l-[3px] border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div>
        <h2 className="mb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Venue Pulse · Monthly subscription
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {VENUE_PULSE.map((plan) => (
            <Card
              key={plan.id}
              className={`flex flex-col bg-card ${
                plan.recommended
                  ? "border-primary ring-2 ring-primary"
                  : "border-border"
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-card-foreground">{plan.name}</CardTitle>
                  {plan.recommended && (
                    <span className="bg-primary px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-primary-foreground">
                      Recommended
                    </span>
                  )}
                </div>
                <CardDescription>Venue Pulse · Monthly</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="font-serif text-3xl text-primary">
                  ${plan.price}
                  <span className="text-base font-normal text-muted-foreground">/mo</span>
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{plan.desc}</p>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.recommended ? "default" : "outline"}
                  disabled={!!loading}
                  onClick={() => handleCheckout(plan.id)}
                >
                  {loading === plan.id ? "Redirecting…" : "Subscribe"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Deep Diagnostic · One-time
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {DEEP_DIAGNOSTIC.map((plan) => (
            <Card key={plan.id} className="flex flex-col border-border bg-card">
              <CardHeader>
                <CardTitle className="text-card-foreground">{plan.name}</CardTitle>
                <CardDescription>Deep Diagnostic · One-time</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="font-serif text-3xl text-primary">${plan.price}</p>
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
    </div>
  );
}
