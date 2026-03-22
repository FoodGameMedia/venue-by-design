import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalmIndexTrend } from "./calm-index-trend";
import { DomainRadar } from "./domain-radar";
import { PrescriptionCard } from "./prescription-card";
import { CheckinHistory } from "./checkin-history";
import { DOMAINS } from "@/lib/checkin-questions";

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().slice(0, 10);
}

function formatWeekLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login?redirectTo=/dashboard");

  const admin = createAdminClient();
  const { data: dbUsers } = await admin
    .from("users")
    .select("id")
    .eq("auth_id", authUser.id)
    .limit(1);
  const dbUser = dbUsers?.[0];
  if (!dbUser) redirect("/onboarding");

  const { data: userVenues } = await admin
    .from("venues")
    .select("id, name")
    .eq("user_id", dbUser.id);
  if (!userVenues?.length) redirect("/onboarding");

  const venue = userVenues[0];

  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
  const eightWeeksAgoStr = eightWeeksAgo.toISOString();

  const [checkinsRes, domainScoresRes, prescriptionsRes] = await Promise.all([
    admin
      .from("checkins")
      .select("id, calm_index, created_at")
      .eq("venue_id", venue.id)
      .order("created_at", { ascending: true }),
    admin
      .from("domain_scores")
      .select("domain, score")
      .eq("venue_id", venue.id),
    admin
      .from("prescriptions")
      .select("primary_problem, interventions, week_focus, watch_signal, primary_domain, created_at")
      .eq("venue_id", venue.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const checkins = (checkinsRes.data ?? []).filter((c) => c.created_at >= eightWeeksAgoStr);
  const domainScores = domainScoresRes.data ?? [];
  const latestPrescription = prescriptionsRes.data;

  const trendData = (() => {
    const byWeek = new Map<string, { score: number; fullDate: string }>();
    for (const c of checkins) {
      const wk = getWeekKey(new Date(c.created_at));
      const existing = byWeek.get(wk);
      if (!existing || new Date(c.created_at) > new Date(existing.fullDate)) {
        byWeek.set(wk, {
          score: c.calm_index,
          fullDate: c.created_at,
        });
      }
    }
    const weeks = Array.from(byWeek.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-8);
    return weeks.map(([week, v]) => ({
      week: formatWeekLabel(week),
      score: v.score,
      fullDate: v.fullDate,
    }));
  })();

  const radarData = DOMAINS.map((d) => {
    const row = domainScores.find((s) => s.domain === d);
    return {
      domain: d,
      score: row ? row.score : 0,
      fullMark: 3,
    };
  });

  const historyList = [...(checkinsRes.data ?? [])].reverse();

  const isEmpty = historyList.length === 0;

  return (
    <div className="min-h-screen bg-[#F2EBE2]">
      <header className="border-b border-[#3C3F43]/20 bg-white sticky top-0 z-10">
        <div className="mx-auto flex h-14 min-h-[56px] max-w-4xl items-center justify-between px-4">
          <h1 className="text-lg font-semibold text-[#1A1A1A]">Venue by Design</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/pricing">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                Pricing
              </Button>
            </Link>
            <form action="/api/billing/portal" method="post">
              <Button type="submit" variant="outline" size="sm" className="text-xs sm:text-sm">
                Billing
              </Button>
            </form>
            <form action="/api/auth/signout" method="post">
              <Button type="submit" variant="ghost" size="sm" className="text-xs sm:text-sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6 pb-12">
        <div className="mb-6">
          <h2 className="text-xl font-serif text-[#1A1A1A]">Dashboard</h2>
          <p className="mt-1 text-sm text-[#3C3F43]/80">{venue.name}</p>
        </div>

        {isEmpty ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-[#3C3F43]/20 bg-white p-6 text-center">
              <p className="text-[#1A1A1A] font-medium">No check-ins yet</p>
              <p className="mt-2 text-sm text-[#3C3F43]">
                Complete your first weekly check-in to see your Calm Index, domain scores, and
                prescription brief.
              </p>
              <Link
                href="/checkin"
                className="mt-4 inline-flex h-11 items-center justify-center rounded-lg bg-[#B9704B] px-5 text-sm font-medium text-white hover:bg-[#A3603B] transition-colors"
              >
                Start your first check-in
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Calm Index score + trend */}
            <section className="rounded-xl border border-[#3C3F43]/20 bg-white p-4 sm:p-6">
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-medium uppercase tracking-wider text-[#3C3F43]">
                  Calm Index
                </h3>
                <span
                  className="text-2xl font-serif font-semibold text-[#B9704B]"
                  data-testid="dashboard-calm-index"
                >
                  {historyList[0]?.calm_index ?? 0}/10
                </span>
              </div>
              {trendData.length > 0 && (
                <div className="mt-4">
                  <CalmIndexTrend data={trendData} />
                </div>
              )}
            </section>

            {/* Domain radar */}
            <section className="rounded-xl border border-[#3C3F43]/20 bg-white p-4 sm:p-6">
              <h3 className="text-sm font-medium uppercase tracking-wider text-[#3C3F43]">
                Domain health
              </h3>
              <div className="mt-4">
                <DomainRadar data={radarData} />
              </div>
            </section>

            {/* Latest Prescription Brief */}
            {latestPrescription && (
              <section>
                <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-[#3C3F43]">
                  Latest prescription
                </h3>
                <PrescriptionCard rx={latestPrescription} />
              </section>
            )}

            {/* Check-in history */}
            <section>
              <h3 className="mb-3 text-sm font-medium uppercase tracking-wider text-[#3C3F43]">
                Check-in history
              </h3>
              <CheckinHistory checkins={historyList} />
            </section>
          </div>
        )}

        {!isEmpty && (
          <div className="mt-6">
            <Link
              href="/checkin"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#B9704B] px-5 text-sm font-medium text-white hover:bg-[#A3603B] transition-colors"
            >
              Weekly check-in
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
