import type { MetadataRoute } from "next";

import { NAV_ITEMS } from "@/lib/site-config";
import { SITE_URL } from "@/lib/site-url";

/**
 * sitemap.xml 생성.
 *
 * 공개 정적 경로만 담는다. 게시글·앨범 상세는 DB 조회가 필요해 이 파일을 매번
 * 동적으로 만들게 되므로, 목록 페이지만 올리고 크롤러가 링크를 따라가게 둔다.
 * 임원 전용(/admin)은 robots.txt 에서 제외된다.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    { url: SITE_URL, lastModified, changeFrequency: "weekly", priority: 1 },
    ...NAV_ITEMS.map((item) => ({
      url: `${SITE_URL}${item.href}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    {
      url: `${SITE_URL}/requests/check`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
  ];
}
