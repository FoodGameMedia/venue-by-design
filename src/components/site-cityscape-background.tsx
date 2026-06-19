"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CityscapePanorama } from "@/components/sales/cityscape-line-art";

type Intensity = "public" | "app";

const INTENSITY: Record<
  Intensity,
  { line: number; fill: number; layer: number; scrim: number }
> = {
  public: { line: 0.4, fill: 0.26, layer: 1, scrim: 0.48 },
  app: { line: 0.34, fill: 0.2, layer: 0.92, scrim: 0.55 },
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
    >
      {/* Charcoal base — sits above body bg, below art */}
      <div className="absolute inset-0 bg-[var(--charcoal)]" />

      {/* Panoramic street scene — anchored bottom, bleeds to sides */}
      <div
        className="absolute inset-x-[-12%] bottom-0 top-[8%] sm:inset-x-[-8%] sm:top-[5%]"
        style={{
          opacity: tokens.layer,
          transform: `translateY(${offsetY}px)`,
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%), radial-gradient(ellipse 90% 85% at 50% 65%, black 30%, transparent 78%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%), radial-gradient(ellipse 90% 85% at 50% 65%, black 30%, transparent 78%)",
          WebkitMaskComposite: "source-in",
          maskComposite: "intersect",
        }}
      >
        <CityscapePanorama
          className="h-full w-full"
          lineOpacity={tokens.line}
          fillOpacity={tokens.fill}
        />
      </div>

      {/* Mirrored right slice for balance on wide screens */}
      <div
        className="absolute -right-[6%] bottom-0 top-[22%] hidden w-[48%] lg:block"
        style={{
          opacity: tokens.layer * 0.72,
          transform: `translateY(${offsetY * 0.6}px) scaleX(-1)`,
          WebkitMaskImage: "linear-gradient(to left, black 40%, transparent 100%)",
          maskImage: "linear-gradient(to left, black 40%, transparent 100%)",
        }}
      >
        <CityscapePanorama
          className="h-full w-full"
          lineOpacity={tokens.line * 0.85}
          fillOpacity={tokens.fill * 0.85}
        />
      </div>

      {/* Center readability scrim — darker mid-column, art visible at edges */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 58% 72% at 50% 42%, rgba(42, 42, 40, ${tokens.scrim}) 0%, rgba(42, 42, 40, ${tokens.scrim * 0.55}) 42%, transparent 72%)`,
        }}
      />

      {/* Top fade for nav / headers */}
      <div
        className="absolute inset-x-0 top-0 h-[18%] min-h-[72px]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(42, 42, 40, 0.92) 0%, rgba(42, 42, 40, 0.45) 55%, transparent 100%)",
        }}
      />

      {/* Bottom edge soften */}
      <div
        className="absolute inset-x-0 bottom-0 h-[12%]"
        style={{
          background:
            "linear-gradient(to top, rgba(42, 42, 40, 0.75) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
