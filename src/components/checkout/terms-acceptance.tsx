"use client";

import Link from "next/link";
import { Label } from "@/components/ui/label";

export function TermsAcceptance({
  checked,
  onChange,
  id = "accept-terms",
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}) {
  return (
    <div
      className="mx-auto max-w-2xl rounded-xl border border-border/70 bg-card/80 p-4 ring-1 ring-foreground/5"
      data-testid="checkout-terms-acceptance"
    >
      <Label
        htmlFor={id}
        className="cursor-pointer items-start gap-3 font-normal leading-relaxed text-muted-foreground"
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-border accent-[#C9A87C]"
          data-testid="checkout-terms-checkbox"
        />
        <span>
          I agree to the{" "}
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#C9A87C] underline-offset-2 hover:underline"
          >
            Terms &amp; Conditions
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#C9A87C] underline-offset-2 hover:underline"
          >
            Privacy Policy
          </Link>
          , and I understand that Venue by Design uses AI to generate diagnostic insights,
          prescriptions, and chat responses that are informational only and not professional advice.
        </span>
      </Label>
    </div>
  );
}
