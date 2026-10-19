import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireOfficer } from "@/app/api/lost-found/require-officer";
import { MAX_ROSTER_LINES, parseRoster } from "@/lib/pass";

/**
 * 입장권 명단 추가. 붙여넣은 "학번 이름" 글을 그대로 받아 서버에서 다시 읽는다
 * (미리보기와 같은 parseRoster). 이미 있는 학번은 건너뛴다. 임원만(RLS 이중 방어).
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

  const { projectId, text } = (body ?? {}) as Record<string, unknown>;
  if (typeof projectId !== "string" || typeof text !== "string") {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }
  if (text.split(/\r?\n/).length > MAX_ROSTER_LINES) {
    return NextResponse.json(
      { error: `한 번에 ${MAX_ROSTER_LINES}줄까지 붙여넣을 수 있습니다.` },
      { status: 400 },
    );
  }

  const { entries } = parseRoster(text);
  if (entries.length === 0) {
    return NextResponse.json({ error: "추가할 학생이 없습니다." }, { status: 400 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) {
    return NextResponse.json({ error: "사업을 찾을 수 없습니다." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("pass_holders")
    .upsert(
      entries.map((entry) => ({
        project_id: projectId,
        student_number: entry.studentNumber,
        student_name: entry.studentName,
      })),
      { onConflict: "project_id,student_number", ignoreDuplicates: true },
    )
    .select("id");

  if (error) {
    return NextResponse.json(
      { error: `명단을 추가하지 못했습니다: ${error.message}` },
      { status: 500 },
    );
  }

  revalidatePath(`/admin/projects/${projectId}/pass`);

  return NextResponse.json({ ok: true, added: data?.length ?? 0 });
}
