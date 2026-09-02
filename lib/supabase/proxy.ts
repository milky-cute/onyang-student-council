import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "./database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * 루트 proxy.ts 전용 Supabase 클라이언트.
 *
 * 요청마다 만료된 access token 을 갱신하고, 갱신된 쿠키를 응답에 실어 보낸다.
 * 이 과정을 거쳐야 서버 컴포넌트가 로그인 상태를 제대로 읽을 수 있다.
 *
 * ⚠️ 2단계 이후 feature 브랜치에서는 이 파일을 수정하지 않는다.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getSession() 이 아니라 getUser() 를 써야 서버에서 토큰이 실제로 검증된다.
  // Supabase 에 접속할 수 없는 상황(환경변수 미설정, 네트워크 장애)에서도
  // 사이트 전체가 500 이 되지 않도록 비로그인으로 처리한다.
  let user: User | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  return { response, user };
}
