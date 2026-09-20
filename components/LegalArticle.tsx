"use client";

import { SiteFrame } from "@/components/SiteFrame";

export function LegalArticle({
  html,
}: {
  html: string;
}) {
  return (
    <SiteFrame
      wide
      animatedBackground={false}
    >
      <article
        className="
          rounded-[26px]
          border
          border-white/55
          bg-white/[0.40]
          px-5
          py-8
          shadow-[0_20px_60px_rgba(58,38,58,0.08)]
          backdrop-blur-[24px]
          sm:px-8
          sm:py-10
          md:px-10
          lg:px-12
          lg:py-12
        "
        dangerouslySetInnerHTML={{
          __html: html,
        }}
      />
    </SiteFrame>
  );
}