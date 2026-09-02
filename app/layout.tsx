import type { Metadata } from "next";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SITE } from "@/lib/site-config";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: SITE.fullName,
    template: `%s | ${SITE.fullName}`,
  },
  description: SITE.description,
};

/**
 * 전역 레이아웃 — 헤더 / 본문 / 푸터.
 *
 * ⚠️ 2단계 이후 feature 브랜치에서는 이 파일을 수정하지 않는다.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
