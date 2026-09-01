"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { VerdictChip } from "@/components/systems/verdict-chip";
import { cn } from "@/lib/utils";
import {
  EXPORT_TARGETS,
  EXPORT_TARGET_LABELS,
  type ExportTarget,
} from "@/lib/systems/procedure-text";
import {
  VERDICT_DESCRIPTIONS,
  type ProcedureVerdict,
} from "@/lib/systems/method-questions";

export interface QueueItem {
  id: string;
  title: string;
  verdict: ProcedureVerdict;
}

const QUEUES: { verdict: ProcedureVerdict; heading: string }[] = [
  { verdict: "keep", heading: "Keep" },
  { verdict: "rewrite", heading: "Rewrite as defaults" },
  { verdict: "retire", heading: "Retire" },
];

export function ExportQueue({
  venueId,
  items,
}: {
  venueId: string;
  items: QueueItem[];
}) {
  // Retired procedures start unselected. You do not print what you are binning.
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(items.filter((i) => i.verdict !== "retire").map((i) => i.id))
  );
  const [target, setTarget] = useState<ExportTarget>("generic");
  const [text, setText] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "pdf" | "text">(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const selectedIds = useMemo(
    () => items.filter((i) => selected.has(i.id)).map((i) => i.id),
    [items, selected]
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleGroup(verdict: ProcedureVerdict) {
    const group = items.filter((i) => i.verdict === verdict).map((i) => i.id);
    const allOn = group.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of group) {
        if (allOn) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }

  async function exportAs(format: "pdf" | "text") {
    setBusy(format);
    setError(null);
    setText(null);
    setCopied(false);

    try {
      const res = await fetch("/api/systems/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId, format, target, procedureIds: selectedIds }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not build that export.");
        return;
      }

      if (format === "text") {
        setText(data.text);
      } else {
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
    } catch {
      setError("Could not build that export.");
    } finally {
      setBusy(null);
    }
  }

  async function copyText() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setError("Could not copy. Select the text and copy it manually.");
    }
  }

  // Nothing audited means nothing to hand off. An empty export card is noise.
  if (items.length === 0) return null;

  return (
    <>
      {QUEUES.map(({ verdict, heading }) => {
        const group = items.filter((i) => i.verdict === verdict);
        if (group.length === 0) return null;
        const allOn = group.every((i) => selected.has(i.id));

        return (
          <section key={verdict} className="mt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="vbd-section-label">
                {heading} ({group.length})
              </p>
              <button
                type="button"
                onClick={() => toggleGroup(verdict)}
                className="cursor-pointer text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {allOn ? "Deselect all" : "Select all"}
              </button>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {VERDICT_DESCRIPTIONS[verdict]}
            </p>
            <ul className="mt-3 space-y-2">
              {group.map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    "vbd-elevated-card flex flex-wrap items-center gap-3 p-4 transition-opacity",
                    !selected.has(item.id) && "opacity-60"
                  )}
                >
                  <input
                    type="checkbox"
                    id={`select-${item.id}`}
                    checked={selected.has(item.id)}
                    onChange={() => toggle(item.id)}
                    className="size-4 shrink-0 cursor-pointer accent-[var(--rose)]"
                  />
                  <label
                    htmlFor={`select-${item.id}`}
                    className="min-w-0 flex-1 cursor-pointer font-serif text-base text-foreground"
                  >
                    {item.title}
                  </label>
                  <VerdictChip verdict={item.verdict} />
                  <Link
                    href={`/systems/${item.id}`}
                    className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <section className="mt-10 border-l-[3px] border-primary bg-card p-6">
        <p className="vbd-section-label-accent">Hand it off</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Venue by Design writes the procedure. The tool you already run enforces it. Print the
          pack for the wall, or copy the text straight into your checklist builder.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label htmlFor="export-target" className="text-xs text-muted-foreground">
            Formatted for
          </label>
          <select
            id="export-target"
            value={target}
            onChange={(e) => setTarget(e.target.value as ExportTarget)}
            className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground"
          >
            {EXPORT_TARGETS.map((t) => (
              <option key={t} value={t}>
                {EXPORT_TARGET_LABELS[t]}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">
            {selectedIds.length} selected
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={busy !== null || selectedIds.length === 0}
            onClick={() => void exportAs("pdf")}
          >
            {busy === "pdf" ? "Building…" : "Print pack (PDF)"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy !== null || selectedIds.length === 0}
            onClick={() => void exportAs("text")}
          >
            {busy === "text" ? "Building…" : "Copy-ready text"}
          </Button>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {text && (
          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Paste each block into a separate checklist.
              </p>
              <Button type="button" variant="ghost" size="sm" onClick={() => void copyText()}>
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <textarea
              readOnly
              value={text}
              rows={16}
              className="mt-2 w-full rounded-lg border border-border bg-background p-3 font-mono text-xs leading-relaxed text-foreground"
            />
          </div>
        )}
      </section>
    </>
  );
}
