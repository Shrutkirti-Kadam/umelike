import type { Metadata } from "next";

import { LegalArticle } from "@/components/LegalArticle";
import { markdownToHtml, readLegal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function Page() {
  return <LegalArticle html={markdownToHtml(readLegal("privacy"))} />;
}
