import type { Metadata } from "next";
import { CodBadge } from "@/components/ui/CodBadge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About",
  description: "Shahkar.store ke baare mein — Pakistani gharon ke liye smart products.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 md:px-8 md:py-20">
      <SectionHeading className="mb-6">{SITE_NAME}</SectionHeading>
      <p className="mb-4 text-lg font-semibold text-primary">{SITE_TAGLINE}</p>
      <div className="space-y-4 text-base leading-relaxed text-body">
        <p>
          Shahkar.store Pakistani gharon ke liye smart, useful products laata hai —
          woh cheezein jo roz marra ki zindagi aasaan kar dein. Hum samajhtay hain ke
          online shopping pe bharosa karna mushkil hota hai, is liye hum Cash on
          Delivery pe poore Pakistan mein deliver karte hain.
        </p>
        <p>
          Har product carefully select hota hai — quality check, sahi daam, aur asli
          customer support. Agar koi masla ho toh WhatsApp par hum se rabta karein.
        </p>
      </div>
      <div className="mt-8">
        <CodBadge />
      </div>

      <section id="returns" className="mt-16 scroll-mt-24">
        <h2 className="mb-4 text-xl font-bold text-heading">Returns Policy</h2>
        <div className="space-y-3 text-base leading-relaxed text-body">
          <p>
            Agar product kharabi ki wajah se kaam na kare ya damage ho kar aaye,
            7 din ke andar return kar sakte hain.
          </p>
          <p>
            Return ke liye WhatsApp par order number aur product ki photo bhejein.
            Hum team jald jawab degi aur replacement ya refund arrange karegi.
          </p>
          <p>
            COD orders pe pehle product check karein — delivery ke waqt agar kuch
            theek na lage toh wapas kar dein.
          </p>
        </div>
      </section>
    </div>
  );
}
