import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const DEFAULT_COLOR = "#2563eb";

/** 일정 등록. calendar_events insert 는 RLS 로 임원만 허용된다(이중 방어). */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: officer } = await supabase
    .from("officers")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!officer) {
    return NextResponse.json({ error: "임원만 일정을 등록할 수 있습니다." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { title, description, eventDate, color } = (body ?? {}) as Record<string, unknown>;

  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof eventDate !== "string" ||
    !DATE_RE.test(eventDate)
  ) {
    return NextResponse.json({ error: "제목과 날짜를 올바르게 입력해주세요." }, { status: 400 });
  }
  if (description !== undefined && typeof description !== "string") {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }

  // 색상을 안 보내면 기본값(브랜드 블루)으로 처리한다.
  const eventColor = color === undefined ? DEFAULT_COLOR : color;
  if (typeof eventColor !== "string" || !COLOR_RE.test(eventColor)) {
    return NextResponse.json({ error: "색상 값이 올바르지 않습니다." }, { status: 400 });
  }

  const { error } = await supabase.from("calendar_events").insert({
    title: title.trim(),
    description:
      typeof description === "string" && description.trim() ? description.trim() : null,
    event_date: eventDate,
    color: eventColor.toLowerCase(),
    author_id: user.id,
  });

  if (error) {
    return NextResponse.json({ error: `등록하지 못했습니다: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
