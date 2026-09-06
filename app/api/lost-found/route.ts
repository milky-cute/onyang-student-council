import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  ALLOWED_IMAGE_TYPES,
  FIELD_LIMITS,
  MAX_IMAGE_SIZE,
  STORAGE_BUCKET_LOST_FOUND,
  isLostFoundType,
} from "@/lib/lost-found";
import { createClient } from "@/lib/supabase/server";

/**
 * 분실물 · 습득물 등록 (로그인 불필요).
 *
 * 이 사이트에서 비로그인 사용자가 사진까지 올릴 수 있는 유일한 경로라, 남용을
 * 막는 검증을 전부 여기서 한다. 브라우저에서 Storage 로 직접 올리지 않고 이
 * 라우트를 거치게 한 것도 같은 이유다(직접 업로드는 아래 검증을 우회한다).
 * Storage 버킷(0008)에도 같은 용량·MIME 제한이 걸려 있어 이중 방어가 된다.
 */
export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const type = String(formData.get("type") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const storageLocation = String(formData.get("storageLocation") ?? "").trim();
  const reporterName = String(formData.get("reporterName") ?? "").trim();
  const reporterClass = String(formData.get("reporterClass") ?? "").trim();

  if (!isLostFoundType(type)) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
  if (!title || !reporterName || !reporterClass) {
    return NextResponse.json(
      { error: "물품 설명, 이름, 학급은 필수입니다." },
      { status: 400 },
    );
  }
  // 습득물은 주운 장소 · 보관 장소가 있어야 주인이 찾아갈 수 있다(DB check 제약과 동일).
  if (type === "found" && (!location || !storageLocation)) {
    return NextResponse.json(
      { error: "주운 장소와 보관 장소를 입력해주세요." },
      { status: 400 },
    );
  }

  const tooLong =
    title.length > FIELD_LIMITS.title ||
    description.length > FIELD_LIMITS.description ||
    location.length > FIELD_LIMITS.location ||
    storageLocation.length > FIELD_LIMITS.storageLocation ||
    reporterName.length > FIELD_LIMITS.reporterName ||
    reporterClass.length > FIELD_LIMITS.reporterClass;

  if (tooLong) {
    return NextResponse.json({ error: "입력값이 너무 깁니다." }, { status: 400 });
  }

  // 사진은 선택. 여러 장 보내도 첫 장만 받는다.
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

  const supabase = await createClient();

  let imageUrl: string | null = null;
  if (file) {
    // 파일 이름은 서버가 정한다 — 사용자가 보낸 이름을 쓰면 경로 조작이나
    // 남의 파일 덮어쓰기가 가능해진다.
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${type}/${Date.now()}-${randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET_LOST_FOUND)
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      console.error("lost-found upload failed:", uploadError);
      return NextResponse.json(
        { error: "사진을 올리지 못했습니다. 잠시 후 다시 시도해주세요." },
        { status: 500 },
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(STORAGE_BUCKET_LOST_FOUND).getPublicUrl(path);
    imageUrl = publicUrl;
  }

  const { error } = await supabase.from("lost_found_items").insert({
    type,
    title,
    description: description || null,
    location: location || null,
    storage_location: type === "found" ? storageLocation : null,
    image_url: imageUrl,
    reporter_name: reporterName,
    reporter_class: reporterClass,
  });

  if (error) {
    return NextResponse.json(
      { error: "등록 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }

  revalidatePath("/lost-found");
  revalidatePath("/admin/lost-found");

  return NextResponse.json({ ok: true }, { status: 201 });
}
