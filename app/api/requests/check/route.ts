import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * 본인 요구사항 조회. get_my_requests() 함수가 이름 · 학번 · PIN 을 모두 대조해
 * 일치하는 행만 돌려주므로, 다른 학생의 글은 여기서 절대 섞이지 않는다.
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
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_my_requests", {
    p_student_name: studentName,
    p_student_number: studentNumber,
    p_pin: pin,
  });

  if (error) {
    return NextResponse.json({ error: "조회 중 문제가 발생했습니다." }, { status: 500 });
  }

  return NextResponse.json({ requests: data ?? [] });
}
