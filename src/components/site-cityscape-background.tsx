"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CITYSCAPE_CSS_VARS } from "@/components/sales/cityscape-palette";
import { CityscapePanorama } from "@/components/sales/cityscape-line-art";

type Intensity = "public" | "app";

const INTENSITY: Record<
  Intensity,
  { line: number; fill: number; layer: number; vignette: number }
> = {
  public: { line: 0.82, fill: 0.38, layer: 1, vignette: 0.22 },
  app: { line: 0.78, fill: 0.34, layer: 1, vignette: 0.28 },
};

/** Marketing and auth surfaces — slightly stronger illustration */
const PUBLIC_PREFIXES = ["/", "/pricing", "/login"];

function resolveIntensity(pathname: string): Intensity {
  if (pathname === "/" || PUBLIC_PREFIXES.some((p) => p !== "/" && pathname.startsWith(p))) {
    return "public";
  }
  return "app";
}

export function SiteCityscapeBackground() {
  const pathname = usePathname();
  const intensity = resolveIntensity(pathname ?? "/");
  const tokens = INTENSITY[intensity];
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onScroll = () => {
      setOffsetY(Math.min(window.scrollY * 0.08, 48));
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden="true"
      data-testid="site-cityscape-background"
      data-intensity={intensity}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={CITYSCAPE_CSS_VARS}
    >
      <div className="absolute inset-0 bg-[var(--charcoal)]" />

      <div
        className="absolute inset-x-[-10%] bottom-0 top-[4%] sm:inset-x-[-6%] sm:top-[2%]"
        style={{
          opacity: tokens.layer,
          transform: `translateY(${offsetY}px)`,
          mixBlendMode: "normal",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 8%, black 92%, transparent 100%)",
        }}
      >
        <CityscapePanorama
          className="h-full w-full"
          lineOpacity={tokens.line}
          fillOpacity={tokens.fill}
        />
      </div>

      <div
        className="absolute -right-[6%] bottom-0 top-[18%] hidden w-[48%] lg:block"
        style={{
          opacity: tokens.layer * 0.85,
          mixBlendMode: "normal",
          transform: `translateY(${offsetY * 0.6}px) scaleX(-1)`,
          WebkitMaskImage: "linear-gradient(to left, black 50%, transparent 100%)",
          maskImage: "linear-gradient(to left, black 50%, transparent 100%)",
        }}
      >
        <CityscapePanorama
          className="h-full w-full"
          lineOpacity={tokens.line * 0.9}
          fillOpacity={tokens.fill * 0.9}
        />
      </div>

      {/* Edge vignette only — keeps center art visible */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 95% 90% at 50% 50%, transparent 42%, rgba(42, 42, 40, ${tokens.vignette}) 100%)`,
        }}
      />

      <div
        className="absolute inset-x-0 top-0 h-[14%] min-h-[64px]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(42, 42, 40, 0.5) 0%, rgba(42, 42, 40, 0.15) 60%, transparent 100%)",
        }}
      />

      <div
        className="absolute inset-x-0 bottom-0 h-[10%]"
        style={{
          background:
            "linear-gradient(to top, rgba(42, 42, 40, 0.4) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
