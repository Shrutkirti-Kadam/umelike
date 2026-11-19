import type { Metadata } from "next";

import { LegalArticle } from "@/components/LegalArticle";
import { markdownToHtml, readLegal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Child Safety Standards",
  description:
    "umelike's published standards against child sexual abuse and exploitation, how they are enforced, and who to contact.",
};

export default function Page() {
  return <LegalArticle html={markdownToHtml(readLegal("child-safety"))} />;
}
