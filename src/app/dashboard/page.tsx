import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { hasDiagnosticAccess } from "@/lib/diagnostic-access";
import { CalmIndexTrend } from "./calm-index-trend";
import { DomainRadar } from "./domain-radar";
import { CheckinHistory } from "./checkin-history";
import { DOMAINS } from "@/lib/checkin-questions";
import { AppNav } from "@/components/app-nav";
import { CalmThermostat } from "@/components/calm-thermostat";
import { NextChangeCard } from "@/components/next-change-card";
import { getActiveChangeIndex } from "@/lib/venue-progress";

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
    .select("id, name, metadata")
    .eq("user_id", dbUser.id);
  if (!userVenues?.length) redirect("/onboarding");

  const venue = userVenues[0];
  const diagnosticAccess = await hasDiagnosticAccess(dbUser.id);

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

  const latestCalmIndex = historyList[0]?.calm_index ?? 0;
  const changeProgressIndex = getActiveChangeIndex(
    venue.metadata,
    latestPrescription?.created_at ?? null
  );

  return (
    <div className="vbd-page-bg min-h-screen">
      <AppNav />
      <main className="w-full px-4 py-8 pb-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="vbd-section-header">
            <p className="vbd-section-label-accent">Dashboard</p>
            <h2 className="mt-1 font-serif text-2xl tracking-tight text-foreground sm:text-3xl">This Week</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{venue.name}</p>
          </div>
          {!isEmpty && (
            <div className="flex flex-wrap gap-3">
              <Link
                href="/checkin"
                className="vbd-cta vbd-cta-lg vbd-cta-primary"
              >
                Weekly check-in
              </Link>
              {diagnosticAccess && (
                <Link
                  href="/my-plan"
                  className="vbd-cta vbd-cta-lg vbd-cta-outline"
                >
                  My Plan
                </Link>
              )}
            </div>
          )}
        </div>

        {isEmpty ? (
          <div className="vbd-prescription-card p-6 sm:p-8">
            <p className="font-serif text-xl text-foreground">No check-ins yet</p>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              Complete your first weekly check-in to see your Calm Index, domain scores, and
              prescription brief.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/checkin"
                className="vbd-cta vbd-cta-lg vbd-cta-primary"
              >
                Start your first check-in
              </Link>
              {diagnosticAccess && (
                <Link
                  href="/diagnostic"
                  className="vbd-cta vbd-cta-lg vbd-cta-outline"
                >
                  Deep Diagnostic
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <CalmThermostat value={latestCalmIndex} valueTestId="dashboard-calm-index" />

            <section className="vbd-prescription-card p-4 sm:p-6">
              <h3 className="vbd-section-label-accent">
                Calm Index trend
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                The weekly loop shows whether the system is holding, not whether the week was perfect.
              </p>
              {trendData.length > 0 && (
                <div className="mt-4">
                  <CalmIndexTrend data={trendData} />
                </div>
              )}
            </section>

            <NextChangeCard
              rx={latestPrescription}
              venueId={venue.id}
              initialActiveIndex={changeProgressIndex}
            />

            <section className="vbd-prescription-card p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl tracking-tight text-foreground">Weekly re-score</h3>
                  <p className="mt-1 max-w-prose text-sm text-muted-foreground">
                    Answer for a normal day. A low score is not an accusation, it is where the map starts.
                  </p>
                </div>
                <Link
                  href="/checkin"
                  className="vbd-cta vbd-cta-lg vbd-cta-primary"
                >
                  Weekly check-in
                </Link>
              </div>
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section className="vbd-prescription-card p-4 sm:p-6">
                <h3 className="vbd-section-label-accent">
                  Domains at a glance
                </h3>
                {trendData.length > 0 && (
                  <div className="mt-4">
                    <DomainRadar data={radarData} />
                  </div>
                )}
              </section>

              <section className="vbd-prescription-card p-4 sm:p-6">
                <h3 className="vbd-section-label-accent">
                  Check-in history
                </h3>
                <div className="mt-4">
                  <CheckinHistory checkins={historyList.slice(0, 5)} />
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
