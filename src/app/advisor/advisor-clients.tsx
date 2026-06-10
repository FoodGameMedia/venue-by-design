"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AdvisorClientSummary } from "@/lib/advisor";

const DOMAIN_LABELS: Record<string, string> = {
  throughput: "Throughput",
  defaults: "Defaults",
  signals: "Signals",
  pacing: "Pacing",
  endings: "Endings",
  people_load: "People Load",
  operational_memory: "Op. Memory",
};

export function AdvisorClients({ clients }: { clients: AdvisorClientSummary[] }) {
  return (
    <div className="space-y-4" data-testid="advisor-client-list">
      {clients.map((client) => (
        <ClientCard key={client.venueId} client={client} />
      ))}
    </div>
  );
}

function ClientCard({ client }: { client: AdvisorClientSummary }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerateReport() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/advisor/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId: client.venueId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to generate report");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `diagnostic-${client.venueName.replace(/\s+/g, "-")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6"
      data-testid="advisor-client-card"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-base font-medium text-foreground">{client.venueName}</h3>
        <span className="text-2xl font-serif font-semibold text-primary">
          {client.calmIndex != null ? `${client.calmIndex}/10` : "—"}
        </span>
      </div>
      {client.venueType && (
        <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
          {client.venueType.replace("_", " ")}
        </p>
      )}

      {client.domainScores.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {client.domainScores.map((d) => (
            <span
              key={d.domain}
              className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-muted-foreground"
            >
              {DOMAIN_LABELS[d.domain] ?? d.domain}: {d.score.toFixed(1)}
            </span>
          ))}
        </div>
      )}

      {client.latestPrescription ? (
        <div className="mt-4 rounded-lg border border-border bg-background p-3">
          <p className="text-xs uppercase tracking-wider text-primary">Latest prescription</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {client.latestPrescription.weekFocus}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {client.latestPrescription.primaryProblem}
          </p>
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">No prescription yet.</p>
      )}

      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

      <div className="mt-4">
        <Button
          onClick={handleGenerateReport}
          disabled={loading}
          className="w-full sm:w-auto"
          data-testid="advisor-generate-report"
        >
          {loading ? "Generating…" : "Generate branded report"}
        </Button>
      </div>
    </section>
  );
}
