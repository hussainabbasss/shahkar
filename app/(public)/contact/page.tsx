import type { Metadata } from "next";
import Link from "next/link";
import { CodBadge } from "@/components/ui/CodBadge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getWhatsAppUrl } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact",
  description: "Shahkar.store se rabta karein — WhatsApp par message bhejein.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-8 md:py-20">
      <SectionHeading className="mb-6">Rabta Karein</SectionHeading>
      <p className="mb-6 text-base leading-relaxed text-body">
        Koi sawal hai? Order ke baare mein poochna hai? Hum WhatsApp par jald jawab
        dete hain — Roman Urdu mein, aap ki language mein.
      </p>
      <CodBadge />
      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <a
          href={getWhatsAppUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#25D366] px-7 text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-90 sm:w-auto"
        >
          💬 WhatsApp Par Message Karein
        </a>
        <Link
          href="/#products"
          className="inline-flex min-h-[52px] w-full items-center justify-center rounded-[10px] bg-primary px-7 text-base font-semibold text-white shadow-[0_4px_14px_rgba(27,107,58,0.3)] transition-all hover:bg-primary-dark sm:w-auto"
        >
          Products Dekho
        </Link>
      </div>
      <p className="mt-8 text-sm text-muted">
        Delivery: 2–3 business days · Cash on Delivery available nationwide
      </p>
    </div>
  );
}
