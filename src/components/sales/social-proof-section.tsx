import { SALES_TESTIMONIALS, hasSocialProof } from "@/lib/sales-social-proof";

export function SocialProofSection() {
  if (!hasSocialProof()) return null;

  return (
    <section
      className="border-t border-border px-4 py-16 sm:px-6 lg:px-8"
      data-testid="sales-social-proof"
    >
      <div className="border-l-[3px] border-primary bg-card p-6 sm:p-8">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        Operators like you
      </p>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {SALES_TESTIMONIALS.map((item) => (
          <blockquote key={`${item.name}-${item.quote.slice(0, 24)}`} className="border border-border bg-background p-5">
            <p className="text-sm leading-relaxed text-foreground">&ldquo;{item.quote}&rdquo;</p>
            <footer className="mt-4 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{item.name}</span>
              {item.role ? `, ${item.role}` : ""}
              {item.venue ? ` · ${item.venue}` : ""}
            </footer>
          </blockquote>
        ))}
      </div>
      </div>
    </section>
  );
}
