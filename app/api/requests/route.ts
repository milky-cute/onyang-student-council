import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * 요구사항 제출. PIN 해시는 submit_request() Postgres 함수(pgcrypto)가 처리하며,
 * 이 라우트가 클라이언트와 그 함수 사이의 유일한 통로다 — 해시 로직은 클라이언트로 내려가지 않는다.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { studentName, studentNumber, pin, title, category, content } =
    (body ?? {}) as Record<string, unknown>;

  if (
    typeof studentName !== "string" ||
    typeof studentNumber !== "string" ||
    typeof pin !== "string" ||
    typeof title !== "string" ||
    typeof content !== "string" ||
    (category !== undefined && category !== null && typeof category !== "string")
  ) {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }

  if (!studentName.trim() || !studentNumber.trim() || !title.trim() || !content.trim()) {
    return NextResponse.json({ error: "필수 항목을 모두 입력해주세요." }, { status: 400 });
  }

  if (!/^\d{4}$/.test(pin)) {
    return NextResponse.json({ error: "PIN은 숫자 4자리여야 합니다." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_request", {
    p_student_name: studentName,
    p_student_number: studentNumber,
    p_pin: pin,
    p_title: title,
    p_category: typeof category === "string" && category.trim() ? category : null,
    p_content: content,
  });

  if (error) {
    return NextResponse.json({ error: "제출 중 문제가 발생했습니다." }, { status: 500 });
  }

  return NextResponse.json({ id: data }, { status: 201 });
}
