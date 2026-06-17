export interface VenueChangeProgress {
  prescriptionKey: string;
  activeIndex: number;
}

export interface VenueMetadata {
  changeProgress?: VenueChangeProgress;
  [key: string]: unknown;
}

export function getActiveChangeIndex(
  metadata: unknown,
  prescriptionKey: string | null | undefined
): number {
  if (!prescriptionKey) return 0;
  const meta = (metadata ?? {}) as VenueMetadata;
  if (meta.changeProgress?.prescriptionKey === prescriptionKey) {
    return Math.max(0, meta.changeProgress.activeIndex ?? 0);
  }
  return 0;
}

export function advanceChangeIndex(
  metadata: unknown,
  prescriptionKey: string,
  currentIndex: number,
  maxIndex: number
): VenueMetadata {
  const base = (metadata && typeof metadata === "object" ? metadata : {}) as VenueMetadata;
  const nextIndex = Math.min(currentIndex + 1, maxIndex);
  return {
    ...base,
    changeProgress: {
      prescriptionKey,
      activeIndex: nextIndex,
    },
  };
}
