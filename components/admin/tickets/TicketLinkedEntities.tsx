import Image from "next/image";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/AdminUI";
import { formatPrice } from "@/lib/pricing";
import type {
  LinkedOrderSummary,
  LinkedProductSummary,
} from "@/lib/db/admin/tickets";

type TicketLinkedEntitiesProps = {
  linkedOrder: LinkedOrderSummary | null;
  linkedProduct: LinkedProductSummary | null;
};

export function TicketLinkedEntities({
  linkedOrder,
  linkedProduct,
}: TicketLinkedEntitiesProps) {
  if (!linkedOrder && !linkedProduct) return null;

  return (
    <section
      className="space-y-4 rounded-xl p-5"
      style={{
        background: "var(--admin-surface)",
        border: "1px solid var(--admin-border)",
      }}
    >
      <h2
        className="text-sm font-bold"
        style={{ color: "var(--admin-text-heading)" }}
      >
        Linked records
      </h2>

      {linkedOrder && (
        <div
          className="rounded-lg p-4"
          style={{ border: "1px solid var(--admin-border)" }}
        >
          <p
            className="text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: "var(--admin-text-subtle)" }}
          >
            Order & customer
          </p>
          <Link
            href={`/admin/orders/${linkedOrder.orderNumber}`}
            className="mt-2 block text-sm font-bold"
            style={{ color: "var(--admin-primary)" }}
          >
            {linkedOrder.orderNumber}
          </Link>
          <p className="mt-1 text-sm font-medium">{linkedOrder.customerName}</p>
          <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
            {linkedOrder.customerPhone}
          </p>
          <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
            {linkedOrder.city}
          </p>
          <p
            className="mt-2 text-sm font-semibold"
            style={{ color: "var(--admin-primary)" }}
          >
            {formatPrice(linkedOrder.total)}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <StatusBadge status={linkedOrder.status} variant="order" />
            <span
              className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
              style={{
                background:
                  "color-mix(in srgb, var(--admin-text-muted) 12%, transparent)",
                color: "var(--admin-text-muted)",
              }}
            >
              {linkedOrder.source === "manual" ? "Manual" : "Website"}
            </span>
          </div>
        </div>
      )}

      {linkedProduct && (
        <div
          className="rounded-lg p-4"
          style={{ border: "1px solid var(--admin-border)" }}
        >
          <p
            className="text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: "var(--admin-text-subtle)" }}
          >
            Product
          </p>
          <div className="mt-2 flex gap-3">
            {linkedProduct.image ? (
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={linkedProduct.image}
                  alt={linkedProduct.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
            ) : null}
            <div>
              <Link
                href={`/admin/products/${linkedProduct.id}/edit`}
                className="text-sm font-bold"
                style={{ color: "var(--admin-primary)" }}
              >
                {linkedProduct.name}
              </Link>
              <p
                className="mt-1 text-sm"
                style={{ color: "var(--admin-text-muted)" }}
              >
                Stock: {linkedProduct.stock} units
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
