"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TermsAcceptance } from "@/components/checkout/terms-acceptance";

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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [promoCode, setPromoCode] = useState("");

  async function handleCheckout(planId: string) {
    if (!acceptedTerms) {
      setError("Please accept the Terms & Conditions and Privacy Policy to continue.");
      return;
    }

    setLoading(planId);
    setError(null);
    try {
      const res = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          acceptedTerms: true,
          ...(promoCode.trim() ? { promoCode: promoCode.trim() } : {}),
        }),
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
    <div className="space-y-8">
      {error && (
        <div className="border-l-[3px] border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <TermsAcceptance checked={acceptedTerms} onChange={setAcceptedTerms} />

      <div className="mx-auto max-w-md space-y-2">
        <Label htmlFor="promo-code" className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Promo code (optional)
        </Label>
        <Input
          id="promo-code"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
          placeholder="e.g. VENUEBETA"
          className="bg-card"
          data-testid="checkout-promo-code"
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground/80">
          Beta testers: enter your code here or at Stripe checkout.{" "}
          <Link href="/terms" className="text-[#C9A87C] hover:underline">
            Terms
          </Link>{" "}
          apply.
        </p>
      </div>

      <div className="space-y-12">
        <div>
          <h2 className="mb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Venue Pulse · Monthly subscription
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {VENUE_PULSE.map((plan) => (
              <Card
                key={plan.id}
                className={`flex flex-col border-t-2 bg-card ${
                  plan.recommended
                    ? "border-t-[#C9A87C] border-primary ring-2 ring-[#C9A87C]/40"
                    : "border-t-[#C9A87C]/40 border-border"
                }`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-card-foreground">{plan.name}</CardTitle>
                    {plan.recommended && (
                      <span className="bg-gradient-to-r from-[#C9A87C] to-[#D696A9] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#211d1a]">
                        Recommended
                      </span>
                    )}
                  </div>
                  <CardDescription>Venue Pulse · Monthly</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="font-serif text-3xl text-[#C9A87C]">
                    ${plan.price}
                    <span className="text-base font-normal text-muted-foreground">/mo</span>
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.desc}</p>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.recommended ? "default" : "outline"}
                    disabled={!!loading || !acceptedTerms}
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
              <Card key={plan.id} className="flex flex-col border-t-2 border-t-[#C9A87C]/40 border-border bg-card">
                <CardHeader>
                  <CardTitle className="text-card-foreground">{plan.name}</CardTitle>
                  <CardDescription>Deep Diagnostic · One-time</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="font-serif text-3xl text-[#C9A87C]">${plan.price}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.desc}</p>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    disabled={!!loading || !acceptedTerms}
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
    </div>
  );
}
