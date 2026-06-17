export interface SalesTestimonial {
  quote: string;
  name: string;
  role?: string;
  venue?: string;
}

/** Founder-supplied quotes only. Leave empty until real testimonials exist. */
export const SALES_TESTIMONIALS: SalesTestimonial[] = [];

export function hasSocialProof(): boolean {
  return SALES_TESTIMONIALS.length > 0;
}
