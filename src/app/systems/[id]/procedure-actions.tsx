"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ProcedureVerdict } from "@/lib/systems/method-questions";

export function ProcedureActions({
  venueId,
  procedureId,
  audited,
  status,
}: {
  venueId: string;
  procedureId: string;
  audited: boolean;
  status: "draft" | "live" | "installed";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runAudit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/systems/procedures/${procedureId}/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not audit that procedure.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not audit that procedure.");
    } finally {
      setBusy(false);
    }
  }

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/systems/procedures/${procedureId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId, ...body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not update that procedure.");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not update that procedure.");
    } finally {
      setBusy(false);
    }
  }

  const overrides: { verdict: ProcedureVerdict; label: string }[] = [
    { verdict: "keep", label: "Keep it" },
    { verdict: "rewrite", label: "Needs a rewrite" },
    { verdict: "retire", label: "Retire it" },
  ];

  return (
    <div className="mt-8 space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void runAudit()} disabled={busy}>
          {busy ? "Working…" : audited ? "Run the audit again" : "Run the audit"}
        </Button>

        {status === "draft" && (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => void patch({ status: "live" })}
          >
            Put it in use
          </Button>
        )}
      </div>

      {audited && (
        <div>
          <p className="vbd-section-label">Disagree with the verdict?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {overrides.map((o) => (
              <Button
                key={o.verdict}
                type="button"
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => void patch({ verdict: o.verdict })}
              >
                {o.label}
              </Button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Your call is recorded alongside the audit, not instead of it.
          </p>
        </div>
      )}

      {status === "live" && (
        <div className="border-l-[3px] border-champagne bg-card p-5">
          <p className="font-serif text-base text-foreground">Live, but not yet installed</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            A procedure is only installed once it has held on a shift its author was rostered off.
            If it needs you in the building, it is not yet a design. That check arrives with the
            next release, and until then nothing here can be marked installed.
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
