import Link from "next/link";
import { PrimaryButton } from "@/components/ui/buttons";
import { SectionHeading } from "@/components/ui/SectionHeading";

export function CartEmptyState() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center md:px-8">
      <SectionHeading className="mb-4">Aapka Cart</SectionHeading>
      <p className="mb-8 text-base text-body">
        Abhi tak kuch nahi daala? 🛒 Products dekhein →
      </p>
      <Link href="/#products">
        <PrimaryButton>Browse Products</PrimaryButton>
      </Link>
    </div>
  );
}
