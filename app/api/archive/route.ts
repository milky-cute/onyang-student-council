import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { STORAGE_BUCKET } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function slugifyAlbum(album: string) {
  const slug = album
    .trim()
    .replace(/[^\p{L}\p{N}\-_ ]/gu, "")
    .replace(/\s+/g, "-")
    .slice(0, 60);
  return slug || "album";
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
      return NextResponse.json({ error: `업로드 실패: ${file.name}` }, { status: 500 });
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

  return NextResponse.json({ ok: true, count: files.length });
}
