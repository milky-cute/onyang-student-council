import type { Metadata, Viewport } from "next";

import { BottomTabBar } from "@/components/bottom-tab-bar";
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

// viewport-fit=cover 여야 iOS 에서 env(safe-area-inset-bottom) 값이 들어와
// 하단 탭바가 홈 표시줄과 겹치지 않는다.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/** Pretendard 가변 글꼴(필요한 글자만 내려받는 dynamic-subset). 못 불러오면 globals.css 의 시스템 글꼴로 보인다. */
const PRETENDARD_CSS =
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css";

/**
 * 전역 레이아웃 — 헤더 / 본문 / 푸터 / 모바일 하단 탭바.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href={PRETENDARD_CSS} crossOrigin="anonymous" />
      </head>
      <body className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <BottomTabBar />
      </body>
    </html>
  );
}
