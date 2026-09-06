/**
 * 사이트 공개 주소. robots.txt / sitemap.xml 의 절대 URL 에 쓴다.
 *
 * Vercel 은 프로덕션 도메인을 VERCEL_PROJECT_PRODUCTION_URL 로 넣어주므로
 * (프로토콜 없는 호스트명) 그 값을 우선 쓰고, 없으면 배포 도메인을 기본값으로 둔다.
 * 자체 도메인을 붙이면 NEXT_PUBLIC_SITE_URL 로 덮어쓰면 된다.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://onyang-student-council.vercel.app");
