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

export function PrescriptionCard({ rx }: { rx: Prescription }) {
  const interventions = Array.isArray(rx.interventions)
    ? rx.interventions.map((i) => (typeof i === "string" ? i : (i as { title?: string })?.title ?? String(i)))
    : [];

  return (
    <div className="rounded-xl border border-[#3C3F43]/20 bg-[#F2EBE2]/50 p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-[#B9704B]">
        This week: {formatDomain(rx.primary_domain)}
      </p>
      <p className="mt-2 text-[#1A1A1A]">{rx.primary_problem}</p>
      {interventions.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-[#3C3F43]">
          {interventions.slice(0, 5).map((item, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-[#B9704B]">•</span>
              {item}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-sm font-medium text-[#1A1A1A]">Focus this week</p>
      <p className="text-sm text-[#3C3F43]">{rx.week_focus}</p>
      <p className="mt-2 text-sm font-medium text-[#1A1A1A]">Watch for</p>
      <p className="text-sm text-[#3C3F43]">{rx.watch_signal}</p>
    </div>
  );
}
