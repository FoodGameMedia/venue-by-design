"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DOMAIN_LABELS } from "@/lib/domains";
import { DOMAINS, type Domain } from "@/lib/checkin-questions";
import { MAX_ACTIVE_BREAKPOINTS } from "@/lib/systems/limits";

export interface BreakpointRow {
  id: string;
  description: string;
  trigger: string;
  domain: Domain | null;
  resolvedAt: string | null;
}

export function BreakpointsForm({
  venueId,
  initial,
}: {
  venueId: string;
  initial: BreakpointRow[];
}) {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState("");
  const [domain, setDomain] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const open = initial.filter((b) => !b.resolvedAt);
  const resolved = initial.filter((b) => b.resolvedAt);
  const atCeiling = open.length >= MAX_ACTIVE_BREAKPOINTS;

  async function add(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/systems/breakpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          venueId,
          description,
          trigger,
          domain: domain || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save that breakpoint.");
        return;
      }
      setDescription("");
      setTrigger("");
      setDomain("");
      router.refresh();
    } catch {
      setError("Could not save that breakpoint.");
    } finally {
      setBusy(false);
    }
  }

  async function setResolved(id: string, value: boolean) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/systems/breakpoints", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId, id, resolved: value }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Could not update that breakpoint.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not update that breakpoint.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 space-y-8">
      <section>
        <p className="vbd-section-label">Open breakpoints</p>
        {open.length === 0 ? (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Nothing named yet. Think about the last month: which three moments reliably turned an
            ordinary night into a bad one, and what small thing started each of them.
          </p>
        ) : (
          <ul className="mt-3 space-y-3" data-testid="breakpoint-list">
            {open.map((b) => (
              <li key={b.id} className="vbd-elevated-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-serif text-base text-foreground">{b.description}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Trigger: {b.trigger}
                      {b.domain ? ` · ${DOMAIN_LABELS[b.domain]}` : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy}
                    onClick={() => void setResolved(b.id, true)}
                  >
                    Designed out
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <p className="vbd-section-label">Add a breakpoint</p>
        {atCeiling ? (
          <p className="mt-3 text-sm leading-relaxed text-champagne">
            You have {MAX_ACTIVE_BREAKPOINTS} open. That is the ceiling on purpose. Design one out
            before you add another, or the map stops being a map and becomes a list of grievances.
          </p>
        ) : (
          <form onSubmit={add} className="mt-3 space-y-4" data-testid="breakpoint-form">
            <div className="space-y-2">
              <Label htmlFor="bp-description">What reliably goes wrong</Label>
              <Input
                id="bp-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="The Friday changeover falls apart"
                required
                maxLength={300}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bp-trigger">The small thing that starts it</Label>
              <Input
                id="bp-trigger"
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
                placeholder="Day team leaves before the night team is briefed"
                required
                maxLength={300}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bp-domain">Domain, if you know it</Label>
              <select
                id="bp-domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="">Not sure yet</option>
                {DOMAINS.map((d) => (
                  <option key={d} value={d}>
                    {DOMAIN_LABELS[d]}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Add to the map"}
            </Button>
          </form>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}
      </section>

      {resolved.length > 0 && (
        <section>
          <p className="vbd-section-label">Designed out</p>
          <ul className="mt-3 space-y-2">
            {resolved.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 border-l-[3px] border-border bg-card p-4"
              >
                <p className="text-sm text-muted-foreground line-through">{b.description}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => void setResolved(b.id, false)}
                >
                  It is back
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
