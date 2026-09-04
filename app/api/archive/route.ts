import { randomUUID } from "node:crypto";

import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { STORAGE_BUCKET } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/**
 * Storage 오브젝트 키(경로)에 쓸 ASCII 전용 슬러그를 만든다.
 * Supabase Storage 키는 영문/숫자/일부 기호만 허용하므로, 한글 등 비 ASCII 문자는
 * 전부 제거한다 — 한글 앨범 이름을 그대로 넣으면 "Invalid key" 오류로 업로드가 실패한다.
 * 화면에 보이는 앨범 이름(그룹핑)은 이 슬러그가 아니라 DB의 album 컬럼이 담당하므로,
 * 슬러그가 비어도(=완전히 한글 이름) 문제없다.
 */
function slugifyAlbum(album: string) {
  const slug = album
    .trim()
    .replace(/[^a-zA-Z0-9\-_ ]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return slug || `album-${randomUUID().slice(0, 8)}`;
}

/** 앨범 생성 + 사진 여러 장 업로드. Storage 업로드와 DB insert 모두 임원만 가능(RLS 이중 방어). */
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
    return NextResponse.json({ error: "임원만 사진을 등록할 수 있습니다." }, { status: 403 });
  }

  const formData = await request.formData();
  const album = String(formData.get("album") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File);

  if (!album) {
    return NextResponse.json({ error: "앨범 이름을 입력해주세요." }, { status: 400 });
  }
  if (files.length === 0) {
    return NextResponse.json({ error: "업로드할 사진을 선택해주세요." }, { status: 400 });
  }

  const albumSlug = slugifyAlbum(album);

  for (const [index, file] of files.entries()) {
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `${file.name}: 지원하지 않는 이미지 형식입니다.` },
        { status: 400 },
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `${file.name}: 파일 크기는 5MB 이하여야 합니다.` },
        { status: 400 },
      );
    }

    const ext = file.name.split(".").pop() || "jpg";
    const path = `archive/${albumSlug}/${Date.now()}-${index}-${randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      console.error("archive upload failed:", uploadError);
      return NextResponse.json(
        { error: `업로드 실패: ${file.name} (${uploadError.message})` },
        { status: 500 },
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

    const { error: insertError } = await supabase.from("archive_photos").insert({
      title: title || `${album} ${index + 1}`,
      description: description || null,
      image_url: publicUrl,
      album,
      uploaded_by: user.id,
    });

    if (insertError) {
      return NextResponse.json(
        { error: `사진 정보를 저장하지 못했습니다: ${file.name}` },
        { status: 500 },
      );
    }
  }

  // /archive 와 앨범 페이지가 캐시된 사진 목록을 쓰므로 등록 즉시 갱신한다.
  // expire: 0 — 오래된 목록을 내보내지 않고 다음 요청에서 바로 새로 조회하게 한다.
  revalidateTag("archive", { expire: 0 });

  return NextResponse.json({ ok: true, count: files.length });
}
