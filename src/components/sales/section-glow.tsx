type GlowVariant = "hero" | "quiet-advantage";

const GLOW_STYLES: Record<GlowVariant, string> = {
  hero: "bg-[radial-gradient(closest-side,rgba(214,150,169,0.40),rgba(214,150,169,0))] right-[-40px] top-[-40px] h-[340px] w-[340px]",
  "quiet-advantage":
    "bg-[radial-gradient(closest-side,rgba(139,58,82,0.50),rgba(139,58,82,0))] bottom-[-40px] left-[-40px] h-[360px] w-[360px]",
};

export function SectionGlow({
  variant,
  testId,
}: {
  variant: GlowVariant;
  testId?: string;
}) {
  return (
    <div
      aria-hidden="true"
      data-testid={testId}
      className={`pointer-events-none absolute -z-10 ${GLOW_STYLES[variant]}`}
    />
  );
}
