import { NextResponse } from "next/server";

import { requireOfficer } from "../lost-found/require-officer";
import { parseProjectInput, revalidateProject } from "./validate";

/**
 * 사업 등록. 임원만 가능하다(RLS + 여기서 한 번 더 확인).
 * 사진은 photos/route.ts 로 미리 한 장씩 올리고, 여기에는 그 URL 을 순서대로 보낸다.
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

  const parsed = parseProjectInput(body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { row, photos, links } = parsed.input;

  const { data: project, error } = await supabase
    .from("projects")
    .insert(row)
    .select("id")
    .single();

  if (error || !project) {
    return NextResponse.json(
      { error: `등록하지 못했습니다: ${error?.message ?? "알 수 없는 오류"}` },
      { status: 500 },
    );
  }

  // 사진은 선택이라 0장이면 insert 를 건너뛴다.
  const { error: photoError } =
    photos.length > 0
      ? await supabase
          .from("project_photos")
          .insert(photos.map((image_url, sort_order) => ({ project_id: project.id, image_url, sort_order })))
      : { error: null };

  const { error: linkError } =
    !photoError && links.length > 0
      ? await supabase
          .from("project_links")
          .insert(links.map((link, sort_order) => ({ ...link, project_id: project.id, sort_order })))
      : { error: null };

  if (photoError || linkError) {
    // 사진 · 링크 없이 반쪽짜리 사업이 공개되지 않게 되돌린다(사진 · 링크 행은 cascade 로 지워진다).
    await supabase.from("projects").delete().eq("id", project.id);
    return NextResponse.json(
      { error: `등록하지 못했습니다: ${(photoError ?? linkError)?.message}` },
      { status: 500 },
    );
  }

  revalidateProject(project.id);

  return NextResponse.json({ id: project.id }, { status: 201 });
}
