"use client";

type SegmentedControlProps<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = "md",
}: SegmentedControlProps<T>) {
  return (
    <div
      className="inline-flex rounded-lg p-0.5"
      style={{
        background: "color-mix(in srgb, var(--admin-border) 40%, transparent)",
        border: "1px solid var(--admin-border)",
      }}
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`rounded-md font-semibold transition-all duration-150 ${
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs"
            }`}
            style={
              active
                ? {
                    background: "var(--admin-primary)",
                    color: "#fff",
                    boxShadow: "var(--admin-shadow-sm)",
                  }
                : { color: "var(--admin-text-muted)" }
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
