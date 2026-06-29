type ProductDescriptionProps = {
  description: string;
  features: string[];
};

export function ProductDescription({
  description,
  features,
}: ProductDescriptionProps) {
  return (
    <div className="mt-6 space-y-4">
      <p className="text-base leading-relaxed text-body">{description}</p>
      {features.length > 0 && (
        <ul className="space-y-2">
          {features.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2 text-base text-body"
            >
              <span className="mt-1 text-primary" aria-hidden>
                ✓
              </span>
              {feature}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
