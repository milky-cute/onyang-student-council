import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next.js 16 의 프록시(구 middleware). 모든 요청에서
 *   1) Supabase 세션 쿠키를 갱신하고
 *   2) /admin 이하 임원 전용 영역의 로그인 여부를 확인한다.
 *
 * Next.js 16 부터 파일 이름이 middleware.ts → proxy.ts,
 * export 이름도 middleware → proxy 로 바뀌었다.
 *
 * ⚠️ 2단계 이후 feature 브랜치에서는 이 파일을 수정하지 않는다.
 */
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === "/admin/login";
  const isAdminArea = pathname === "/admin" || pathname.startsWith("/admin/");

  // 미로그인 상태로 임원 전용 페이지에 접근하면 로그인 페이지로 보낸다.
  if (isAdminArea && !isLoginPage && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 이미 로그인했는데 로그인 페이지에 오면 대시보드로 보낸다.
  if (isLoginPage && user) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin";
    adminUrl.search = "";
    return NextResponse.redirect(adminUrl);
  }

  return response;
}

export const config = {
  // 정적 파일·이미지 최적화 요청은 제외하고 나머지 모든 경로에서 실행한다.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
