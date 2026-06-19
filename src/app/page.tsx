import Link from "next/link";
import { CalmThermostat } from "@/components/calm-thermostat";
import { DomainIconList } from "@/components/sales/domain-icon-list";
import { HeroCalmThermostat } from "@/components/sales/hero-calm-thermostat";
import { SectionCityscapeDivider } from "@/components/sales/hero-cityscape-bg";
import { PublicHeader } from "@/components/sales/public-header";
import { SectionGlow } from "@/components/sales/section-glow";
import { SocialProofSection } from "@/components/sales/social-proof-section";

const DIAGNOSTIC_CTA = "/pricing?diagnostic=required";
const PRICING_CTA = "/pricing";

function SectionLabel({ children }: { children: string }) {
  return <p className="vbd-section-label">{children}</p>;
}

function ProductCard({
  title,
  subtitle,
  body,
}: {
  title: string;
  subtitle: string;
  body: string;
}) {
  return (
    <div className="vbd-product-card">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#8B3A52]/70">
        {subtitle}
      </p>
      <h3 className="mt-2 font-serif text-2xl tracking-tight text-[#2A2A28]">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-[#2A2A28]/75">{body}</p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="vbd-page-bg relative min-h-screen w-full">
      <PublicHeader />

      <main>
        {/* Hero */}
        <section className="relative isolate flex min-h-screen flex-col justify-center overflow-hidden px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <SectionGlow variant="hero" testId="sales-hero-glow" />
          <div className="relative z-10 flex w-full flex-col items-center gap-12 lg:flex-row lg:items-center lg:justify-between lg:gap-20">
            <div className="vbd-hero-accent w-full max-w-4xl">
              <span className="vbd-hero-badge">Designed for calm</span>
              <p className="vbd-section-label-accent mt-4">For Australian hospitality operators</p>
              <h1
                className="mt-5 font-serif text-4xl leading-[1.06] tracking-tight text-foreground sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]"
                data-testid="sales-hero-headline"
              >
                Calm is not a personality trait. It is a design outcome.
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg sm:leading-relaxed">
                Venue by Design is the weekly system that turns a venue held together by effort into
                one that runs well whoever is on. Score your calm, find where the pressure lives, and
                make one small change at a time until the place carries itself.
              </p>
              <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <Link
                  href={DIAGNOSTIC_CTA}
                  className="vbd-cta vbd-cta-lg vbd-cta-primary"
                  data-testid="sales-cta-get-started"
                >
                  Get started
                </Link>
                <Link
                  href={PRICING_CTA}
                  className="vbd-cta vbd-cta-lg vbd-cta-outline"
                  data-testid="sales-cta-pricing"
                >
                  View pricing
                </Link>
                <a
                  href="#loop"
                  className="cursor-pointer text-sm text-muted-foreground transition-colors duration-200 hover:text-primary sm:ml-1"
                  data-testid="sales-cta-how-it-works"
                >
                  See how it works
                </a>
              </div>
            </div>
            <HeroCalmThermostat />
          </div>
        </section>

        <SectionCityscapeDivider testId="sales-cityscape-divider" />

        {/* The problem */}
        <section className="relative vbd-section-divider vbd-section-alt overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
          <div className="relative z-10 vbd-prescription-card w-full max-w-3xl p-6 sm:p-8">
            <h2 className="font-serif text-3xl tracking-tight text-foreground sm:text-4xl">
              Most venues are carried, not designed.
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
              You already work hard. That is not the problem. The problem is that the day is held
              together by effort and memory rather than design, so the same things break at the same
              times, one absence can change the whole service, and the moment you step out of the
              building it starts to wobble. Working harder does not fix a design problem. It hides
              it for one more night.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section id="loop" className="relative vbd-section-divider overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
          <div className="relative z-10 w-full space-y-12">
            <div className="vbd-section-header max-w-3xl">
              <h2 className="font-serif text-3xl tracking-tight text-foreground sm:text-4xl">
                Find the pressure. Make one change. Let it compound.
              </h2>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <div className="vbd-prescription-card p-6">
                <SectionLabel>Step 1</SectionLabel>
                <h3 className="mt-2 font-serif text-xl tracking-tight text-foreground">Diagnose</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  A short diagnostic scores a normal trading day across seven domains and gives you
                  one number, your Calm Index, plus a shortlist of where to start. Your score is
                  not a grade, it is a map.
                </p>
              </div>
              <div className="vbd-prescription-card p-6">
                <SectionLabel>Step 2</SectionLabel>
                <h3 className="mt-2 font-serif text-xl tracking-tight text-foreground">Prescribe</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  You get one design change per domain, sequenced into ninety days, shortest stave
                  first. One change at a time, made real before the next begins.
                </p>
              </div>
              <div className="vbd-prescription-card p-6">
                <SectionLabel>Step 3</SectionLabel>
                <h3 className="mt-2 font-serif text-xl tracking-tight text-foreground">The weekly loop</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Once a week the app brings you back. It re-asks the questions, plots your number
                  over time, and puts the next small change in front of you once the last has held. A
                  weekly reminder to keep building. Calm is the system absorbing variance before it
                  reaches a person, like a thermostat holding a setting against a changing day.
                </p>
              </div>
            </div>

            <DomainIconList />

            <CalmThermostat value={6} label="Example Calm Index" />

            <blockquote className="vbd-prescription-card border-l-4 border-l-[#C9A87C] p-6 sm:p-8">
              <p className="font-serif text-xl leading-relaxed text-foreground sm:text-2xl">
                Every change passes one test. Does it hold on the night its author is rostered off?
                If it needs you in the building, it is not yet a design.
              </p>
            </blockquote>
          </div>
        </section>

        {/* What you get */}
        <section className="vbd-section-divider vbd-section-alt px-4 py-20 sm:px-6 lg:px-8">
          <div className="w-full space-y-10">
            <div className="vbd-section-header">
              <h2 className="font-serif text-3xl tracking-tight text-foreground sm:text-4xl">What you get</h2>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <ProductCard
                title="Deep Diagnostic"
                subtitle="One-time"
                body="A forty-question audit, your Calm Index report, a ninety-day design prescription, and a sixty-minute walkthrough call."
              />
              <ProductCard
                title="Venue Pulse"
                subtitle="Monthly"
                body="The weekly check-in, Calm Index tracking, domain health over time, and an AI prescription brief that keeps the next change in front of you."
              />
            </div>
          </div>
        </section>

        {/* The quiet advantage */}
        <section className="vbd-muted-section relative isolate overflow-hidden px-4 py-20 sm:px-6 lg:px-8">
          <SectionGlow variant="quiet-advantage" testId="sales-quiet-advantage-glow" />
          <div className="vbd-prescription-card relative w-full max-w-3xl p-6 sm:p-8">
            <h2 className="font-serif text-3xl tracking-tight text-foreground sm:text-4xl">The quiet advantage</h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Calm does not show up in your dining room as anything dramatic. It shows up as a place
              that runs well whoever is on, keeps what it has learned, and quietly compounds, while
              the venue down the road is still trying harder. That is an advantage your competitors
              cannot see and cannot easily copy. You move from Structural Risk, through Functional
              but Fragile, to Designed for Calm, one default at a time.
            </p>
          </div>
        </section>

        {/* Who it is for */}
        <section className="vbd-section-divider vbd-section-alt px-4 py-20 sm:px-6 lg:px-8">
          <div className="vbd-prescription-card w-full max-w-3xl p-6 sm:p-8">
            <h2 className="font-serif text-3xl tracking-tight text-foreground sm:text-4xl">Who it is for</h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Built for those who know they are working hard but not seeing results. Owner-operators,
              venue managers, and small groups who are tired of carrying the day on effort and want a
              venue that holds without them.
            </p>
          </div>
        </section>

        <SocialProofSection />

        {/* Commitment */}
        <section
          className="vbd-section-divider px-4 py-20 sm:px-6 lg:px-8"
          data-testid="sales-commitment-section"
        >
          <div className="vbd-prescription-card w-full max-w-3xl p-6 sm:p-8">
            <h2 className="font-serif text-3xl tracking-tight text-foreground sm:text-4xl">
              The hard part is not starting. It is not stopping.
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
              The method is not hard. It is long. The plan is a quiet tail of small changes, and the
              only thing that beats it is stopping. If you are serious about change, the commitment
              is not one big push, it is showing up to the next small change, week after week, until
              it holds. Venue by Design is here to see it through with you. Once a week it brings you
              back, holds the plan, and puts the next change in front of you, so the commitment
              stays in view instead of fading when the weeks turn loud.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="vbd-section-divider vbd-muted-section px-4 py-24 sm:px-6 lg:px-8">
          <div className="vbd-hero-accent w-full max-w-3xl">
            <h2
              className="font-serif text-4xl tracking-tight text-foreground sm:text-5xl"
              data-testid="sales-final-cta-heading"
            >
              Commit to the next ninety days.
            </h2>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <Link href={DIAGNOSTIC_CTA} className="vbd-cta vbd-cta-lg vbd-cta-primary">
                Book your Deep Diagnostic
              </Link>
              <Link href={PRICING_CTA} className="vbd-cta vbd-cta-lg vbd-cta-outline">
                View pricing
              </Link>
            </div>
            <p className="mt-12 font-serif text-lg text-muted-foreground">
              Calm is not a personality trait. It is a design outcome.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
