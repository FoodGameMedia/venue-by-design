import Link from "next/link";
import { PublicFooter } from "@/components/sales/public-footer";
import { PublicHeader } from "@/components/sales/public-header";
import { LEGAL_LAST_UPDATED } from "@/lib/legal";

export function LegalPageLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen w-full bg-transparent">
      <PublicHeader />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="vbd-section-label">Legal</p>
        <h1 className="mt-3 font-serif text-3xl tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Last updated {LEGAL_LAST_UPDATED}. Australian hospitality operators.
        </p>
        <article className="prose-legal mt-10 space-y-8 text-sm leading-relaxed text-foreground/90">
          {children}
        </article>
        <p className="mt-12 text-sm text-muted-foreground">
          <Link href="/" className="cursor-pointer text-[#C9A87C] hover:underline">
            ← Back to home
          </Link>
        </p>
      </main>
      <PublicFooter />
    </div>
  );
}

function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-serif text-xl text-foreground">{title}</h2>
      <div className="mt-3 space-y-3 text-muted-foreground">{children}</div>
    </section>
  );
}

export { LegalSection };
