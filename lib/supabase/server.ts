import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "./database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * 서버(서버 컴포넌트 · 서버 액션 · 라우트 핸들러)용 Supabase 클라이언트.
 *
 * Next.js 16 에서 cookies() 가 async 이므로 이 함수도 async 다.
 *
 * 사용 예)
 *   import { createClient } from "@/lib/supabase/server";
 *   const supabase = await createClient();
 *
 * ⚠️ 2단계 이후 feature 브랜치에서는 이 파일을 수정하지 않는다.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // 서버 컴포넌트에서는 쿠키를 쓸 수 없어 여기로 온다.
          // 세션 갱신은 proxy.ts 가 담당하므로 무시해도 안전하다.
        }
      },
    },
  });
}
