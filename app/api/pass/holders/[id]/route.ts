import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireOfficer } from "@/app/api/lost-found/require-officer";

type Params = { params: Promise<{ id: string }> };

/** 명단 학생 한 명의 입장권 정지 / 해제. 임원만(RLS 이중 방어). */
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

  const { isSuspended } = (body ?? {}) as Record<string, unknown>;
  if (typeof isSuspended !== "boolean") {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("pass_holders")
    .update({ is_suspended: isSuspended })
    .eq("id", id)
    .select("project_id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "변경 중 문제가 발생했습니다." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "명단에서 찾을 수 없습니다." }, { status: 404 });
  }

  revalidatePath(`/admin/projects/${data.project_id}/pass`);

  return NextResponse.json({ ok: true });
}

/** 명단에서 삭제. PIN(학번 공통)은 지우지 않는다. 임원만(RLS 이중 방어). */
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const { supabase, error: authError } = await requireOfficer();
  if (authError) return authError;

  const { data, error } = await supabase
    .from("pass_holders")
    .delete()
    .eq("id", id)
    .select("project_id")
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: `삭제하지 못했습니다: ${error.message}` },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json({ error: "명단에서 찾을 수 없습니다." }, { status: 404 });
  }

  revalidatePath(`/admin/projects/${data.project_id}/pass`);

  return NextResponse.json({ ok: true });
}
