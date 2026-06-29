import { SectionHeading } from "@/components/ui/SectionHeading";

const FEATURES = [
  {
    icon: "💡",
    title: "Smart Products",
    description: "Woh cheezein jo ghar ki zindagi aasaan kar dein",
  },
  {
    icon: "💰",
    title: "Sahi Daam",
    description: "Market se sasta, quality mein aala",
  },
  {
    icon: "🏠",
    title: "Ghar Tak",
    description: "COD pe mangwao — pehle dekho phir dena",
  },
] as const;

export function WhyShahkarSection() {
  return (
    <section className="bg-background px-4 py-12 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeading className="mb-8 text-center md:mb-12">
          Kyun Shahkar?
        </SectionHeading>
        <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-border bg-primary-light p-6 text-center md:bg-surface md:text-left"
            >
              <span className="text-3xl" aria-hidden="true">
                {feature.icon}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-heading md:text-2xl">
                {feature.title}
              </h3>
              <p className="mt-2 text-base leading-relaxed text-body">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
