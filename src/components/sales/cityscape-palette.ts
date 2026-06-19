/**
 * Illustration-only palette for cityscape line art.
 * Intentionally separate from UI tokens (--champagne, --rose, --plum).
 */
import type { CSSProperties } from "react";

export const CITYSCAPE_COLORS = {
  sepiaLight: "#8B7355",
  sepiaDark: "#6B5344",
  sky: "#7BA3B8",
  sage: "#7A9B76",
  terracotta: "#C4785A",
  ochre: "#D4A84B",
  slate: "#5C6B7A",
  ink: "#3D3530",
  cream: "#F5F0E8",
  coral: "#E8A598",
} as const;

/** CSS custom properties for scoping illustration colors to a wrapper */
export const CITYSCAPE_CSS_VARS = {
  "--scape-sepia-light": CITYSCAPE_COLORS.sepiaLight,
  "--scape-sepia-dark": CITYSCAPE_COLORS.sepiaDark,
  "--scape-sky": CITYSCAPE_COLORS.sky,
  "--scape-sage": CITYSCAPE_COLORS.sage,
  "--scape-terracotta": CITYSCAPE_COLORS.terracotta,
  "--scape-ochre": CITYSCAPE_COLORS.ochre,
  "--scape-slate": CITYSCAPE_COLORS.slate,
  "--scape-ink": CITYSCAPE_COLORS.ink,
  "--scape-cream": CITYSCAPE_COLORS.cream,
  "--scape-coral": CITYSCAPE_COLORS.coral,
} as CSSProperties;

export type CityscapePalette = typeof CITYSCAPE_COLORS;
