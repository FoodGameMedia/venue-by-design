import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PublicHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="flex min-h-[56px] w-full items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="cursor-pointer font-serif text-lg text-foreground">
          Venue by Design
        </Link>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href="/advisor"
            className="cursor-pointer text-xs text-muted-foreground transition-colors duration-200 hover:text-primary sm:text-sm"
          >
            Advisor Portal
          </Link>
          <Link href="/login" className="cursor-pointer">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
              Sign in
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
