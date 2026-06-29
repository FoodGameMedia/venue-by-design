import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AppShell } from "@/components/app-shell";
import {
  DOMAIN_DEFINITIONS,
  DOMAIN_GROUPS,
  DOMAIN_LABELS,
  DOMAIN_REFERENCE_DETAILS,
} from "@/lib/domains";
import type { Domain } from "@/lib/checkin-questions";
import { DomainsExplainer } from "@/components/page-explainer";

interface CheckinRow {
  responses: Record<string, number> | null;
  created_at: string;
}

function scoreLabel(score: number | null): string {
  return score == null ? "No score yet" : `${score.toFixed(1)}/3`;
}

function getDomainTrend(checkins: CheckinRow[], domain: Domain) {
  const points = checkins
    .map((c) => ({
      score: typeof c.responses?.[domain] === "number" ? c.responses[domain] : null,
      date: c.created_at,
    }))
    .filter((p): p is { score: number; date: string } => p.score != null);

  return {
    base: points[0]?.score ?? null,
    current: points.at(-1)?.score ?? null,
    count: points.length,
  };
}

export default async function DomainsPage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) redirect("/login?redirectTo=/domains");

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

  const [checkinsRes, domainScoresRes, prescriptionRes] = await Promise.all([
    admin
      .from("checkins")
      .select("responses, created_at")
      .eq("venue_id", venue.id)
      .order("created_at", { ascending: true }),
    admin.from("domain_scores").select("domain, score").eq("venue_id", venue.id),
    admin
      .from("prescriptions")
      .select("primary_domain, primary_problem, interventions, week_focus, watch_signal")
      .eq("venue_id", venue.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const checkins = ((checkinsRes.data ?? []) as CheckinRow[]).map((c) => ({
    ...c,
    responses: c.responses ?? {},
  }));
  const domainScores = domainScoresRes.data ?? [];
  const latestPrescription = prescriptionRes.data;

  return (
    <AppShell>
      <main className="w-full px-4 py-6 pb-12 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="font-serif text-2xl text-foreground">Domains</h1>
          <p className="mt-1 text-sm text-muted-foreground">{venue.name}</p>
        </div>

        <DomainsExplainer />

        <div className="space-y-6">
          {DOMAIN_GROUPS.map((group) => (
            <section key={group.id} className="border-l-4 border-primary bg-card p-5 sm:p-6">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {group.label}
              </p>
              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                {group.domains.map((domain) => {
                  const current =
                    domainScores.find((s) => s.domain === domain)?.score ??
                    getDomainTrend(checkins, domain).current;
                  const trend = getDomainTrend(checkins, domain);
                  const isPrimary = latestPrescription?.primary_domain === domain;

                  return (
                    <details
                      key={domain}
                      className="group border border-border bg-background p-4 open:border-primary"
                    >
                      <summary className="cursor-pointer list-none">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h2 className="font-serif text-xl text-foreground">
                              {DOMAIN_LABELS[domain]}
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {DOMAIN_DEFINITIONS[domain]}
                            </p>
                          </div>
                          <span className="shrink-0 font-serif text-2xl text-primary">
                            {scoreLabel(current)}
                          </span>
                        </div>
                      </summary>

                      <div className="mt-4 space-y-4 border-t border-border pt-4">
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                            Mini trend from base
                          </p>
                          <p className="mt-1 text-sm text-foreground">
                            Base {scoreLabel(trend.base)} to current {scoreLabel(current)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {trend.count} weekly score{trend.count === 1 ? "" : "s"} recorded.
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                            Prescribed change
                          </p>
                          {isPrimary ? (
                            <>
                              <p className="mt-1 text-sm text-foreground">
                                {latestPrescription.week_focus}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {latestPrescription.primary_problem}
                              </p>
                            </>
                          ) : (
                            <p className="mt-1 text-sm text-muted-foreground">
                              No active prescribed change for this domain yet.
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                            Calm test
                          </p>
                          <p className="mt-1 text-sm text-foreground">
                            Does it hold on the night its author is rostered off?
                          </p>
                        </div>
                      </div>
                    </details>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <section id="reference" className="mt-6 border-l-[3px] border-primary bg-card p-5 sm:p-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Reference
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {DOMAIN_GROUPS.flatMap((g) => g.domains).map((domain) => (
              <div key={domain} className="border border-border bg-background p-4">
                <p className="font-serif text-lg text-foreground">{DOMAIN_LABELS[domain]}</p>
                <p className="mt-1 text-xs text-muted-foreground">{DOMAIN_DEFINITIONS[domain]}</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {DOMAIN_REFERENCE_DETAILS[domain]}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
