import Link from "next/link";
import { LEGAL_CONTACT_EMAIL } from "@/lib/legal";

export function PublicFooter() {
  return (
    <footer className="vbd-section-divider border-t border-border/60 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-serif text-sm text-muted-foreground">
          © {new Date().getFullYear()} Venue by Design
        </p>
        <nav
          className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
          aria-label="Legal"
        >
          <Link
            href="/terms"
            className="cursor-pointer transition-colors duration-200 hover:text-[#C9A87C]"
          >
            Terms &amp; Conditions
          </Link>
          <Link
            href="/privacy"
            className="cursor-pointer transition-colors duration-200 hover:text-[#C9A87C]"
          >
            Privacy Policy
          </Link>
          <a
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className="cursor-pointer transition-colors duration-200 hover:text-[#C9A87C]"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
