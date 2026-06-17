import Link from "next/link";
import { CalmThermostat } from "@/components/calm-thermostat";
import { DomainIconList } from "@/components/sales/domain-icon-list";
import { HeroCalmThermostat } from "@/components/sales/hero-calm-thermostat";
import { PublicHeader } from "@/components/sales/public-header";
import { SectionGlow } from "@/components/sales/section-glow";
import { SocialProofSection } from "@/components/sales/social-proof-section";

const DIAGNOSTIC_CTA = "/pricing?diagnostic=required";
const PRICING_CTA = "/pricing";

const CTA_BASE =
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-colors duration-200 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50";
const CTA_LG = "h-9 gap-1.5 px-2.5";
const CTA_PRIMARY = "bg-primary text-primary-foreground hover:opacity-95";
const CTA_OUTLINE =
  "border-border bg-background hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50";

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </p>
  );
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
    <div className="rounded-[14px] bg-[#F5EDE8] p-6 text-[#2A2A28] sm:p-8">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#2A2A28]/60">
        {subtitle}
      </p>
      <h3 className="mt-2 font-serif text-2xl text-[#2A2A28]">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-[#2A2A28]/80">{body}</p>
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-screen w-full bg-background">
      <PublicHeader />

      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden flex min-h-screen flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
          <SectionGlow variant="hero" testId="sales-hero-glow" />
          <div className="flex w-full flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
            <div className="w-full max-w-4xl border-l-4 border-primary pl-6 sm:pl-10">
              <p className="text-sm text-muted-foreground">For Australian hospitality operators</p>
              <h1
                className="mt-4 font-serif text-4xl leading-[1.08] text-foreground sm:text-5xl lg:text-6xl"
                data-testid="sales-hero-headline"
              >
                Calm is not a personality trait. It is a design outcome.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Venue by Design is the weekly system that turns a venue held together by effort into
                one that runs well whoever is on. Score your calm, find where the pressure lives, and
                make one small change at a time until the place carries itself.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href={DIAGNOSTIC_CTA}
                  className={`${CTA_BASE} ${CTA_LG} ${CTA_PRIMARY}`}
                  data-testid="sales-cta-diagnostic"
                >
                  Book your Deep Diagnostic
                </Link>
                <Link
                  href={PRICING_CTA}
                  className={`${CTA_BASE} ${CTA_LG} ${CTA_OUTLINE}`}
                  data-testid="sales-cta-pricing"
                >
                  View pricing
                </Link>
              </div>
              <a
                href="#loop"
                className="mt-8 inline-block cursor-pointer text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
              >
                See how it works
              </a>
            </div>
            <HeroCalmThermostat />
          </div>
        </section>

        {/* The problem */}
        <section className="border-t border-border bg-card/20 px-4 py-16 sm:px-6 lg:px-8">
          <div className="w-full max-w-3xl border-l-[3px] border-primary bg-card p-6 sm:p-8">
            <h2 className="font-serif text-3xl text-foreground sm:text-4xl">
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
        <section id="loop" className="border-t border-border px-4 py-16 sm:px-6 lg:px-8">
          <div className="w-full space-y-10">
            <div className="max-w-3xl">
              <h2 className="font-serif text-3xl text-foreground sm:text-4xl">
                Find the pressure. Make one change. Let it compound.
              </h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="border-l-[3px] border-primary bg-card p-6">
                <SectionLabel>Step 1</SectionLabel>
                <h3 className="mt-2 font-serif text-xl text-foreground">Diagnose</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  A short diagnostic scores a normal trading day across seven domains and gives you
                  one number, your Calm Index, plus a shortlist of where to start. Your score is
                  not a grade, it is a map.
                </p>
              </div>
              <div className="border-l-[3px] border-primary bg-card p-6">
                <SectionLabel>Step 2</SectionLabel>
                <h3 className="mt-2 font-serif text-xl text-foreground">Prescribe</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  You get one design change per domain, sequenced into ninety days, shortest stave
                  first. One change at a time, made real before the next begins.
                </p>
              </div>
              <div className="border-l-[3px] border-primary bg-card p-6">
                <SectionLabel>Step 3</SectionLabel>
                <h3 className="mt-2 font-serif text-xl text-foreground">The weekly loop</h3>
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

            <blockquote className="border-l-4 border-accent bg-card p-6 sm:p-8">
              <p className="font-serif text-xl leading-relaxed text-foreground sm:text-2xl">
                Every change passes one test. Does it hold on the night its author is rostered off?
                If it needs you in the building, it is not yet a design.
              </p>
            </blockquote>
          </div>
        </section>

        {/* What you get */}
        <section className="border-t border-border bg-card/20 px-4 py-16 sm:px-6 lg:px-8">
          <div className="w-full space-y-8">
            <h2 className="font-serif text-3xl text-foreground sm:text-4xl">What you get</h2>
            <div className="grid gap-6 lg:grid-cols-2">
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
        <section className="relative isolate overflow-hidden border-t border-border bg-card/20 px-4 py-16 sm:px-6 lg:px-8">
          <SectionGlow variant="quiet-advantage" testId="sales-quiet-advantage-glow" />
          <div className="w-full max-w-3xl border-l-[3px] border-primary bg-card p-6 sm:p-8">
            <h2 className="font-serif text-3xl text-foreground sm:text-4xl">The quiet advantage</h2>
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
        <section className="border-t border-border bg-card/20 px-4 py-16 sm:px-6 lg:px-8">
          <div className="w-full max-w-3xl border-l-[3px] border-primary bg-card p-6 sm:p-8">
            <h2 className="font-serif text-3xl text-foreground sm:text-4xl">Who it is for</h2>
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
          className="border-t border-border px-4 py-16 sm:px-6 lg:px-8"
          data-testid="sales-commitment-section"
        >
          <div className="w-full max-w-3xl border-l-[3px] border-primary bg-card p-6 sm:p-8">
            <h2 className="font-serif text-3xl text-foreground sm:text-4xl">
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
        <section className="border-t border-border bg-card/20 px-4 py-20 sm:px-6 lg:px-8">
          <div className="w-full max-w-3xl border-l-4 border-primary pl-6 sm:pl-10">
            <h2
              className="font-serif text-4xl text-foreground sm:text-5xl"
              data-testid="sales-final-cta-heading"
            >
              Commit to the next ninety days.
            </h2>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href={DIAGNOSTIC_CTA} className={`${CTA_BASE} ${CTA_LG} ${CTA_PRIMARY}`}>
                Book your Deep Diagnostic
              </Link>
              <Link href={PRICING_CTA} className={`${CTA_BASE} ${CTA_LG} ${CTA_OUTLINE}`}>
                View pricing
              </Link>
            </div>
            <p className="mt-10 font-serif text-lg text-muted-foreground">
              Calm is not a personality trait. It is a design outcome.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
