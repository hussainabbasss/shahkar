import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { SaleBanner } from "@/components/layout/SaleBanner";
import { getActiveSale } from "@/lib/data/sales";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const activeSale = await getActiveSale();

  return (
    <>
      {activeSale && <SaleBanner sale={activeSale} />}
      <Navbar />
      <main className="min-w-0 max-w-full flex-1 overflow-x-clip">{children}</main>
      <Footer />
    </>
  );
}
