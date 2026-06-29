import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { getProductBySlug } from "@/lib/data/products";
import { getActiveSale } from "@/lib/data/sales";
import { productToCheckoutItem } from "@/lib/checkout/product-to-line-item";

type Props = {
  searchParams: Promise<{ buy?: string; coupon?: string }>;
};

export default async function CheckoutPage({ searchParams }: Props) {
  const { buy } = await searchParams;

  let buyNowItem = null;

  if (buy) {
    const [product, activeSale] = await Promise.all([
      getProductBySlug(buy),
      getActiveSale(),
    ]);

    if (!product || product.stock <= 0) {
      redirect(product ? `/products/${product.slug}` : "/#products");
    }

    buyNowItem = productToCheckoutItem(product, activeSale);
  }

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-4 py-12">
          <p className="text-body">Loading...</p>
        </div>
      }
    >
      <CheckoutForm buyNowItem={buyNowItem} />
    </Suspense>
  );
}
