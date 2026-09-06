import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site-url";

/**
 * robots.txt 생성.
 * 임원 전용 화면(/admin)과 내부 API 는 검색 노출 대상이 아니므로 제외한다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
