import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { PASS_COOKIE, PASS_COOKIE_MAX_AGE } from "@/lib/pass";
import { createClient } from "@/lib/supabase/server";

/**
 * 입장권 로그인. pass_login() 이 이름 · 학번이 명단에 있는지, PIN 이 맞는지 확인하고
 * (처음이면 PIN 을 정하고) 무작위 토큰을 한 번만 돌려준다. 토큰은 httpOnly 쿠키에만 넣는다.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { studentName, studentNumber, pin } = (body ?? {}) as Record<string, unknown>;

  if (
    typeof studentName !== "string" ||
    typeof studentNumber !== "string" ||
    typeof pin !== "string" ||
    !studentName.trim() ||
    !studentNumber.trim() ||
    !/^\d{4}$/.test(pin)
  ) {
    return NextResponse.json(
      { error: "이름과 학번을 입력하고, PIN은 숫자 4자리로 입력해 주세요." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("pass_login", {
    p_name: studentName,
    p_number: studentNumber,
    p_pin: pin,
  });

  if (error) {
    if (error.message.includes("PASS_LOCKED")) {
      return NextResponse.json(
        { error: "PIN을 5번 틀려 10분 동안 잠겼어요. 잠시 후 다시 시도해 주세요." },
        { status: 429 },
      );
    }
    if (error.message.includes("PASS_INVALID_INPUT")) {
      return NextResponse.json(
        { error: "이름과 학번을 입력하고, PIN은 숫자 4자리로 입력해 주세요." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "로그인 중 문제가 발생했어요." }, { status: 500 });
  }

  // 명단에 없을 때와 PIN 이 틀렸을 때를 같은 문구로 보여줘서 명단을 추측하지 못하게 한다.
  const token = data?.[0]?.token;
  if (!token) {
    return NextResponse.json({ error: "명단에 없거나 정보가 맞지 않아요." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(PASS_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: PASS_COOKIE_MAX_AGE,
  });

  return NextResponse.json({ ok: true, isNewPin: data[0].is_new_pin === true });
}
