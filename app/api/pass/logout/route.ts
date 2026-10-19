import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { PASS_COOKIE } from "@/lib/pass";
import { createClient } from "@/lib/supabase/server";

/** "다른 학생으로 로그인". 이 휴대폰의 세션만 지우고 쿠키를 없앤다. */
export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(PASS_COOKIE)?.value;

  if (token) {
    const supabase = await createClient();
    // DB 세션 삭제가 실패해도 쿠키는 지운다 — 이 휴대폰에서는 어차피 로그아웃된다.
    await supabase.rpc("pass_logout", { p_token: token });
  }

  // 로그인 때와 같은 속성으로 만료시켜야 브라우저가 같은 쿠키로 보고 지운다.
  cookieStore.set(PASS_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return NextResponse.json({ ok: true });
}
