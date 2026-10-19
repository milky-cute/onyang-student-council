import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE, STORAGE_BUCKET_PROJECTS } from "@/lib/projects";

import { requireOfficer } from "../../lost-found/require-officer";
import { photoPathFromUrl } from "../validate";

/**
 * 사업 사진 한 장 업로드. 임원만 가능하다(Storage 정책 is_officer() + 여기서 한 번 더 확인).
 *
 * 사진은 한 요청에 한 장씩 받는다 — 8장을 한 번에 보내면 요청 크기 제한에 걸린다.
 * 돌려준 URL 을 폼이 모아 두었다가 사업 등록 · 수정 요청에 순서대로 싣는다.
 * MIME · 크기는 서버에서 검사하고, 파일 이름은 randomUUID 로 서버가 정한다.
 */
export async function POST(request: Request) {
  const { supabase, error: authError } = await requireOfficer();
  if (authError) return authError;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const image = formData.get("image");
  if (!(image instanceof File) || image.size === 0) {
    return NextResponse.json({ error: "사진 파일이 없습니다." }, { status: 400 });
  }
  if (!ALLOWED_IMAGE_TYPES.includes(image.type)) {
    return NextResponse.json(
      { error: "사진은 JPG · PNG · WebP 형식만 올릴 수 있습니다." },
      { status: 400 },
    );
  }
  if (image.size > MAX_IMAGE_SIZE) {
    return NextResponse.json({ error: "사진 크기는 4MB 이하여야 합니다." }, { status: 400 });
  }

  const ext = image.type === "image/png" ? "png" : image.type === "image/webp" ? "webp" : "jpg";
  const path = `${Date.now()}-${randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET_PROJECTS)
    .upload(path, image, { contentType: image.type });

  if (uploadError) {
    console.error("project photo upload failed:", uploadError);
    return NextResponse.json(
      { error: `사진을 올리지 못했습니다: ${uploadError.message}` },
      { status: 500 },
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET_PROJECTS).getPublicUrl(path);

  return NextResponse.json({ url: publicUrl }, { status: 201 });
}

/**
 * 올렸지만 아직 저장하지 않은 사진을 폼에서 뺐을 때 Storage 파일을 지운다.
 * 이미 사업에 저장된 사진이면 지우지 않는다 — 저장된 사진은 사업을 수정 · 삭제할 때 정리된다.
 */
export async function DELETE(request: Request) {
  const { supabase, error: authError } = await requireOfficer();
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const url = (body as { url?: unknown } | null)?.url;
  const path = typeof url === "string" ? photoPathFromUrl(url) : null;
  if (!path) {
    return NextResponse.json({ error: "사진 정보가 올바르지 않습니다." }, { status: 400 });
  }

  const { data: saved, error } = await supabase
    .from("project_photos")
    .select("id")
    .eq("image_url", url as string)
    .limit(1);
  if (error) {
    return NextResponse.json({ error: "사진을 확인하지 못했습니다." }, { status: 500 });
  }
  if (saved.length === 0) {
    await supabase.storage.from(STORAGE_BUCKET_PROJECTS).remove([path]);
  }

  return NextResponse.json({ ok: true });
}
