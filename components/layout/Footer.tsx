import Link from "next/link";
import { FOOTER_LINKS, getWhatsAppUrl, SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="text-lg font-extrabold text-primary">{SITE_NAME}</p>
            <p className="mt-2 text-sm text-muted">{SITE_TAGLINE}</p>
            <p className="mt-4 text-sm font-semibold text-primary">
              Cash on Delivery — Poore Pakistan Mein
            </p>
          </div>

          <nav aria-label="Footer">
            <p className="mb-3 text-sm font-bold text-heading">Links</p>
            <ul className="space-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-body hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="mb-3 text-sm font-bold text-heading">Rabta</p>
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[52px] items-center gap-2 rounded-[10px] bg-[#25D366] px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366]"
            >
              <span aria-hidden="true">💬</span>
              WhatsApp Par Message Karein
            </a>
          </div>
        </div>

        <p className="mt-10 border-t border-border pt-6 text-center text-sm text-muted">
          © 2026 Shahkar.store
        </p>
      </div>
    </footer>
  );
}
