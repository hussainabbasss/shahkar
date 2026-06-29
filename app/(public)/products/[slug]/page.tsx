import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductDescription } from "@/components/products/ProductDescription";
import { ProductGallery } from "@/components/products/ProductGallery";
import { ProductInfo } from "@/components/products/ProductInfo";
import { ProductPageClient } from "@/components/products/ProductPageClient";
import { ProductTrust } from "@/components/products/ProductTrust";
import { RelatedProducts } from "@/components/products/RelatedProducts";
import { getProductWithRelated } from "@/lib/data/products";
import { getActiveSale } from "@/lib/data/sales";
import { computeDisplayPrice } from "@/lib/pricing";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProductWithRelated(slug);
  if (!result) return { title: "Product Not Found" };
  return {
    title: result.product.name,
    description: result.product.description,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [result, activeSale] = await Promise.all([
    getProductWithRelated(slug),
    getActiveSale(),
  ]);

  if (!result) notFound();

  const { product, related } = result;
  const displayPrice = computeDisplayPrice(product, activeSale);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-28 md:px-8 md:pb-12">
      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <ProductGallery
          images={product.images}
          name={product.name}
          onSale={displayPrice.onSale}
        />
        <div>
          <ProductInfo
            name={product.name}
            displayPrice={displayPrice}
            activeSale={activeSale}
          />
          <ProductDescription
            description={product.description}
            features={product.features}
          />
          <ProductTrust />
          <ProductPageClient product={product} activeSale={activeSale} />
          <Link
            href="/#products"
            className="mt-6 inline-block text-sm font-semibold text-primary"
          >
            ← Aur products dekhein
          </Link>
        </div>
      </div>
      <RelatedProducts products={related} activeSale={activeSale} />
    </div>
  );
}
