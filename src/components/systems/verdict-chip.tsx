import { cn } from "@/lib/utils";
import { VERDICT_LABELS, type ProcedureVerdict } from "@/lib/systems/method-questions";

const VERDICT_STYLES: Record<ProcedureVerdict, string> = {
  keep: "border-primary/40 bg-primary/10 text-primary",
  rewrite: "border-champagne/40 bg-champagne-muted text-champagne",
  retire: "border-border bg-muted text-muted-foreground",
};

export function VerdictChip({
  verdict,
  className,
}: {
  verdict: ProcedureVerdict | null;
  className?: string;
}) {
  if (!verdict) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-muted-foreground",
          className
        )}
      >
        Not audited
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        VERDICT_STYLES[verdict],
        className
      )}
    >
      {VERDICT_LABELS[verdict]}
    </span>
  );
}
