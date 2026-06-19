"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/lib/venue-advisor-chat";
import { AskIntroHint } from "./ask-intro-hint";

const STARTER_QUESTIONS = [
  "What should I focus on this week?",
  "Why is my lowest domain dragging my Calm Index?",
  "What's one small change for a busy Friday service?",
] as const;

const STORAGE_KEY = "vbd-advisor-chat";

function loadStoredMessages(venueId: string): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(`${STORAGE_KEY}:${venueId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMessages(venueId: string, messages: ChatMessage[]): void {
  try {
    sessionStorage.setItem(`${STORAGE_KEY}:${venueId}`, JSON.stringify(messages));
  } catch {
    // sessionStorage may be unavailable
  }
}

export function VenueAdvisorPanel({
  venueId,
  venueName,
  showDiscoveryHint = false,
}: {
  venueId: string;
  venueName: string;
  showDiscoveryHint?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMessages(loadStoredMessages(venueId));
  }, [venueId]);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setError(null);
      const userMessage: ChatMessage = { role: "user", content: trimmed };
      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      saveMessages(venueId, nextMessages);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ venueId, messages: nextMessages }),
        });

        const data = (await res.json()) as { message?: string; error?: string };

        if (!res.ok) {
          throw new Error(data.error ?? "Something went wrong");
        }

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: data.message ?? "",
        };
        const withReply = [...nextMessages, assistantMessage];
        setMessages(withReply);
        saveMessages(venueId, withReply);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to send message");
        setMessages(messages);
        saveMessages(venueId, messages);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, venueId]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(input);
    }
  }

  return (
    <>
      <AskIntroHint visible={showDiscoveryHint && !open} onTry={() => setOpen(true)} />

      {!open && (
        <Button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open venue advisor chat"
          className="fixed bottom-5 right-5 z-50 h-12 gap-2 rounded-full px-5 shadow-lg sm:bottom-6 sm:right-6"
        >
          <MessageCircle className="size-5" aria-hidden />
          Ask
        </Button>
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Venue advisor chat"
        aria-hidden={!open}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border bg-card shadow-2xl transition-transform duration-300 ease-out sm:w-[400px]",
          open ? "translate-x-0" : "pointer-events-none translate-x-full"
        )}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Venue advisor
            </p>
            <h2 className="font-serif text-lg text-foreground">{venueName}</h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            aria-label="Close venue advisor chat"
          >
            <X className="size-4" />
          </Button>
        </header>

        <div
          ref={listRef}
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4"
          aria-live="polite"
        >
          {messages.length === 0 && !loading && (
            <div className="space-y-4">
              <div>
                <p className="font-serif text-base text-foreground">Ask your venue advisor</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Get plain-language help with your weekly focus, domain scores, and calm operations.
                  Answers use your venue scores and the Calm Venue method.
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  Try asking
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {STARTER_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => void sendMessage(q)}
                      className="cursor-pointer rounded-full border border-border bg-background px-3 py-1.5 text-left text-xs leading-snug text-foreground transition-colors hover:border-primary/50 hover:text-primary"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={`${msg.role}-${i}`}
              className={cn(
                "max-w-[90%] rounded-lg px-3 py-2 text-sm leading-relaxed",
                msg.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "mr-auto border border-border bg-background text-foreground"
              )}
            >
              {msg.content}
            </div>
          ))}

          {loading && (
            <div
              className="mr-auto max-w-[90%] rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted-foreground"
              aria-busy="true"
            >
              Thinking…
            </div>
          )}
        </div>

        {error && (
          <p className="shrink-0 px-4 pb-2 text-xs text-destructive" role="alert">
            {error}
          </p>
        )}

        <footer className="shrink-0 border-t border-border p-4">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your venue…"
              rows={2}
              disabled={loading}
              aria-label="Chat message"
              className="min-h-[44px] flex-1 resize-none rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
            />
            <Button
              type="button"
              size="icon"
              onClick={() => void sendMessage(input)}
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              <Send className="size-4" />
            </Button>
          </div>
        </footer>
      </div>

      {open && (
        <button
          type="button"
          aria-label="Close chat overlay"
          className="fixed inset-0 z-40 bg-black/40 sm:bg-black/20"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
