import { SaleCountdown } from "@/components/products/SaleCountdown";
import { formatPrice } from "@/lib/pricing";
import type { ProductDisplayPrice, Sale } from "@/lib/types";

type ProductInfoProps = {
  name: string;
  displayPrice: ProductDisplayPrice;
  activeSale: Sale | null;
};

export function ProductInfo({ name, displayPrice, activeSale }: ProductInfoProps) {
  const { currentPrice, originalPrice, onSale } = displayPrice;

  return (
    <div>
      <h1 className="text-2xl font-bold text-heading md:text-3xl">{name}</h1>
      <div className="mt-4 flex flex-wrap items-baseline gap-3">
        <span className="text-3xl font-bold text-primary">
          {formatPrice(currentPrice)}
        </span>
        {onSale && (
          <>
            <span className="text-lg text-muted line-through">
              {formatPrice(originalPrice)}
            </span>
            <span className="rounded-md bg-accent-light px-2 py-1 text-xs font-bold uppercase text-accent">
              Sale
            </span>
          </>
        )}
      </div>
      {onSale && activeSale && <SaleCountdown endDate={activeSale.endDate} />}
    </div>
  );
}
