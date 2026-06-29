import Image from "next/image";
import { formatPrice } from "@/lib/pricing";
import type { Order } from "@/lib/types";

export function OrderDetailsSummary({ order }: { order: Order }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <h2 className="mb-4 text-lg font-bold text-heading">Order Details</h2>
      <ul className="mb-4 space-y-3 border-b border-border pb-4">
        {order.products.map((item) => (
          <li key={item.product_id} className="flex gap-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={item.image || "/products/placeholder.svg"}
                alt=""
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-heading">
                {item.name}
              </p>
              <p className="text-sm text-muted">
                {item.quantity} × {formatPrice(item.price)}
              </p>
            </div>
            <p className="text-sm font-semibold">
              {formatPrice(item.price * item.quantity)}
            </p>
          </li>
        ))}
      </ul>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatPrice(order.subtotal)}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-success">
            <span>Discount</span>
            <span>−{formatPrice(order.discount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Delivery</span>
          <span>{formatPrice(order.deliveryFee)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
          <span>Total</span>
          <span className="text-primary">{formatPrice(order.total)}</span>
        </div>
      </div>
      <div className="mt-4 space-y-1 text-sm text-body">
        <p>
          <span className="font-semibold">Name:</span> {order.customerName}
        </p>
        <p>
          <span className="font-semibold">Phone:</span> {order.customerPhone}
        </p>
        <p>
          <span className="font-semibold">City:</span> {order.city}
        </p>
        <p>
          <span className="font-semibold">Address:</span> {order.address}
        </p>
      </div>
    </div>
  );
}
