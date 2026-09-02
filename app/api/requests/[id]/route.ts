import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/** 임원 답변 저장. requests 테이블 update 는 RLS 로 임원만 허용된다(이중 방어). */
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

  const { answer } = (body ?? {}) as Record<string, unknown>;

  if (typeof answer !== "string" || !answer.trim()) {
    return NextResponse.json({ error: "답변 내용을 입력해주세요." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("requests")
    .update({
      answer,
      status: "답변완료",
      answered_by: user.id,
      answered_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "답변 저장 중 문제가 발생했습니다." }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: "권한이 없거나 요구사항을 찾을 수 없습니다." },
      { status: 403 },
    );
  }

  return NextResponse.json({ ok: true });
}
