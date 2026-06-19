"use client";

import { useEffect, useRef, useState } from "react";
import { CITYSCAPE_CSS_VARS } from "@/components/sales/cityscape-palette";
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
        ...CITYSCAPE_CSS_VARS,
        maskImage: isHero
          ? "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)"
          : "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
        WebkitMaskImage: isHero
          ? "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)"
          : "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
      }}
    >
      <div
        className={`absolute inset-x-0 top-0 h-[55%] max-sm:h-[45%] ${
          isHero ? "opacity-[0.38] max-sm:opacity-[0.3]" : "opacity-[0.22]"
        }`}
        style={{
          mixBlendMode: "normal",
          transform: isHero ? `translateY(${offsetY * 0.15}px)` : undefined,
        }}
      >
        <CityscapeFarLayer className="h-full w-full" />
      </div>

      <div
        className={`absolute inset-x-[-5%] bottom-0 h-[70%] w-[110%] max-sm:inset-x-0 max-sm:h-[55%] max-sm:w-full ${
          isHero ? "opacity-[0.72] max-sm:opacity-[0.62]" : "opacity-[0.38]"
        }`}
        style={{
          mixBlendMode: "normal",
          transform: isHero ? `translateY(${offsetY * 0.35}px)` : undefined,
        }}
      >
        <CityscapeMidLayer className="h-full w-full" />
      </div>

      <div
        className={`absolute -bottom-4 -left-[8%] h-[75%] w-[70%] max-sm:-left-[15%] max-sm:h-[60%] max-sm:w-[90%] ${
          isHero ? "opacity-[0.78] max-sm:opacity-[0.68]" : "opacity-[0.42]"
        }`}
        style={{
          mixBlendMode: "normal",
          transform: isHero ? `translateY(${offsetY * 0.5}px)` : undefined,
        }}
      >
        <CityscapeNearLayer className="h-full w-full" />
      </div>

      <div
        className={`absolute -right-[12%] bottom-0 top-[30%] hidden w-[55%] sm:block ${
          isHero ? "opacity-[0.55]" : "opacity-[0.28]"
        }`}
        style={{
          mixBlendMode: "normal",
          transform: isHero ? `translateY(${offsetY * 0.25}px) scaleX(-1)` : "scaleX(-1)",
        }}
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
      className="pointer-events-none relative h-8 w-full overflow-hidden opacity-[0.45]"
      style={{ ...CITYSCAPE_CSS_VARS, mixBlendMode: "normal" }}
    >
      <CityscapeDividerStrip className="absolute inset-0 h-full w-full" />
    </div>
  );
}
