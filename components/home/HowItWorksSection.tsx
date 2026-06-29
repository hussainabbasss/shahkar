import { SectionHeading } from "@/components/ui/SectionHeading";

const STEPS = [
  {
    icon: "🛍️",
    title: "Product Chunein",
    description: "Browse karein aur cart mein daalein",
  },
  {
    icon: "📝",
    title: "Order Karein",
    description: "Apni details bharein, COD select karein",
  },
  {
    icon: "📦",
    title: "Ghar Bethay Pao",
    description: "2–3 din mein delivery — ghar pe",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section className="bg-primary-light px-4 py-12 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeading className="mb-8 text-center md:mb-12">
          Kaise Kaam Karta Hai?
        </SectionHeading>
        <ol className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="flex flex-col items-center rounded-2xl bg-surface p-6 text-center shadow-sm"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                {index + 1}
              </span>
              <span className="mt-4 text-3xl" aria-hidden="true">
                {step.icon}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-heading">
                {step.title}
              </h3>
              <p className="mt-2 text-base text-body">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
