const BADGES = [
  { icon: "📦", label: "Cash on Delivery" },
  { icon: "🚚", label: "2–3 Din Delivery" },
  { icon: "🔄", label: "Easy Returns" },
  { icon: "✅", label: "100% Genuine" },
] as const;

export function TrustBadges({ compact = false }: { compact?: boolean }) {
  return (
    <ul
      className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"} w-full`}
      aria-label="Trust badges"
    >
      {BADGES.map((badge) => (
        <li
          key={badge.label}
          className="flex items-center gap-1.5 rounded-lg bg-primary-light px-3.5 py-2.5 text-[13px] font-semibold text-body"
        >
          <span className="text-xl leading-none" aria-hidden="true">
            {badge.icon}
          </span>
          <span>{badge.label}</span>
        </li>
      ))}
    </ul>
  );
}
