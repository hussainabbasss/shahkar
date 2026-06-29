import Link from "next/link";
import { PrimaryButton } from "@/components/ui/buttons";

export function ContinueShoppingButton() {
  return (
    <Link href="/#products" className="block">
      <PrimaryButton>Aur Shopping Karein</PrimaryButton>
    </Link>
  );
}
