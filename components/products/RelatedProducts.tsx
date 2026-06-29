import { ProductCard } from "@/components/products/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { Product, Sale } from "@/lib/types";

type RelatedProductsProps = {
  products: Product[];
  activeSale: Sale | null;
};

export function RelatedProducts({ products, activeSale }: RelatedProductsProps) {
  if (!products.length) return null;

  return (
    <section className="mt-16 border-t border-border pt-12">
      <SectionHeading className="mb-8">Aur Products Dekhein</SectionHeading>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            activeSale={activeSale}
          />
        ))}
      </div>
    </section>
  );
}
