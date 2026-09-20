import type { Metadata } from "next";
import {
  Fraunces,
  Inter,
} from "next/font/google";

import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: [
    "SOFT",
    "opsz",
  ],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "umelike",
    template: "%s · umelike",
  },

  description:
    "A quieter way to meet someone. One honest profile, real intentions, and none of the noise.",

  applicationName:
    "umelike",

  keywords: [
    "umelike",
    "dating",
    "dating app",
    "relationships",
    "meet people",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${inter.variable}`}
    >
      <body>
        {children}
      </body>
    </html>
  );
}