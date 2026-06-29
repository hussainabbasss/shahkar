"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import type { Product } from "@/lib/types";

type ProductGalleryProps = {
  images: string[];
  name: string;
  onSale?: boolean;
};

export function ProductGallery({ images, name, onSale }: ProductGalleryProps) {
  const gallery =
    images.length >= 3 ? images : [...images, ...images, ...images].slice(0, 3);
  const [activeIndex, setActiveIndex] = useState(0);

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(Math.max(0, Math.min(index, gallery.length - 1)));
    },
    [gallery.length],
  );

  return (
    <div>
      <div className="relative md:hidden">
        <div
          className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth rounded-2xl"
          onScroll={(e) => {
            const el = e.currentTarget;
            const index = Math.round(el.scrollLeft / el.clientWidth);
            setActiveIndex(index);
          }}
        >
          {gallery.map((src, i) => (
            <div
              key={`${src}-${i}`}
              className="relative aspect-square w-full shrink-0 snap-center overflow-hidden bg-background"
            >
              <Image
                src={src || "/products/placeholder.svg"}
                alt={`${name} — image ${i + 1}`}
                fill
                priority={i === 0}
                className="object-cover"
                sizes="100vw"
              />
              {onSale && i === 0 && (
                <span className="absolute left-3 top-3 rounded-md bg-accent px-2 py-1 text-xs font-bold uppercase text-white">
                  Sale
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-center gap-2">
          {gallery.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                const container = document.querySelector(
                  ".flex.snap-x.snap-mandatory",
                );
                if (container instanceof HTMLElement) {
                  container.scrollTo({
                    left: i * container.clientWidth,
                    behavior: "smooth",
                  });
                }
                goTo(i);
              }}
              className={`h-2 rounded-full transition-all ${
                i === activeIndex ? "w-6 bg-primary" : "w-2 bg-border"
              }`}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="hidden gap-4 md:grid md:grid-cols-[80px_1fr]">
        <div className="flex flex-col gap-2">
          {gallery.map((src, i) => (
            <button
              key={`thumb-${i}`}
              type="button"
              onClick={() => goTo(i)}
              className={`relative aspect-square overflow-hidden rounded-lg border-2 ${
                i === activeIndex ? "border-primary" : "border-border"
              }`}
            >
              <Image
                src={src || "/products/placeholder.svg"}
                alt=""
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-background">
          <Image
            src={gallery[activeIndex] || "/products/placeholder.svg"}
            alt={name}
            fill
            priority
            className="object-cover"
            sizes="50vw"
          />
          {onSale && (
            <span className="absolute left-3 top-3 rounded-md bg-accent px-2 py-1 text-xs font-bold uppercase text-white">
              Sale
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
