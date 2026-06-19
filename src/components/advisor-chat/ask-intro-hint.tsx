"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const ASK_INTRO_DISMISSED_KEY = "vbd-ask-intro-dismissed";

export function AskIntroHint({
  visible,
  onTry,
}: {
  visible: boolean;
  onTry: () => void;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!visible) {
      setShow(false);
      return;
    }
    try {
      if (localStorage.getItem(ASK_INTRO_DISMISSED_KEY)) return;
      setShow(true);
    } catch {
      setShow(false);
    }
  }, [visible]);

  function dismiss() {
    try {
      localStorage.setItem(ASK_INTRO_DISMISSED_KEY, "1");
    } catch {
      // localStorage may be unavailable
    }
    setShow(false);
  }

  function handleTry() {
    dismiss();
    onTry();
  }

  if (!show) return null;

  return (
    <div
      role="status"
      className={cn(
        "fixed bottom-[4.75rem] right-4 z-50 w-[min(calc(100vw-2rem),280px)]",
        "rounded-lg border border-border bg-card p-4 shadow-lg sm:right-6"
      )}
    >
      <div className="flex items-start gap-2">
        <MessageCircle className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-foreground">
            Got a question about your venue? Ask draws on your scores and the Calm Venue method.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={handleTry} className="h-8 px-3 text-xs">
              Try it
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={dismiss}
              className="h-8 px-3 text-xs text-muted-foreground"
            >
              Dismiss
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss Ask introduction"
          className="cursor-pointer shrink-0 rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
