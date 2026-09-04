import { NextResponse } from "next/server";

import type { StudentRequest } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

/**
 * 임원 답변 저장 · 공개 여부 변경.
 * body 에 answer 가 있으면 답변을 저장하고(부서 스냅샷 포함), isPublic 이 있으면
 * 공개 여부만 바꾼다. 둘 다 보낼 수도, 하나만 보낼 수도 있다.
 * requests 테이블 update 는 RLS 로 임원만 허용된다(이중 방어).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { answer, isPublic } = (body ?? {}) as Record<string, unknown>;

  if (answer === undefined && isPublic === undefined) {
    return NextResponse.json({ error: "변경할 내용이 없습니다." }, { status: 400 });
  }
  if (answer !== undefined && (typeof answer !== "string" || !answer.trim())) {
    return NextResponse.json({ error: "답변 내용을 입력해주세요." }, { status: 400 });
  }
  if (isPublic !== undefined && typeof isPublic !== "boolean") {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: officer } = await supabase
    .from("officers")
    .select("department")
    .eq("id", user.id)
    .maybeSingle();

  if (!officer) {
    return NextResponse.json({ error: "임원만 이용할 수 있습니다." }, { status: 403 });
  }

  const updates: Partial<StudentRequest> = {};

  if (typeof answer === "string") {
    updates.answer = answer;
    updates.status = "답변완료";
    updates.answered_by = user.id;
    updates.answered_at = new Date().toISOString();
    updates.answered_department = officer.department;
  }

  if (typeof isPublic === "boolean") {
    updates.is_public = isPublic;
  }

  const { data, error } = await supabase
    .from("requests")
    .update(updates)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "저장 중 문제가 발생했습니다." }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: "권한이 없거나 요구사항을 찾을 수 없습니다." },
      { status: 403 },
    );
  }

  return NextResponse.json({ ok: true });
}
