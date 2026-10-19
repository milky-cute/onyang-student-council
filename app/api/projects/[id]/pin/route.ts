import { NextResponse } from "next/server";

import { requireOfficer } from "../../../lost-found/require-officer";
import { revalidateProject } from "../../validate";

type Params = { params: Promise<{ id: string }> };

/** 상단 고정 토글. 임원만 가능하다(RLS 이중 방어). */
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const { supabase, error: authError } = await requireOfficer();
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { isPinned } = (body ?? {}) as Record<string, unknown>;
  if (typeof isPinned !== "boolean") {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("projects")
    .update({ is_pinned: isPinned })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "변경 중 문제가 발생했습니다." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "사업을 찾을 수 없습니다." }, { status: 404 });
  }

  revalidateProject(id);

  return NextResponse.json({ ok: true });
}
