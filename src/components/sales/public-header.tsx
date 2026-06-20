import Link from "next/link";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

export function PublicHeader() {
  return (
    <header className="vbd-header-bar sticky top-0 z-20">
      <div className="flex min-h-[56px] w-full items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="cursor-pointer font-serif text-lg text-foreground">
          Venue by Design
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
          <Link
            href="/pricing?diagnostic=required"
            className="cursor-pointer text-xs text-muted-foreground transition-colors duration-200 hover:text-[#C9A87C] sm:text-sm"
            data-testid="header-cta-diagnostic"
          >
            <span className="sm:hidden">Diagnostic</span>
            <span className="hidden sm:inline">Book your Deep Diagnostic</span>
          </Link>
          <Link
            href="/pricing"
            className="cursor-pointer text-xs text-muted-foreground transition-colors duration-200 hover:text-[#C9A87C] sm:text-sm"
            data-testid="header-cta-pricing"
          >
            View pricing
          </Link>
          <Link
            href="/advisor"
            className="cursor-pointer text-xs text-muted-foreground transition-colors duration-200 hover:text-[#C9A87C] sm:text-sm"
          >
            Advisor Portal
          </Link>
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "text-xs sm:text-sm")}
          >
            Sign in
          </Link>
        </div>
      </div>
    </header>
  );
}
