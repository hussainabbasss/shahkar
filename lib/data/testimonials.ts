import { SEED_TESTIMONIALS } from "@/lib/data/seed-testimonials";
import type { Testimonial } from "@/lib/types";

/** Server-side fetch — Module 03 replaces with admin-managed data */
export async function getTestimonials(): Promise<Testimonial[]> {
  return SEED_TESTIMONIALS;
}
