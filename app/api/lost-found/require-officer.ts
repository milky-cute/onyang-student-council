import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * 로그인한 임원인지 확인한다.
 *
 * RLS 정책(is_officer())으로도 막히지만, 애플리케이션에서 한 번 더 확인한다.
 * 정책이 잘못 바뀌어도 데이터가 새지 않게 하는 이중 방어다 — 한쪽만 믿지 않는다.
 */
export async function requireOfficer() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      error: NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 }),
    };
  }

  const { data: officer } = await supabase
    .from("officers")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!officer) {
    return {
      supabase,
      error: NextResponse.json({ error: "임원만 이용할 수 있습니다." }, { status: 403 }),
    };
  }

  return { supabase, error: null };
}
