import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * 인증이 필요 없는 완전 공개 읽기 전용 페이지 전용 Supabase 클라이언트.
 *
 * lib/supabase/server.ts 의 createClient() 는 next/headers 의 cookies() 를 읽는데,
 * 이는 Next.js Dynamic API 라서 그 클라이언트를 쓰는 페이지는 `export const revalidate`
 * 를 걸어도 매 요청마다 새로 렌더링된다(라우트 캐시가 적용되지 않음). 로그인 상태를
 * 전혀 쓰지 않는 순수 공개 읽기 페이지(아카이브·이달의 학생자치회 등)는 이 클라이언트를
 * 대신 써서 캐시가 실제로 동작하게 한다.
 *
 * anon 키만 쓰므로 RLS 상 anon 조회가 허용된 테이블에만 사용할 것.
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}
