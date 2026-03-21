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
    <div className="min-h-screen bg-[#F2EBE2]">
      <header className="border-b border-[#3C3F43]/20 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-semibold text-[#1A1A1A]">
            Venue by Design
          </Link>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-serif text-[#1A1A1A] md:text-4xl">
            Simple pricing for busy operators
          </h1>
          <p className="mt-4 text-lg text-[#3C3F43]">
            Choose Venue Pulse for ongoing support, or a Deep Diagnostic for a one-off overhaul.
          </p>
        </div>

        <PricingCards />

        <p className="mt-12 text-center text-sm text-[#3C3F43]/70">
          All prices in AUD. Cancel anytime.
        </p>
      </main>
    </div>
  );
}
