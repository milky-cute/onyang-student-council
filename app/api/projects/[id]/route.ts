import { NextResponse } from "next/server";

import { STORAGE_BUCKET_PROJECTS } from "@/lib/projects";

import { requireOfficer } from "../../lost-found/require-officer";
import { parseProjectInput, photoPathFromUrl, revalidateProject } from "../validate";

type Params = { params: Promise<{ id: string }> };

/**
 * 더 이상 쓰지 않는 사진 파일을 Storage 에서 지운다. 실패해도 고아 파일만 남으므로 에러로 보지 않는다.
 * 버킷 밖 사진(시드 사업의 로고 등)은 경로를 뽑을 수 없어 건너뛴다.
 */
async function removePhotoFiles(
  supabase: Awaited<ReturnType<typeof requireOfficer>>["supabase"],
  urls: string[],
) {
  const paths = urls.map(photoPathFromUrl).filter((path): path is string => path !== null);
  if (paths.length > 0) await supabase.storage.from(STORAGE_BUCKET_PROJECTS).remove(paths);
}

/**
 * 사업 수정(폼 전체를 다시 보낸다). 임원만 가능하다(RLS 이중 방어).
 *
 * 사진 · 링크는 새 목록을 먼저 넣고 옛 행을 지운다 — 넣다가 실패해도 기존 사진 · 링크가 남는다.
 * 목록에서 빠진 사진은 Storage 파일도 지운다.
 */
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

  const [{ data: oldPhotos }, { data: oldLinks }] = await Promise.all([
    supabase.from("project_photos").select("id, image_url").eq("project_id", id),
    supabase.from("project_links").select("id").eq("project_id", id),
  ]);

  const parsed = parseProjectInput(
    body,
    (oldPhotos ?? []).map((photo) => photo.image_url),
  );
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { row, photos, links } = parsed.input;

  const { data: updated, error } = await supabase
    .from("projects")
    .update(row)
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: `저장하지 못했습니다: ${error.message}` }, { status: 500 });
  }
  if (!updated) {
    return NextResponse.json({ error: "사업을 찾을 수 없습니다." }, { status: 404 });
  }

  // 사진을 전부 뺐으면 insert 없이 아래에서 옛 행 삭제 · Storage 정리만 한다.
  const { error: photoError } =
    photos.length > 0
      ? await supabase
          .from("project_photos")
          .insert(photos.map((image_url, sort_order) => ({ project_id: id, image_url, sort_order })))
      : { error: null };
  if (!photoError && oldPhotos && oldPhotos.length > 0) {
    await supabase
      .from("project_photos")
      .delete()
      .in("id", oldPhotos.map((photo) => photo.id));
  }

  const { error: linkError } =
    links.length > 0
      ? await supabase
          .from("project_links")
          .insert(links.map((link, sort_order) => ({ ...link, project_id: id, sort_order })))
      : { error: null };
  if (!linkError && oldLinks && oldLinks.length > 0) {
    await supabase
      .from("project_links")
      .delete()
      .in("id", oldLinks.map((link) => link.id));
  }

  if (!photoError) {
    const kept = new Set(photos);
    await removePhotoFiles(
      supabase,
      (oldPhotos ?? []).map((photo) => photo.image_url).filter((url) => !kept.has(url)),
    );
  }

  revalidateProject(id);

  if (photoError || linkError) {
    return NextResponse.json(
      {
        error: `사업 정보는 저장했지만 ${photoError ? "사진" : "링크"}을 저장하지 못했습니다: ${
          (photoError ?? linkError)?.message
        }`,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

/** 사업 삭제. 사진 · 링크 행은 cascade 로 지워지고, 사진 파일은 여기서 지운다(임원만, RLS 이중 방어). */
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const { supabase, error: authError } = await requireOfficer();
  if (authError) return authError;

  const { data: photos } = await supabase
    .from("project_photos")
    .select("image_url")
    .eq("project_id", id);

  const { data: deleted, error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: `삭제하지 못했습니다: ${error.message}` }, { status: 500 });
  }
  if (!deleted) {
    return NextResponse.json({ error: "사업을 찾을 수 없습니다." }, { status: 404 });
  }

  // DB 행이 먼저 지워져야 한다. 파일 삭제는 실패해도 화면에서는 이미 사라진 상태다.
  await removePhotoFiles(supabase, (photos ?? []).map((photo) => photo.image_url));

  revalidateProject(id);

  return NextResponse.json({ ok: true });
}
