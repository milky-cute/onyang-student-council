import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireOfficer } from "@/app/api/lost-found/require-officer";
import { MAX_ROSTER_LINES, parseRoster } from "@/lib/pass";

/**
 * 입장권 명단 추가. 붙여넣은 "학번 이름 (좌석)" 글을 그대로 받아 서버에서 다시 읽는다
 * (미리보기와 같은 parseRoster). 임원만(RLS 이중 방어).
 * - 새 학번은 추가한다(3칸이면 좌석 포함).
 * - 이미 있는 학번은 3칸 줄일 때만 좌석을 바꾼다. 이름 · 정지 상태와, 2칸 줄의 기존 좌석은 건드리지 않는다.
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

  const { data: project } = await supabase
    .from("projects")
    .select("id, pass_seat_enabled")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) {
    return NextResponse.json({ error: "사업을 찾을 수 없습니다." }, { status: 404 });
  }

  // 좌석 표시를 안 쓰는 사업이면 셋째 칸(좌석)은 버리고 학번 · 이름만 쓴다.
  const { entries } = parseRoster(text, project.pass_seat_enabled);
  if (entries.length === 0) {
    return NextResponse.json({ error: "추가할 학생이 없습니다." }, { status: 400 });
  }

  const { data: holders, error: holdersError } = await supabase
    .from("pass_holders")
    .select("student_number, student_name, seat")
    .eq("project_id", projectId);
  if (holdersError) {
    return NextResponse.json(
      { error: `명단을 추가하지 못했습니다: ${holdersError.message}` },
      { status: 500 },
    );
  }
  const existing = new Map((holders ?? []).map((holder) => [holder.student_number, holder]));

  const newEntries = entries.filter((entry) => !existing.has(entry.studentNumber));
  // 좌석이 실제로 바뀌는 기존 학생만. 좌석이 없는 줄(2칸)은 여기 들어오지 않아 기존 좌석이 지워지지 않는다.
  const seatChanges = entries.flatMap((entry) => {
    const holder = existing.get(entry.studentNumber);
    return holder && entry.seat !== undefined && entry.seat !== holder.seat
      ? [{ holder, seat: entry.seat }]
      : [];
  });

  let added = 0;
  if (newEntries.length > 0) {
    const { data, error } = await supabase
      .from("pass_holders")
      .upsert(
        newEntries.map((entry) => ({
          project_id: projectId,
          student_number: entry.studentNumber,
          student_name: entry.studentName,
          seat: entry.seat ?? null,
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
    added = data?.length ?? 0;
  }

  let updated = 0;
  if (seatChanges.length > 0) {
    // 한 번에 바꾸려고 upsert 를 쓴다. 이름은 지금 DB 값을 그대로 다시 넣어 바뀌지 않고,
    // is_suspended 는 보내지 않아 그대로 남는다.
    const { data, error } = await supabase
      .from("pass_holders")
      .upsert(
        seatChanges.map(({ holder, seat }) => ({
          project_id: projectId,
          student_number: holder.student_number,
          student_name: holder.student_name,
          seat,
        })),
        { onConflict: "project_id,student_number" },
      )
      .select("id");

    if (error) {
      return NextResponse.json(
        { error: `좌석을 바꾸지 못했습니다: ${error.message}` },
        { status: 500 },
      );
    }
    updated = data?.length ?? 0;
  }

  revalidatePath(`/admin/projects/${projectId}/pass`);

  return NextResponse.json({ ok: true, added, updated });
}
