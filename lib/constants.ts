export const SITE_NAME = "Shahkar.store";
export const SITE_TAGLINE = "Har Desi Masle Ka Hal";
export const WHATSAPP_NUMBER = "923001234567";
export const WHATSAPP_MESSAGE =
  "Assalam o Alaikum! Shahkar.store se rabta kar raha/rahi hoon.";
export const DELIVERY_FEE = 200;
export const PRODUCTS_PER_PAGE = 8;

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/#products", label: "Products" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const FOOTER_LINKS = [
  { href: "/#products", label: "Products" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/about#returns", label: "Returns Policy" },
] as const;

export function getWhatsAppUrl(message = WHATSAPP_MESSAGE): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
