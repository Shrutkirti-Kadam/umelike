import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

/**
 * Type pairing:
 *  - Fraunces (variable, with its SOFT axis) for display — a serif with
 *    real warmth; the soft axis rounds the letterforms toward candlelight.
 *  - Inter for body — a clean humanist sans that stays out of the way.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["SOFT", "opsz"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "umelike",
  description:
    "A quieter way to meet someone. One profile, real intentions, no noise.",
  icons: { icon: "/u-dark.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
