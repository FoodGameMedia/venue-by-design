"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [clientList, setClientList] = useState(clients);
  const [operatorEmail, setOperatorEmail] = useState("");
  const [linking, setLinking] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function handleLinkClient(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLinking(true);
    setMessage(null);
    try {
      const res = await fetch("/api/advisor/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operatorEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to link client");
      }

      setClientList((existing) => {
        const withoutDuplicate = existing.filter((c) => c.venueId !== data.client.venueId);
        return [data.client, ...withoutDuplicate];
      });
      setOperatorEmail("");
      setMessage({ type: "success", text: "Client venue linked." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Something went wrong",
      });
    } finally {
      setLinking(false);
    }
  }

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleLinkClient}
        className="border-l-[3px] border-primary bg-card p-4 sm:p-6"
      >
        <h3 className="font-serif text-lg text-foreground">Link a client venue</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the operator email for the client venue you support.
        </p>
        <div className="mt-4 space-y-2">
          <Label htmlFor="operatorEmail">Operator email</Label>
          <Input
            id="operatorEmail"
            type="email"
            value={operatorEmail}
            onChange={(e) => setOperatorEmail(e.target.value)}
            placeholder="operator@venue.com"
            required
            className="border-input"
            data-testid="advisor-link-email"
          />
        </div>
        {message && (
          <p
            className={`mt-3 text-xs ${
              message.type === "error" ? "text-destructive" : "text-muted-foreground"
            }`}
            role={message.type === "error" ? "alert" : "status"}
          >
            {message.text}
          </p>
        )}
        <div className="mt-4">
          <Button type="submit" disabled={linking} className="w-full sm:w-auto">
            {linking ? "Linking..." : "Link client"}
          </Button>
        </div>
      </form>

      {clientList.length === 0 ? (
        <div className="border-l-[3px] border-primary bg-card p-6">
          <p className="font-serif text-lg text-foreground">No linked clients yet</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Once client venues are linked to your account, they will appear here with their latest
            Calm Index, domain scores, and prescription.
          </p>
        </div>
      ) : (
        <div className="space-y-4" data-testid="advisor-client-list">
          {clientList.map((client) => (
        <ClientCard key={client.venueId} client={client} />
          ))}
        </div>
      )}
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
      className="border-l-[3px] border-primary bg-card p-4 sm:p-6"
      data-testid="advisor-client-card"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-serif text-lg text-foreground">{client.venueName}</h3>
        <span className="font-serif text-2xl text-primary">
          {client.calmIndex != null ? `${client.calmIndex}/10` : "—"}
        </span>
      </div>
      {client.venueType && (
        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {client.venueType.replace("_", " ")}
        </p>
      )}

      {client.domainScores.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {client.domainScores.map((d) => (
            <span
              key={d.domain}
              className="border border-border bg-background px-2 py-1 text-xs text-muted-foreground"
            >
              {DOMAIN_LABELS[d.domain] ?? d.domain}: {d.score.toFixed(1)}
            </span>
          ))}
        </div>
      )}

      {client.latestPrescription ? (
        <div className="mt-4 border-l-2 border-primary bg-background p-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-primary">Latest prescription</p>
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
