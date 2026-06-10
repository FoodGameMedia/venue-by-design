interface Prescription {
  primary_problem: string;
  interventions: unknown;
  week_focus: string;
  watch_signal: string;
  primary_domain: string;
  created_at: string;
}

function formatDomain(domain: string): string {
  return domain
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </p>
  );
}

export function PrescriptionCard({
  rx,
  calmIndex,
}: {
  rx: Prescription;
  calmIndex?: number | null;
}) {
  const interventions = Array.isArray(rx.interventions)
    ? rx.interventions.map((i) =>
        typeof i === "string" ? i : (i as { title?: string })?.title ?? String(i)
      )
    : [];

  return (
    <div className="border-l-4 border-primary bg-card">
      <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-[auto_1.4fr_1.4fr_1.4fr] md:gap-10 md:p-8">
        {/* 1. Calm Index */}
        <div className="flex flex-col">
          <span className="font-serif text-[64px] leading-none text-primary">
            {calmIndex ?? "—"}
          </span>
          <SectionLabel>Calm Index</SectionLabel>
          <span className="mt-1 text-xs text-muted-foreground/80">out of 10</span>
        </div>

        {/* 2. Primary domain + primary problem */}
        <div className="flex flex-col gap-2 md:border-l md:border-border md:pl-10">
          <SectionLabel>Primary domain</SectionLabel>
          <p className="font-serif text-xl text-foreground">
            {formatDomain(rx.primary_domain)}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-foreground/90">
            {rx.primary_problem}
          </p>
        </div>

        {/* 3. Interventions */}
        <div className="flex flex-col gap-2 md:border-l md:border-border md:pl-10">
          <SectionLabel>Interventions</SectionLabel>
          {interventions.length > 0 ? (
            <ul className="mt-1 space-y-2 text-sm text-foreground/90">
              {interventions.slice(0, 3).map((item, i) => (
                <li key={i} className="flex gap-2.5">
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">No interventions listed.</p>
          )}
        </div>

        {/* 4. Week focus + watch signal */}
        <div className="flex flex-col gap-4 md:border-l md:border-border md:pl-10">
          <div className="flex flex-col gap-1">
            <SectionLabel>Week focus</SectionLabel>
            <p className="text-sm leading-relaxed text-foreground/90">{rx.week_focus}</p>
          </div>
          <div className="flex flex-col gap-1">
            <SectionLabel>Watch signal</SectionLabel>
            <p className="text-sm leading-relaxed text-foreground/90">{rx.watch_signal}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
