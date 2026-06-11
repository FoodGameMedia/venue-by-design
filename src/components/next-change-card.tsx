"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { DOMAIN_LABELS } from "@/lib/domains";
import type { Domain } from "@/lib/checkin-questions";

interface NextChangeInput {
  primary_domain: string;
  interventions: unknown;
  week_focus: string;
  watch_signal: string;
}

function toInterventionText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const item = value as { title?: string; action?: string };
    return item.action ?? item.title ?? String(value);
  }
  return String(value);
}

export function NextChangeCard({ rx }: { rx: NextChangeInput | null }) {
  const changes = useMemo(() => {
    if (!rx || !Array.isArray(rx.interventions)) return [];
    return rx.interventions.map(toInterventionText).filter(Boolean);
  }, [rx]);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = changes[activeIndex];
  const domain = rx?.primary_domain as Domain | undefined;

  if (!rx || !active) {
    return (
      <section className="border-l-[3px] border-primary bg-card p-5 sm:p-6">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Your next change
        </p>
        <p className="mt-2 font-serif text-xl text-foreground">No active change yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Complete a weekly score to create a prescription. One small change will sit here
          until it has held.
        </p>
      </section>
    );
  }

  return (
    <section className="border-l-[3px] border-primary bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Your next change
          </p>
          <h2 className="mt-2 font-serif text-2xl text-foreground">{active}</h2>
        </div>
        <span className="border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
          {activeIndex + 1} of {changes.length}
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Domain
          </p>
          <p className="mt-1 text-sm text-foreground">
            {domain ? DOMAIN_LABELS[domain] : rx.primary_domain.replace(/_/g, " ")}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Cue
          </p>
          <p className="mt-1 text-sm text-foreground">{rx.watch_signal}</p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Owner
          </p>
          <p className="mt-1 text-sm text-foreground">Shift lead on duty</p>
        </div>
      </div>

      <p className="mt-5 text-sm text-muted-foreground">
        Week focus: <span className="text-foreground">{rx.week_focus}</span>
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          onClick={() => setActiveIndex((i) => Math.min(i + 1, changes.length - 1))}
          disabled={activeIndex === changes.length - 1}
        >
          Mark held
        </Button>
        <Button type="button" variant="outline">
          Not yet held
        </Button>
      </div>
    </section>
  );
}
