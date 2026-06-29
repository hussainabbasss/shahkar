import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Testimonial } from "@/lib/types";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={i < rating ? "text-accent" : "text-border"}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <blockquote className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <StarRating rating={testimonial.rating} />
      <p className="mt-4 text-base leading-relaxed text-body">
        &ldquo;{testimonial.text}&rdquo;
      </p>
      <footer className="mt-4 text-sm font-semibold text-heading">
        — {testimonial.name}, {testimonial.city}
      </footer>
    </blockquote>
  );
}

type TrustSectionProps = {
  testimonials: Testimonial[];
};

export function TrustSection({ testimonials }: TrustSectionProps) {
  return (
    <section className="bg-background px-4 py-12 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl text-center">
        <SectionHeading className="mb-2">10,000+ Khush Customers</SectionHeading>
        <p className="mb-10 text-base text-muted">
          Pakistan bhar se customers ka bharosa
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
