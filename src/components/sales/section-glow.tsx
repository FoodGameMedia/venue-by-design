type GlowVariant = "hero" | "quiet-advantage";

const GLOW_STYLES: Record<GlowVariant, string> = {
  hero: "bg-[radial-gradient(closest-side,rgba(214,150,169,0.22),rgba(214,150,169,0))] right-[-60px] top-[-60px] h-[420px] w-[420px] blur-2xl",
  "quiet-advantage":
    "bg-[radial-gradient(closest-side,rgba(139,58,82,0.18),rgba(139,58,82,0))] bottom-[-60px] left-[-60px] h-[400px] w-[400px] blur-2xl",
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
