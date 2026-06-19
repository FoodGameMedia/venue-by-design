"use client";

import { useEffect, useRef, useState } from "react";
import {
  CityscapeDividerStrip,
  CityscapeFarLayer,
  CityscapeMidLayer,
  CityscapeNearLayer,
} from "@/components/sales/cityscape-line-art";

type HeroCityscapeBgProps = {
  /** "hero" fills the hero section; "faint" bleeds into sections below at lower opacity */
  variant?: "hero" | "faint";
  testId?: string;
};

export function HeroCityscapeBg({ variant = "hero", testId }: HeroCityscapeBgProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    if (variant !== "hero") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const onScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scrollProgress = Math.max(0, -rect.top / (rect.height || 1));
      setOffsetY(scrollProgress * 24);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [variant]);

  const isHero = variant === "hero";

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      data-testid={testId}
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{
        maskImage: isHero
          ? "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)"
          : "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
        WebkitMaskImage: isHero
          ? "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)"
          : "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
      }}
    >
      {/* Far skyline — champagne tint, 8% */}
      <div
        className="absolute inset-x-0 top-0 h-[55%] text-[var(--champagne)] opacity-[0.08] max-sm:h-[45%] max-sm:opacity-[0.06]"
        style={{ transform: isHero ? `translateY(${offsetY * 0.15}px)` : undefined }}
      >
        <CityscapeFarLayer className="h-full w-full" />
      </div>

      {/* Mid street — dusty rose, 12% hero / 6% faint */}
      <div
        className={`absolute inset-x-[-5%] bottom-0 h-[70%] w-[110%] text-[var(--rose)] max-sm:inset-x-0 max-sm:w-full max-sm:h-[55%] ${
          isHero ? "opacity-[0.12] max-sm:opacity-[0.09]" : "opacity-[0.06]"
        }`}
        style={{ transform: isHero ? `translateY(${offsetY * 0.35}px)` : undefined }}
      >
        <CityscapeMidLayer className="h-full w-full" />
      </div>

      {/* Foreground corner — champagne, 15% hero / 7% faint */}
      <div
        className={`absolute -bottom-4 -left-[8%] h-[75%] w-[70%] text-[var(--champagne)] max-sm:-left-[15%] max-sm:w-[90%] max-sm:h-[60%] ${
          isHero ? "opacity-[0.15] max-sm:opacity-[0.11]" : "opacity-[0.07]"
        }`}
        style={{ transform: isHero ? `translateY(${offsetY * 0.5}px)` : undefined }}
      >
        <CityscapeNearLayer className="h-full w-full" />
      </div>

      {/* Right-side accent slice — rose at low opacity for balance */}
      <div
        className={`absolute -right-[12%] bottom-0 top-[30%] hidden w-[55%] text-[var(--rose)] sm:block ${
          isHero ? "opacity-[0.09]" : "opacity-[0.05]"
        }`}
        style={{ transform: isHero ? `translateY(${offsetY * 0.25}px) scaleX(-1)` : "scaleX(-1)" }}
      >
        <CityscapeNearLayer className="h-full w-full" />
      </div>
    </div>
  );
}

type SectionCityscapeDividerProps = {
  testId?: string;
};

/** Subtle line-art strip between sections */
export function SectionCityscapeDivider({ testId }: SectionCityscapeDividerProps) {
  return (
    <div
      aria-hidden="true"
      data-testid={testId}
      className="pointer-events-none relative h-8 w-full overflow-hidden opacity-[0.07] text-[var(--champagne)]"
    >
      <CityscapeDividerStrip className="absolute inset-0 h-full w-full" />
    </div>
  );
}
