import { formatPrice } from "@/lib/pricing";
import { DELIVERY_FEE } from "@/lib/constants";

type OrderSummaryProps = {
  subtotal: number;
  discount: number;
  deliveryFee?: number;
};

export function OrderSummary({
  subtotal,
  discount,
  deliveryFee = DELIVERY_FEE,
}: OrderSummaryProps) {
  const total = subtotal - discount + deliveryFee;

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-primary-light p-6">
      <div className="flex justify-between text-base">
        <span className="text-body">Subtotal</span>
        <span className="font-semibold text-heading">
          {formatPrice(subtotal)}
        </span>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-base text-success">
          <span>Discount</span>
          <span className="font-semibold">−{formatPrice(discount)}</span>
        </div>
      )}
      <div className="flex justify-between text-base">
        <span className="text-body">Delivery</span>
        <span className="font-semibold text-heading">
          {formatPrice(deliveryFee)}
        </span>
      </div>
      <div className="flex justify-between border-t border-border pt-3 text-lg font-bold text-heading">
        <span>Total</span>
        <span className="text-primary">{formatPrice(total)}</span>
      </div>
    </div>
  );
}

export function getOrderTotal(
  subtotal: number,
  discount: number,
  deliveryFee = DELIVERY_FEE,
): number {
  return subtotal - discount + deliveryFee;
}
