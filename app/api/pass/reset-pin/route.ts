import { NextResponse } from "next/server";

import { requireOfficer } from "@/app/api/lost-found/require-officer";
import { ROSTER_LIMITS } from "@/lib/pass";

/**
 * PIN 초기화. 그 학번의 PIN 과 모든 로그인 세션을 지운다. PIN 은 학번 공통이라
 * 모든 사업 입장권에 적용된다. 학생은 다음에 입장권을 열 때 새 PIN 을 정한다.
 * 임원만(RLS 이중 방어).
 */
export async function POST(request: Request) {
  const { supabase, error: authError } = await requireOfficer();
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { studentNumber } = (body ?? {}) as Record<string, unknown>;
  if (
    typeof studentNumber !== "string" ||
    !studentNumber.trim() ||
    studentNumber.length > ROSTER_LIMITS.studentNumber
  ) {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }

  // 세션을 먼저 지운다. 로그인된 휴대폰이 남은 채로 PIN 만 사라지는 일이 없게 한다.
  const { error: sessionError } = await supabase
    .from("pass_sessions")
    .delete()
    .eq("student_number", studentNumber);

  if (sessionError) {
    return NextResponse.json(
      { error: `PIN을 초기화하지 못했습니다: ${sessionError.message}` },
      { status: 500 },
    );
  }

  const { error: credentialError } = await supabase
    .from("pass_credentials")
    .delete()
    .eq("student_number", studentNumber);

  if (credentialError) {
    return NextResponse.json(
      { error: `로그인 기록은 지웠지만 PIN을 지우지 못했습니다: ${credentialError.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
