"use client";

import Link from "next/link";
import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

type AlertBannerProps = {
  count: number;
  products: { id: string; name: string; stock: number }[];
};

export function AlertBanner({ count, products }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || count === 0) return null;

  return (
    <div
      className="relative overflow-hidden rounded-xl border-l-4 p-4 pr-10"
      style={{
        borderLeftColor: "var(--admin-warning)",
        background: "var(--admin-accent-muted)",
        borderTop: "1px solid var(--admin-border)",
        borderRight: "1px solid var(--admin-border)",
        borderBottom: "1px solid var(--admin-border)",
      }}
    >
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 rounded p-1 opacity-60 hover:opacity-100"
        aria-label="Dismiss alert"
      >
        <X size={16} />
      </button>
      <div className="flex gap-3">
        <AlertTriangle
          size={20}
          className="mt-0.5 shrink-0"
          style={{ color: "var(--admin-warning)" }}
        />
        <div>
          <h3
            className="font-semibold"
            style={{ color: "var(--admin-text-heading)" }}
          >
            Low stock — {count} product{count !== 1 ? "s" : ""} need restocking
          </h3>
          <ul className="mt-2 space-y-1 text-sm">
            {products.slice(0, 3).map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/products/${p.id}/edit`}
                  className="hover:underline"
                  style={{ color: "var(--admin-accent)" }}
                >
                  {p.name} — {p.stock} left
                </Link>
              </li>
            ))}
            {products.length > 3 && (
              <li style={{ color: "var(--admin-text-muted)" }}>
                +{products.length - 3} more
              </li>
            )}
          </ul>
          <Link
            href="/admin/products"
            className="mt-3 inline-block text-sm font-semibold hover:underline"
            style={{ color: "var(--admin-primary-text)" }}
          >
            Review inventory →
          </Link>
        </div>
      </div>
    </div>
  );
}
