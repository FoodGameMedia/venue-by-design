"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { MAX_IMAGES } from "@/lib/systems/limits";

type Door = "document" | "photos" | "describe";

const DOORS: { id: Door; label: string; hint: string }[] = [
  {
    id: "document",
    label: "Upload a document",
    hint: "A Word file or a PDF. Scanned PDFs are fine, we can read those.",
  },
  {
    id: "photos",
    label: "Photograph it",
    hint: `A binder page or a laminated card. Up to ${MAX_IMAGES} photos for one procedure.`,
  },
  {
    id: "describe",
    label: "Describe a shift",
    hint: "Nothing written down? Say how a normal shift actually runs.",
  },
];

const DESCRIBE_PROMPT = `What happens at the start of the day, who does what, and in what order?
What happens when it goes wrong mid-service and you are not on the floor?
How does one shift hand over to the next?`;

export function IngestForm({ venueId }: { venueId: string }) {
  const router = useRouter();
  const [door, setDoor] = useState<Door>("document");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      let res: Response;

      if (door === "describe") {
        res = await fetch("/api/systems/procedures", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ venueId, title, body }),
        });
      } else {
        if (!files || files.length === 0) {
          setError("Choose a file first.");
          return;
        }
        const form = new FormData();
        form.set("venueId", venueId);
        form.set("title", title);
        for (const file of Array.from(files)) form.append("files", file);
        res = await fetch("/api/systems/procedures", { method: "POST", body: form });
      }

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not read that procedure.");
        return;
      }

      router.push(`/systems/${data.procedure.id}`);
    } catch {
      setError("Could not read that procedure.");
    } finally {
      setBusy(false);
    }
  }

  const activeDoor = DOORS.find((d) => d.id === door)!;

  return (
    <form onSubmit={submit} className="mt-8 space-y-6" data-testid="systems-ingest-form">
      <div className="flex flex-wrap gap-2">
        {DOORS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => {
              setDoor(d.id);
              setError(null);
            }}
            className={cn(
              "inline-flex h-8 cursor-pointer items-center rounded-md border border-border/80 bg-background px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
              door === d.id && "vbd-nav-active"
            )}
          >
            {d.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">{activeDoor.hint}</p>

      <div className="space-y-2">
        <Label htmlFor="procedure-title">Name it, if you have one</Label>
        <Input
          id="procedure-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Friday handover"
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground">
          Optional. The audit will name it if you leave this blank.
        </p>
      </div>

      {door === "describe" ? (
        <div className="space-y-2">
          <Label htmlFor="procedure-body">How the shift actually runs</Label>
          <textarea
            id="procedure-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            placeholder={DESCRIBE_PROMPT}
            className="w-full rounded-lg border border-border bg-background p-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/70"
            required
          />
          <p className="text-xs text-muted-foreground">
            Write what happens, not what is supposed to happen. The gap between those two is the
            whole point of this.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="procedure-files">
            {door === "photos" ? "Photos" : "Document"}
          </Label>
          <input
            id="procedure-files"
            type="file"
            multiple={door === "photos"}
            accept={
              door === "photos"
                ? "image/jpeg,image/png,image/webp"
                : "application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            }
            onChange={(e) => setFiles(e.target.files)}
            className="block w-full cursor-pointer rounded-lg border border-border bg-background p-3 text-sm text-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:text-foreground"
            required
          />
          <p className="text-xs text-muted-foreground">10MB per file.</p>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Adding and auditing are deliberately two steps. Reading the source is
          cheap, the audit is a model call, and the operator should see what we
          read before we judge it. */}
      <Button type="submit" disabled={busy} size="lg">
        {busy ? "Reading it…" : "Add it"}
      </Button>
    </form>
  );
}
