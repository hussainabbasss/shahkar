import { ProductCard } from "@/components/products/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Product, Sale } from "@/lib/types";

type FeaturedProductsSectionProps = {
  products: Product[];
  activeSale: Sale | null;
};

export function FeaturedProductsSection({
  products,
  activeSale,
}: FeaturedProductsSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className="bg-surface px-4 py-12 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeading className="mb-8 md:mb-10">
          Hamare Behtareen Products
        </SectionHeading>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              activeSale={activeSale}
              priority={index < 2}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
