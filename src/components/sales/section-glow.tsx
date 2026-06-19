type GlowVariant = "hero" | "quiet-advantage" | "champagne";

const GLOW_STYLES: Record<GlowVariant, string> = {
  hero: "bg-[radial-gradient(closest-side,rgba(201,168,124,0.28),rgba(214,150,169,0.12),rgba(201,168,124,0))] right-[-80px] top-[-80px] h-[480px] w-[480px] blur-3xl",
  "quiet-advantage":
    "bg-[radial-gradient(closest-side,rgba(139,58,82,0.22),rgba(201,168,124,0.08),rgba(139,58,82,0))] bottom-[-60px] left-[-60px] h-[420px] w-[420px] blur-2xl",
  champagne:
    "bg-[radial-gradient(closest-side,rgba(201,168,124,0.24),rgba(201,168,124,0))] right-[-40px] top-[20%] h-[360px] w-[360px] blur-2xl",
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
