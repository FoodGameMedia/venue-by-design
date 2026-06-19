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
          <div className="relative flex h-44 w-12 flex-col justify-end overflow-hidden rounded-sm border border-[#C9A87C]/30 bg-background p-1 shadow-[inset_0_2px_8px_rgba(0,0,0,0.15),0_0_20px_rgba(201,168,124,0.12)]">
            <div
              className="w-full transition-all duration-500"
              style={{
                height: fill,
                background: "linear-gradient(180deg, #C9A87C 0%, #D696A9 55%, #8B3A52 100%)",
              }}
            />
          </div>
          <div className="vbd-champagne-ring flex h-14 w-14 items-center justify-center rounded-full border border-[#C9A87C]/50 bg-[#C9A87C]/15">
            <div
              className="h-8 w-8 rounded-full"
              style={{
                background: "linear-gradient(135deg, #C9A87C 0%, #D696A9 100%)",
              }}
            />
          </div>
        </div>

        <div>
          <p className="vbd-section-label-accent">{label}</p>
          <div className="mt-2 flex items-end gap-2">
            <span
              className="vbd-stat-highlight font-serif text-[72px] leading-none"
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
                ? "border-[#C9A87C]/50 bg-[#C9A87C]/12 text-foreground shadow-[0_2px_12px_rgba(201,168,124,0.18)]"
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
