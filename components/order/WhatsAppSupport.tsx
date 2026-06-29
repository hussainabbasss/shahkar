import { getWhatsAppUrl } from "@/lib/constants";

export function WhatsAppSupport() {
  const message =
    "Assalam o Alaikum! Mera order place hua hai — kuch sawal hain.";

  return (
    <a
      href={getWhatsAppUrl(message)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-[52px] items-center justify-center gap-2 rounded-[10px] border-2 border-[#25D366] bg-[#25D366]/10 px-6 text-base font-semibold text-[#128C7E] transition hover:bg-[#25D366]/20"
    >
      WhatsApp pe sawal karein
    </a>
  );
}
