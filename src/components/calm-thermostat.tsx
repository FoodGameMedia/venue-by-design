import { CALM_BANDS, getCalmBand } from "@/lib/domains";

function clamp(value: number): number {
  return Math.min(10, Math.max(0, value));
}

export function CalmThermostat({
  value,
  label = "Calm Index",
  valueTestId,
}: {
  value: number;
  label?: string;
  valueTestId?: string;
}) {
  const safeValue = clamp(Number.isFinite(value) ? value : 0);
  const band = getCalmBand(safeValue);
  const fill = `${safeValue * 10}%`;

  return (
    <div className="vbd-prescription-card p-6 sm:p-8" data-testid="calm-thermostat">
      <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-end">
        <div className="flex items-end gap-4">
          <div className="flex h-44 w-12 flex-col justify-end rounded-sm border border-border/80 bg-background p-1 shadow-[inset_0_2px_8px_rgba(0,0,0,0.15)]">
            <div className="w-full bg-primary transition-all duration-500" style={{ height: fill }} />
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-primary bg-primary/20">
            <div className="h-8 w-8 rounded-full bg-primary" />
          </div>
        </div>

        <div>
          <p className="vbd-section-label">
            {label}
          </p>
          <div className="mt-2 flex items-end gap-2">
            <span
              className="font-serif text-[72px] leading-none text-primary"
              data-testid={valueTestId}
            >
              {safeValue.toFixed(safeValue % 1 === 0 ? 0 : 1)}
            </span>
            <span className="pb-2 text-sm text-muted-foreground">out of 10</span>
          </div>
          <p className="mt-2 font-serif text-xl text-foreground">{band.label}</p>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            A score is not a grade. It is a map of how much variance the system absorbs
            before it reaches a person.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-3">
        {CALM_BANDS.map((b) => (
          <div
            key={b.id}
            className={`rounded-sm border px-3 py-2 text-xs transition-colors duration-200 ${
              b.id === band.id
                ? "border-primary bg-primary/15 text-foreground shadow-[0_2px_8px_rgba(214,150,169,0.12)]"
                : "border-border/80 bg-background text-muted-foreground"
            }`}
          >
            <span className="block font-medium">{b.label}</span>
            <span>
              {b.min} to {b.max}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
