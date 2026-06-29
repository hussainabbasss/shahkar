import { AllProductsSection } from "@/components/home/AllProductsSection";
import { FeaturedProductsSection } from "@/components/home/FeaturedProductsSection";
import { HeroSection } from "@/components/home/HeroSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { TrustSection } from "@/components/home/TrustSection";
import { WhyShahkarSection } from "@/components/home/WhyShahkarSection";
import { WhatsAppFab } from "@/components/layout/WhatsAppFab";
import { getFeaturedProducts, getProducts } from "@/lib/data/products";
import { getActiveSale } from "@/lib/data/sales";
import { getTestimonials } from "@/lib/data/testimonials";

export default async function HomePage() {
  const [featuredProducts, allProductsResult, activeSale, testimonials] =
    await Promise.all([
      getFeaturedProducts(),
      getProducts({ limit: 100 }),
      getActiveSale(),
      getTestimonials(),
    ]);

  return (
    <>
      <HeroSection />
      <WhyShahkarSection />
      <FeaturedProductsSection
        products={featuredProducts}
        activeSale={activeSale}
      />
      <AllProductsSection
        initialProducts={allProductsResult.products}
        total={allProductsResult.total}
        categories={allProductsResult.categories}
        activeSale={activeSale}
      />
      <HowItWorksSection />
      <TrustSection testimonials={testimonials} />
      <WhatsAppFab />
    </>
  );
}
