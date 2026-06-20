import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppNav } from "@/components/app-nav";
import { CalmThermostat } from "@/components/calm-thermostat";
import { PrescriptionCard } from "@/app/dashboard/prescription-card";
import {
  DOMAIN_GROUPS,
  DOMAIN_LABELS,
  getCalmBand,
} from "@/lib/domains";
import { DIAGNOSTIC_QUESTIONS, type DiagnosticDomain } from "@/lib/diagnostic-questions";
import type { DiagnosticReport } from "@/lib/diagnostic-report";
import type { Domain } from "@/lib/checkin-questions";

interface DiagnosticRow {
  calm_index: number | null;
  responses: Record<string, number> | null;
  report_raw: DiagnosticReport | null;
  created_at: string;
}

interface CheckinRow {
  calm_index: number;
  responses: Record<string, number> | null;
  created_at: string;
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function diagnosticDomainAverages(responses: Record<string, number> | null) {
  const totals = new Map<DiagnosticDomain, { total: number; count: number }>();
  for (const q of DIAGNOSTIC_QUESTIONS) {
    const score = responses?.[q.id];
    if (typeof score !== "number") continue;
    const existing = totals.get(q.domain) ?? { total: 0, count: 0 };
    existing.total += score;
    existing.count += 1;
    totals.set(q.domain, existing);
  }
  return new Map(
    Array.from(totals.entries()).map(([domain, v]) => [
      domain,
      v.count ? Math.round((v.total / v.count) * 10) / 10 : 0,
    ])
  );
}

function latestWeeklyDomainScore(checkins: CheckinRow[], domain: Domain): number | null {
  for (const c of [...checkins].reverse()) {
    const value = c.responses?.[domain];
    if (typeof value === "number") return value;
  }
  return null;
}

function addDays(date: string, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default async function MyPlanPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login?redirectTo=/my-plan");

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

  const [diagnosticRes, checkinsRes, prescriptionRes] = await Promise.all([
    admin
      .from("diagnostics")
      .select("calm_index, responses, report_raw, created_at")
      .eq("venue_id", venue.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("checkins")
      .select("calm_index, responses, created_at")
      .eq("venue_id", venue.id)
      .order("created_at", { ascending: true }),
    admin
      .from("prescriptions")
      .select("primary_problem, interventions, week_focus, watch_signal, primary_domain, created_at")
      .eq("venue_id", venue.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const diagnostic = diagnosticRes.data as DiagnosticRow | null;
  const checkins = ((checkinsRes.data ?? []) as CheckinRow[]).map((c) => ({
    ...c,
    responses: c.responses ?? {},
  }));
  const latestPrescription = prescriptionRes.data;
  const currentCalmIndex = checkins.at(-1)?.calm_index ?? diagnostic?.calm_index ?? 0;

  if (!diagnostic) {
    return (
      <div className="min-h-screen bg-transparent">
        <AppNav />
        <main className="w-full px-4 py-6 pb-12 sm:px-6 lg:px-8">
          <section className="border-l-4 border-primary bg-card p-6 sm:p-8">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              My Plan
            </p>
            <h1 className="mt-2 font-serif text-2xl text-foreground">No Deep Diagnostic yet</h1>
            <p className="mt-2 max-w-prose text-sm text-muted-foreground">
              My Plan fills from the Deep Diagnostic and then keeps updating as weekly scores
              come in.
            </p>
            <Link
              href="/diagnostic"
              className="mt-5 inline-flex h-11 cursor-pointer items-center justify-center bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/90"
            >
              Open Deep Diagnostic
            </Link>
          </section>
        </main>
      </div>
    );
  }

  const report = diagnostic.report_raw;
  const baseCalmIndex = diagnostic.calm_index ?? 0;
  const baseBand = getCalmBand(baseCalmIndex);
  const baseDomainScores = diagnosticDomainAverages(diagnostic.responses);
  const lowestDomains = Array.from(baseDomainScores.entries())
    .sort((a, b) => a[1] - b[1])
    .slice(0, 2);
  const ninetyDayDate = addDays(diagnostic.created_at, 90);

  return (
    <div className="min-h-screen bg-transparent">
      <AppNav />
      <main className="w-full px-4 py-6 pb-12 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="font-serif text-2xl text-foreground">My Plan</h1>
          <p className="mt-1 text-sm text-muted-foreground">{venue.name}</p>
        </div>

        <div className="space-y-6">
          <CalmThermostat value={baseCalmIndex} label="Base Calm Index" />

          <section className="border-l-[3px] border-primary bg-card p-5 sm:p-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Diagnostic overview
            </p>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <div>
                <p className="font-serif text-xl text-foreground">{baseBand.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">Base band</p>
              </div>
              <div>
                <p className="font-serif text-xl text-foreground">
                  {lowestDomains.map(([d]) => DOMAIN_LABELS[d]).join(", ") || "Not enough data"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Where to start</p>
              </div>
              <div>
                <p className="font-serif text-xl text-foreground">{formatDate(diagnostic.created_at)}</p>
                <p className="mt-1 text-sm text-muted-foreground">Base date</p>
              </div>
            </div>
            {report?.executive_summary && (
              <p className="mt-5 max-w-4xl whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {report.executive_summary}
              </p>
            )}
          </section>

          <section className="border-l-[3px] border-primary bg-card p-5 sm:p-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Seven domain scores from base
            </p>
            <div className="mt-4 space-y-5">
              {DOMAIN_GROUPS.map((group) => (
                <div key={group.id}>
                  <h2 className="font-serif text-xl text-foreground">{group.label}</h2>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {group.domains.map((domain) => {
                      const base = baseDomainScores.get(domain) ?? null;
                      const current = latestWeeklyDomainScore(checkins, domain) ?? base;
                      return (
                        <div key={domain} className="border border-border bg-background p-3">
                          <p className="font-medium text-foreground">{DOMAIN_LABELS[domain]}</p>
                          <p className="mt-2 text-sm text-muted-foreground">
                            Base {base == null ? "—" : `${base.toFixed(1)}/3`} to current{" "}
                            {current == null ? "—" : `${current.toFixed(1)}/3`}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {latestPrescription && (
            <section>
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Your Prescription
              </p>
              <PrescriptionCard rx={latestPrescription} calmIndex={currentCalmIndex} />
            </section>
          )}

          {report?.domain_insights?.length ? (
            <section className="border-l-[3px] border-primary bg-card p-5 sm:p-6">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                One design change per domain
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {report.domain_insights.map((domain) => (
                  <div key={domain.domain} className="border border-border bg-background p-3">
                    <p className="font-serif text-lg text-foreground">{domain.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {domain.improvements?.[0] ?? "No change listed yet."}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {report?.ninety_day_prescription && (
            <section className="border-l-[3px] border-primary bg-card p-5 sm:p-6">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Your ninety-day plan
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {[
                  { label: "Days 1 to 30", window: report.ninety_day_prescription.month_one },
                  { label: "Days 31 to 60", window: report.ninety_day_prescription.month_two },
                  { label: "Days 61 to 90", window: report.ninety_day_prescription.month_three },
                ].map(({ label, window }) => {
                  if (!window) return null;
                  return (
                    <div key={label} className="border border-border bg-background p-4">
                      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        {label}
                      </p>
                      <h3 className="mt-2 font-serif text-xl text-foreground">{window.focus}</h3>
                      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                        {window.actions?.map((action) => (
                          <li key={action} className="flex gap-2">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="border-l-[3px] border-primary bg-card p-5 sm:p-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Re-score reminder
            </p>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              <div>
                <p className="font-serif text-xl text-foreground">{currentCalmIndex}/10</p>
                <p className="mt-1 text-sm text-muted-foreground">Today&apos;s number</p>
              </div>
              <div>
                <p className="font-serif text-xl text-foreground">{formatDate(ninetyDayDate)}</p>
                <p className="mt-1 text-sm text-muted-foreground">Ninety days on</p>
              </div>
              <div>
                <Link
                  href="/score"
                  className="inline-flex h-11 cursor-pointer items-center justify-center bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors duration-200 hover:bg-primary/90"
                >
                  Take new number
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
