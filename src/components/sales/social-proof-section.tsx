import { SALES_TESTIMONIALS, hasSocialProof } from "@/lib/sales-social-proof";

export function SocialProofSection() {
  if (!hasSocialProof()) return null;

  return (
    <section
      className="vbd-section-divider px-4 py-20 sm:px-6 lg:px-8"
      data-testid="sales-social-proof"
    >
      <div className="vbd-prescription-card p-6 sm:p-8">
      <p className="vbd-section-label">
        Operators like you
      </p>
      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {SALES_TESTIMONIALS.map((item) => (
          <blockquote key={`${item.name}-${item.quote.slice(0, 24)}`} className="vbd-elevated-card bg-background p-5">
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
