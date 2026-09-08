import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  ALLOWED_IMAGE_TYPES,
  FIELD_LIMITS,
  MAX_IMAGE_SIZE,
  STORAGE_BUCKET_LOST_FOUND,
} from "@/lib/lost-found";

import { requireOfficer } from "./require-officer";

/**
 * 습득물 등록. 임원만 가능하다(RLS + 여기서 한 번 더 확인).
 *
 * 사진은 FormData 로 받아 서버에서 MIME · 크기를 검증한 뒤 Storage 에 올린다.
 * 파일 이름은 randomUUID 로 서버가 정한다 — 사용자가 보낸 이름을 그대로 쓰면
 * 경로 조작이나 남의 파일 덮어쓰기가 가능해진다.
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

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const storageLocation = String(formData.get("storageLocation") ?? "").trim();

  if (!title || !location || !storageLocation) {
    return NextResponse.json(
      { error: "물품 이름, 습득 장소, 보관 장소는 필수입니다." },
      { status: 400 },
    );
  }

  const tooLong =
    title.length > FIELD_LIMITS.title ||
    description.length > FIELD_LIMITS.description ||
    location.length > FIELD_LIMITS.location ||
    storageLocation.length > FIELD_LIMITS.storageLocation;

  if (tooLong) {
    return NextResponse.json({ error: "입력값이 너무 깁니다." }, { status: 400 });
  }

  const image = formData.get("image");
  const file = image instanceof File && image.size > 0 ? image : null;

  if (file) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "사진은 JPG · PNG · WebP 형식만 올릴 수 있습니다." },
        { status: 400 },
      );
    }
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { error: "사진 크기는 5MB 이하여야 합니다." },
        { status: 400 },
      );
    }
  }

  let imageUrl: string | null = null;
  if (file) {
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${Date.now()}-${randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET_LOST_FOUND)
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      console.error("lost-found upload failed:", uploadError);
      return NextResponse.json(
        { error: `사진을 올리지 못했습니다: ${uploadError.message}` },
        { status: 500 },
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET_LOST_FOUND).getPublicUrl(path);
    imageUrl = publicUrl;
  }

  const { error } = await supabase.from("lost_found_items").insert({
    title,
    description: description || null,
    location,
    storage_location: storageLocation,
    image_url: imageUrl,
  });

  if (error) {
    return NextResponse.json(
      { error: `등록하지 못했습니다: ${error.message}` },
      { status: 500 },
    );
  }

  revalidatePath("/lost-found");
  revalidatePath("/admin/lost-found");

  return NextResponse.json({ ok: true }, { status: 201 });
}
