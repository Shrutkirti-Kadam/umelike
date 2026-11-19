import type { Metadata } from "next";

/*
 * /admin is for the moderation team. It is not linked from anywhere on the
 * site and search engines are told to leave it alone. The real access control
 * is in the database (every RPC the page calls checks the caller's staff role);
 * this layout only keeps the page out of indexes and tab titles honest.
 */
export const metadata: Metadata = {
  title: "Numbers",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
