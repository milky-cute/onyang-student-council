import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { STORAGE_BUCKET_LOST_FOUND } from "@/lib/lost-found";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

/** image_url(공개 URL)에서 Storage 오브젝트 경로만 뽑아낸다. */
function pathFromPublicUrl(imageUrl: string): string | null {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET_LOST_FOUND}/`;
  const index = imageUrl.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(imageUrl.slice(index + marker.length));
}

/**
 * 로그인한 임원인지 확인한다.
 * 등록(POST)은 익명에게 열려 있지만 완료 처리·삭제는 임원만 가능하다.
 * RLS 로도 막히지만 애플리케이션에서 한 번 더 확인한다(이중 방어).
 */
async function requireOfficer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      supabase,
      error: NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 }),
    };
  }

  const { data: officer } = await supabase
    .from("officers")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (!officer) {
    return {
      supabase,
      error: NextResponse.json({ error: "임원만 이용할 수 있습니다." }, { status: 403 }),
    };
  }

  return { supabase, error: null };
}

/** 완료 처리(주인 찾음) 토글. */
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

  const { isResolved } = (body ?? {}) as Record<string, unknown>;
  if (typeof isResolved !== "boolean") {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("lost_found_items")
    .update({ is_resolved: isResolved })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "변경 중 문제가 발생했습니다." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "항목을 찾을 수 없습니다." }, { status: 404 });
  }

  revalidatePath("/lost-found");
  revalidatePath("/admin/lost-found");

  return NextResponse.json({ ok: true });
}

/** 항목 삭제. 사진이 있으면 Storage 파일도 함께 지운다. */
export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const { supabase, error: authError } = await requireOfficer();
  if (authError) return authError;

  const { data: item } = await supabase
    .from("lost_found_items")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();

  if (!item) {
    return NextResponse.json({ error: "항목을 찾을 수 없습니다." }, { status: 404 });
  }

  const { error: deleteError } = await supabase
    .from("lost_found_items")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: "삭제하지 못했습니다." }, { status: 500 });
  }

  // DB 행이 먼저 지워져야 하고, Storage 파일 삭제는 실패해도 목록에서는 이미
  // 사라진 상태라 에러로 취급하지 않는다(고아 파일만 남는 정도).
  if (item.image_url) {
    const path = pathFromPublicUrl(item.image_url);
    if (path) {
      await supabase.storage.from(STORAGE_BUCKET_LOST_FOUND).remove([path]);
    }
  }

  revalidatePath("/lost-found");
  revalidatePath("/admin/lost-found");

  return NextResponse.json({ ok: true });
}
