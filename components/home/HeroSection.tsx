"use client";

import Image from "next/image";
import { PrimaryButton } from "@/components/ui/buttons";
import { CodBadge } from "@/components/ui/CodBadge";
import { TrustBadges } from "@/components/ui/TrustBadges";

const HERO_PRODUCTS = [
  {
    src: "/products/fry-pan.svg",
    alt: "Non-stick fry pan",
    className: "left-[4%] top-[8%] z-20 w-[42%] animate-hero-float",
    badge: "Bestseller",
  },
  {
    src: "/products/steamer.svg",
    alt: "Garment steamer",
    className:
      "right-[2%] top-[2%] z-10 w-[36%] animate-hero-float-delayed",
  },
  {
    src: "/products/blender.svg",
    alt: "Kitchen blender",
    className: "bottom-[12%] left-[18%] z-30 w-[34%] animate-hero-float-delayed",
  },
  {
    src: "/products/hair-remover.svg",
    alt: "Hair remover",
    className: "bottom-[6%] right-[6%] z-20 w-[30%] animate-hero-float",
    badge: "New",
  },
] as const;

function HeroVisual() {
  return (
    <div
      className="relative mx-auto aspect-square w-full max-w-md lg:max-w-none"
      aria-hidden="true"
    >
      <div className="absolute inset-[8%] rounded-full bg-primary-light/80" />
      <div className="absolute inset-[18%] rounded-full border-2 border-dashed border-primary/15" />
      <div className="absolute -right-2 top-1/4 h-24 w-24 rounded-full bg-accent-light/80 blur-2xl" />
      <div className="absolute -left-4 bottom-1/4 h-28 w-28 rounded-full bg-primary-light blur-2xl" />

      {HERO_PRODUCTS.map((product) => (
        <div
          key={product.src}
          className={`absolute ${product.className}`}
        >
          <div className="overflow-hidden rounded-2xl border border-border bg-surface p-2 shadow-[0_8px_24px_rgba(17,24,39,0.1)]">
            <Image
              src={product.src}
              alt={product.alt}
              width={200}
              height={200}
              className="aspect-square w-full rounded-xl object-cover"
              priority
            />
          </div>
          {"badge" in product && product.badge ? (
            <span className="absolute -right-1 -top-2 rounded-md bg-accent px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
              {product.badge}
            </span>
          ) : null}
        </div>
      ))}

      <div className="absolute left-1/2 top-1/2 z-40 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-primary/20 bg-surface/95 px-4 py-3 shadow-[0_4px_20px_rgba(27,107,58,0.15)] backdrop-blur-sm">
        <p className="text-center text-xs font-semibold uppercase tracking-wide text-primary">
          Pakistan Bhar
        </p>
        <p className="mt-0.5 text-center text-sm font-bold text-heading">
          Delivery 🇵🇰
        </p>
      </div>
    </div>
  );
}

export function HeroSection() {
  const scrollToProducts = () => {
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="hero-pattern relative overflow-hidden px-4 py-12 md:px-8 md:py-24">
      <div
        className="pointer-events-none absolute -right-20 top-10 h-64 w-64 rounded-full bg-accent-light/60 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-primary-light blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
          <CodBadge />
          <h1 className="max-w-2xl text-[28px] font-extrabold leading-tight text-heading md:text-5xl">
            Har Desi Masle Ka Hal
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-body md:text-lg">
            Smart products for every Pakistani home — Cash on Delivery across
            Pakistan 🇵🇰
          </p>
          <TrustBadges />
          <PrimaryButton
            onClick={scrollToProducts}
            className="max-w-md"
            aria-label="Products section par scroll karein"
          >
            Products Dekho
          </PrimaryButton>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}
