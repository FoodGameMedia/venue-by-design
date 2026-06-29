import Link from "next/link";
import { PublicFooter } from "@/components/sales/public-footer";
import { PublicHeader } from "@/components/sales/public-header";
import { PricingCards } from "./pricing-cards";

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ diagnostic?: string }>;
}) {
  const params = await searchParams;
  const showDiagnosticBanner = params.diagnostic === "required";

  return (
    <div className="relative min-h-screen w-full bg-transparent">
      <PublicHeader />

      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {showDiagnosticBanner && (
          <div className="mx-auto mb-8 max-w-2xl border-l-[3px] border-primary bg-primary/10 p-4 text-sm text-foreground">
            Deep Diagnostic requires a one-time purchase. Choose Solo or Staff Pulse below.
          </div>
        )}
        <div className="mb-12 text-center">
          <h1 className="font-serif text-3xl text-foreground md:text-4xl">
            Simple pricing for busy operators
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose Venue Pulse for ongoing support, or a Deep Diagnostic for a one-off overhaul.
          </p>
        </div>

        <PricingCards />

        <p className="mt-12 text-center text-sm text-muted-foreground/80">
          All prices in AUD. Cancel anytime.{" "}
          <Link href="/terms" className="text-[#C9A87C] hover:underline">
            Terms
          </Link>{" "}
          ·{" "}
          <Link href="/privacy" className="text-[#C9A87C] hover:underline">
            Privacy
          </Link>
        </p>
      </main>

      <PublicFooter />
    </div>
  );
}
