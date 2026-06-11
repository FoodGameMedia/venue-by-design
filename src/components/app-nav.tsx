import Link from "next/link";
import { Button } from "@/components/ui/button";

const DESTINATIONS = [
  { href: "/dashboard", label: "This Week" },
  { href: "/score", label: "Score" },
  { href: "/domains", label: "Domains" },
  { href: "/my-plan", label: "My Plan" },
] as const;

export function AppNav({ title = "Venue by Design" }: { title?: string }) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card">
      <div className="flex min-h-[56px] w-full flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link href="/dashboard" className="font-serif text-lg text-foreground">
          {title}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {DESTINATIONS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex h-8 cursor-pointer items-center justify-center border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition-colors duration-200 hover:border-primary/50 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <form action="/api/billing/portal" method="post">
            <Button type="submit" variant="outline" size="sm" className="text-xs">
              Billing &amp; plans
            </Button>
          </form>
          <form action="/api/auth/signout" method="post">
            <Button type="submit" variant="ghost" size="sm" className="text-xs">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
