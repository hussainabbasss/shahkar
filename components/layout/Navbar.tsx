"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { NAV_LINKS } from "@/lib/constants";
import { useCart } from "@/lib/cart/cart-context";

export function Navbar() {
  const { count, cartBounce } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-surface shadow-[0_1px_4px_rgba(0,0,0,0.08)]">
        <div className="mx-auto flex h-[60px] max-w-7xl items-center justify-between px-4 md:h-[70px] md:px-8">
          <Link
            href="/"
            className="text-lg font-extrabold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Shahkar<span className="text-body">.store</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-body transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/cart"
              className={`relative flex h-11 w-11 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${cartBounce ? "animate-cart-bounce" : ""}`}
              aria-label={`Cart, ${count} items`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-white">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </Link>

            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-heading md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
