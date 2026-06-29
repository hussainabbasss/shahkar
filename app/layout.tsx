import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { CartProvider } from "@/lib/cart/cart-context";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  display: "swap",
  variable: "--font-jakarta",
});

export const metadata: Metadata = {
  title: {
    default: "Shahkar.store — Har Desi Masle Ka Hal",
    template: "%s | Shahkar.store",
  },
  description:
    "Smart products for every Pakistani home. Cash on Delivery across Pakistan — ghar bethay order karein.",
  openGraph: {
    title: "Shahkar.store — Har Desi Masle Ka Hal",
    description:
      "Smart products for every Pakistani home. Cash on Delivery across Pakistan.",
    type: "website",
    locale: "en_PK",
    siteName: "Shahkar.store",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
