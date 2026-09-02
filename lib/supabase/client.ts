import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트.
 *
 * 사용 예)
 *   "use client";
 *   import { createClient } from "@/lib/supabase/client";
 *   const supabase = createClient();
 *
 * ⚠️ 2단계 이후 feature 브랜치에서는 이 파일을 수정하지 않는다.
 */
export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}
