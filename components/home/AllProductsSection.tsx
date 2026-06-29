"use client";

import { useCallback, useMemo, useState } from "react";
import { ProductCard } from "@/components/products/ProductCard";
import { PrimaryButton } from "@/components/ui/buttons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PRODUCTS_PER_PAGE } from "@/lib/constants";
import type { Product, ProductSortOption, Sale } from "@/lib/types";

const SORT_OPTIONS: { value: ProductSortOption; label: string }[] = [
  { value: "new", label: "New" },
  { value: "price-asc", label: "Price L–H" },
  { value: "price-desc", label: "Price H–L" },
  { value: "popular", label: "Popular" },
];

type AllProductsSectionProps = {
  initialProducts: Product[];
  total: number;
  categories: string[];
  activeSale: Sale | null;
};

function sortProducts(products: Product[], sort: ProductSortOption): Product[] {
  const sorted = [...products];
  switch (sort) {
    case "price-asc":
      return sorted.sort(
        (a, b) => (a.salePrice ?? a.originalPrice) - (b.salePrice ?? b.originalPrice),
      );
    case "price-desc":
      return sorted.sort(
        (a, b) => (b.salePrice ?? b.originalPrice) - (a.salePrice ?? a.originalPrice),
      );
    case "popular":
      return sorted.sort((a, b) => b.popularScore - a.popularScore);
    case "new":
    default:
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }
}

export function AllProductsSection({
  initialProducts,
  total,
  categories,
  activeSale,
}: AllProductsSectionProps) {
  const [sort, setSort] = useState<ProductSortOption>("new");
  const [category, setCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = initialProducts;
    if (category) list = list.filter((p) => p.category === category);
    return sortProducts(list, sort);
  }, [initialProducts, category, sort]);

  const visible = filtered.slice(0, page * PRODUCTS_PER_PAGE);
  const hasMore = visible.length < filtered.length;

  const handleLoadMore = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  return (
    <section id="products" className="scroll-mt-20 bg-background px-4 py-12 md:px-8 md:py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeading className="mb-6 md:mb-8">Tamam Products</SectionHeading>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          {categories.length > 1 && (
            <>
              <button
                type="button"
                className="min-h-[52px] rounded-[10px] border border-border bg-surface px-4 text-sm font-semibold md:hidden"
                onClick={() => setFilterOpen(true)}
              >
                Category Filter
              </button>

              <div className="hidden flex-wrap gap-2 md:flex">
                <FilterChip
                  active={category === null}
                  onClick={() => setCategory(null)}
                  label="Sab"
                />
                {categories.map((cat) => (
                  <FilterChip
                    key={cat}
                    active={category === cat}
                    onClick={() => {
                      setCategory(cat);
                      setPage(1);
                    }}
                    label={cat}
                  />
                ))}
              </div>
            </>
          )}

          <label className="ml-auto flex items-center gap-2">
            <span className="text-sm font-semibold text-body">Sort:</span>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as ProductSortOption);
                setPage(1);
              }}
              className="min-h-[52px] rounded-[10px] border border-border bg-surface px-3 text-sm font-semibold text-body focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {visible.length === 0 ? (
          <p className="py-12 text-center text-base text-muted">
            Is category mein abhi koi product nahi hai.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {visible.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                activeSale={activeSale}
              />
            ))}
          </div>
        )}

        {hasMore && (
          <div className="mt-10 flex justify-center">
            <PrimaryButton onClick={handleLoadMore} className="max-w-xs">
              Aur Products Dekho
            </PrimaryButton>
          </div>
        )}

        <p className="mt-4 text-center text-sm text-muted">
          {visible.length} of {filtered.length} products
          {total !== filtered.length ? ` (${total} total)` : ""}
        </p>
      </div>

      {filterOpen && (
        <FilterSheet
          categories={categories}
          selected={category}
          onSelect={(cat) => {
            setCategory(cat);
            setPage(1);
            setFilterOpen(false);
          }}
          onClose={() => setFilterOpen(false)}
        />
      )}
    </section>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[44px] rounded-lg px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        active
          ? "bg-primary text-white"
          : "border border-border bg-surface text-body hover:bg-primary-light"
      }`}
    >
      {label}
    </button>
  );
}

function FilterSheet({
  categories,
  selected,
  onSelect,
  onClose,
}: {
  categories: string[];
  selected: string | null;
  onSelect: (cat: string | null) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] md:hidden" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close filters"
      />
      <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-surface p-4 pb-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-heading">Category</h3>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-3 text-sm font-semibold text-primary"
          >
            Done
          </button>
        </div>
        <ul className="space-y-1">
          <li>
            <button
              type="button"
              onClick={() => onSelect(null)}
              className={`flex min-h-[52px] w-full items-center rounded-lg px-4 text-left text-base font-semibold ${
                selected === null ? "bg-primary-light text-primary" : "text-body"
              }`}
            >
              Sab Categories
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat}>
              <button
                type="button"
                onClick={() => onSelect(cat)}
                className={`flex min-h-[52px] w-full items-center rounded-lg px-4 text-left text-base font-semibold ${
                  selected === cat ? "bg-primary-light text-primary" : "text-body"
                }`}
              >
                {cat}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
