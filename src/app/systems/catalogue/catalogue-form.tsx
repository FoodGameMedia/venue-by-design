"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DOMAIN_LABELS } from "@/lib/domains";
import type { Domain } from "@/lib/checkin-questions";
import { CATALOGUE_GROUP_LABELS, MINIMUM_SET_CEILING } from "@/lib/systems/catalogue";
import { ORDER_REASON_LABELS } from "@/lib/systems/catalogue-order";

type SelectionState = "missing" | "not_working";
type ObligationStatus = "have" | "missing" | "sourced";

export interface CatalogueItemView {
  id: string;
  group: "systems_flow" | "people_memory" | "operational_memory" | "addition";
  title: string;
  domain: Domain;
  without: string;
  optional: boolean;
  reason: "bookend" | "venue_type" | "under_pressure" | null;
  state: SelectionState | null;
}

export interface ObligationView {
  id: string;
  heading: string;
  authority: string;
  status: ObligationStatus | null;
}

const GROUP_ORDER = ["systems_flow", "people_memory", "operational_memory", "addition"] as const;

const GROUP_LABELS: Record<(typeof GROUP_ORDER)[number], string> = {
  ...CATALOGUE_GROUP_LABELS,
  addition: "Common in your kind of venue",
};

/**
 * Items arrive already ranked: the two bookends, then the venue type's lead,
 * then anything in a weak domain. Rendering straight into groups threw that
 * away and buried the welcome and the ending halfway down the page, which is
 * the opposite of the rule. So the suggested ones lead, in rank order, and the
 * groups below hold the rest.
 */
const SUGGESTED_LABEL = "Start here";

export function CatalogueForm({
  venueId,
  items,
  obligations,
  ceilingMessage,
}: {
  venueId: string;
  items: CatalogueItemView[];
  obligations: ObligationView[];
  ceilingMessage: string;
}) {
  const router = useRouter();
  const [local, setLocal] = useState<Record<string, SelectionState | null>>(
    () => Object.fromEntries(items.map((i) => [i.id, i.state]))
  );
  const [obligationState, setObligationState] = useState<Record<string, ObligationStatus | null>>(
    () => Object.fromEntries(obligations.map((o) => [o.id, o.status]))
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const optionalIds = useMemo(
    () => new Set(items.filter((i) => i.optional).map((i) => i.id)),
    [items]
  );

  const counted = useMemo(
    () =>
      Object.entries(local).filter(([id, state]) => state !== null && !optionalIds.has(id))
        .length,
    [local, optionalIds]
  );

  async function post(payload: Record<string, unknown>, key: string) {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch("/api/systems/catalogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId, ...payload }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Could not save that.");
        return false;
      }
      return true;
    } catch {
      setError("Could not save that.");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function tick(itemId: string, next: SelectionState) {
    const current = local[itemId];
    const value = current === next ? null : next;
    setLocal((prev) => ({ ...prev, [itemId]: value }));
    const ok = await post({ action: "select", itemId, state: value }, itemId);
    if (!ok) setLocal((prev) => ({ ...prev, [itemId]: current }));
  }

  async function setObligation(obligationId: string, status: ObligationStatus) {
    const current = obligationState[obligationId];
    setObligationState((prev) => ({ ...prev, [obligationId]: status }));
    const ok = await post({ action: "obligation", obligationId, status }, obligationId);
    if (!ok) setObligationState((prev) => ({ ...prev, [obligationId]: current }));
  }

  const suggested = items.filter((i) => i.reason !== null);
  const suggestedIds = new Set(suggested.map((i) => i.id));

  function card(item: CatalogueItemView) {
    const state = local[item.id];
    return (
                  <li
                    key={item.id}
                    className={cn(
                      "vbd-elevated-card p-5 transition-opacity",
                      state === null && "opacity-90"
                    )}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-serif text-base text-foreground">{item.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {DOMAIN_LABELS[item.domain]}
                          {item.reason && ` · ${ORDER_REASON_LABELS[item.reason]}`}
                          {item.optional && " · Optional"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={state === "missing" ? "default" : "outline"}
                          disabled={busy === item.id}
                          onClick={() => void tick(item.id, "missing")}
                        >
                          We do not have one
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={state === "not_working" ? "default" : "outline"}
                          disabled={busy === item.id}
                          onClick={() => void tick(item.id, "not_working")}
                        >
                          Not working
                        </Button>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {item.without}
                    </p>
                    {state !== null && (
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <a
                          href={`/systems/catalogue/${item.id}`}
                          className="vbd-cta vbd-cta-lg vbd-cta-outline"
                        >
                          Write this one
                        </a>
                        {state === "not_working" && (
                          <span className="text-xs text-champagne">
                            We will put this on your fragility map first.
                          </span>
                        )}
                      </div>
                    )}
      </li>
    );
  }

  return (
    <div className="mt-8 space-y-10">
      {suggested.length > 0 && (
        <section>
          <p className="vbd-section-label-accent">{SUGGESTED_LABEL}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The welcome and the ending matter for every venue. The rest of these are where you
            are weakest, or common in your kind of venue.
          </p>
          <ul className="mt-3 space-y-2" data-testid="catalogue-suggested">
            {suggested.map((item) => card(item))}
          </ul>
        </section>
      )}

      {GROUP_ORDER.map((group) => {
        const groupItems = items.filter(
          (i) => i.group === group && !suggestedIds.has(i.id)
        );
        if (groupItems.length === 0) return null;

        return (
          <section key={group}>
            <p className="vbd-section-label">{GROUP_LABELS[group]}</p>
            <ul className="mt-3 space-y-2" data-testid={`catalogue-group-${group}`}>
              {groupItems.map((item) => card(item))}
            </ul>
          </section>
        );
      })}

      {counted > MINIMUM_SET_CEILING && (
        <section className="border-l-[3px] border-champagne bg-card p-6">
          <p className="vbd-section-label-accent">More than the minimum set</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">{ceilingMessage}</p>
        </section>
      )}

      <section>
        <p className="vbd-section-label">Outside what we audit</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          These are the procedures every venue needs that the method has nothing to say about.
          We will not write them, and they never get a verdict. Tell us which you have, and
          where you do not, we will point you at who sets the standard.
        </p>
        <ul className="mt-3 space-y-2" data-testid="obligations-list">
          {obligations.map((o) => {
            const status = obligationState[o.id];
            return (
              <li key={o.id} className="border-l-[3px] border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-foreground">{o.heading}</p>
                  <div className="flex shrink-0 gap-2">
                    {(["have", "missing", "sourced"] as const).map((value) => (
                      <Button
                        key={value}
                        type="button"
                        size="xs"
                        variant={status === value ? "default" : "ghost"}
                        disabled={busy === o.id}
                        onClick={() => void setObligation(o.id, value)}
                      >
                        {value === "have"
                          ? "We have one"
                          : value === "missing"
                            ? "We do not"
                            : "Sourced"}
                      </Button>
                    ))}
                  </div>
                </div>
                {status === "missing" && (
                  <p className="mt-2 text-sm leading-relaxed text-champagne">
                    The standard is set by {o.authority}.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" size="lg" onClick={() => router.push("/systems")}>
          Done for now
        </Button>
        <span className="text-xs text-muted-foreground">
          {counted} picked. Everything saves as you go.
        </span>
      </div>
    </div>
  );
}
