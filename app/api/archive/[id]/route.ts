import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

import { STORAGE_BUCKET } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

/** image_url(공개 URL)에서 Storage 오브젝트 경로만 뽑아낸다. */
function pathFromPublicUrl(imageUrl: string): string | null {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const index = imageUrl.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(imageUrl.slice(index + marker.length));
}

/** 사진 한 장 삭제. Storage 파일과 DB 행 모두 지운다(임원만, RLS 이중 방어). */
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
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
    return NextResponse.json({ error: "임원만 사진을 삭제할 수 있습니다." }, { status: 403 });
  }

  const { data: photo, error: fetchError } = await supabase
    .from("archive_photos")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !photo) {
    return NextResponse.json({ error: "사진을 찾을 수 없습니다." }, { status: 404 });
  }

  const { error: deleteError } = await supabase.from("archive_photos").delete().eq("id", id);

  if (deleteError) {
    return NextResponse.json(
      { error: `삭제하지 못했습니다: ${deleteError.message}` },
      { status: 500 },
    );
  }

  // DB 행 삭제가 먼저 성공해야 하고, Storage 파일 삭제는 실패해도 사용자 입장에서는
  // 이미 목록에서 사라진 상태이므로 에러로 취급하지 않는다(고아 파일만 남는 정도).
  const path = pathFromPublicUrl(photo.image_url);
  if (path) {
    await supabase.storage.from(STORAGE_BUCKET).remove([path]);
  }

  // /archive 와 앨범 페이지가 캐시된 사진 목록을 쓰므로 삭제 즉시 갱신한다.
  // expire: 0 — 지운 사진이 남아 보이지 않도록 다음 요청에서 바로 새로 조회하게 한다.
  revalidateTag("archive", { expire: 0 });

  return NextResponse.json({ ok: true });
}
