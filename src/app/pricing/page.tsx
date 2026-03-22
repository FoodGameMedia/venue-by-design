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
import { PricingCards } from "./pricing-cards";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="cursor-pointer text-xl font-semibold text-foreground">
            Venue by Design
          </Link>
          <div className="flex gap-4">
            <Link href="/login" className="cursor-pointer">
              <Button variant="outline" size="sm">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-serif text-foreground md:text-4xl">
            Simple pricing for busy operators
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose Venue Pulse for ongoing support, or a Deep Diagnostic for a one-off overhaul.
          </p>
        </div>

        <PricingCards />

        <p className="mt-12 text-center text-sm text-muted-foreground/80">
          All prices in AUD. Cancel anytime.
        </p>
      </main>
    </div>
  );
}
