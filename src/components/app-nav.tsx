"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DESTINATIONS = [
  { href: "/dashboard", label: "This Week" },
  { href: "/score", label: "Score" },
  { href: "/domains", label: "Domains" },
  { href: "/systems", label: "Systems" },
  { href: "/my-plan", label: "My Plan" },
] as const;

function submitPostForm(action: string) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  document.body.appendChild(form);
  form.submit();
}

export function AppNav({ title = "Venue by Design" }: { title?: string }) {
  const pathname = usePathname();
  const [billingLoading, setBillingLoading] = useState(false);

  async function openBillingPortal() {
    setBillingLoading(true);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
        redirect: "manual",
        credentials: "same-origin",
      });
      const location = res.headers.get("Location");
      if (location) {
        window.location.assign(location);
        return;
      }
      if (res.status === 401) {
        window.location.assign(`/login?redirectTo=${encodeURIComponent(pathname)}`);
        return;
      }
      if (!res.ok) {
        window.location.assign("/pricing");
      }
    } finally {
      setBillingLoading(false);
    }
  }

  return (
    <header className="vbd-header-bar sticky top-0 z-10">
      <div className="flex min-h-[56px] w-full flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link href="/dashboard" className="font-serif text-lg text-foreground">
          {title}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {DESTINATIONS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex h-8 cursor-pointer items-center justify-center rounded-md border border-border/80 bg-background px-3 text-xs font-medium text-muted-foreground shadow-[var(--card-shadow)] transition-all duration-200 hover:-translate-y-px hover:border-primary/40 hover:text-foreground hover:shadow-[var(--card-shadow-hover)]",
                  isActive && "vbd-nav-active"
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            disabled={billingLoading}
            onClick={() => void openBillingPortal()}
          >
            {billingLoading ? "Opening…" : "Billing & plans"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => submitPostForm("/api/auth/signout")}
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}
