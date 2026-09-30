import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { FIELD_LIMITS, STORAGE_BUCKET_LOST_FOUND } from "@/lib/lost-found";

import { requireOfficer } from "../require-officer";

type Params = { params: Promise<{ id: string }> };

/** image_url(공개 URL)에서 Storage 오브젝트 경로만 뽑아낸다. */
function pathFromPublicUrl(imageUrl: string): string | null {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET_LOST_FOUND}/`;
  const index = imageUrl.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(imageUrl.slice(index + marker.length));
}

/** 완료 표시(주인이 찾아감) 토글. 임원만 가능하다(RLS 이중 방어). */
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

  const { isResolved, claimedBy } = (body ?? {}) as Record<string, unknown>;
  if (typeof isResolved !== "boolean") {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }
  if (claimedBy !== undefined && typeof claimedBy !== "string") {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }
  // 받아간 사람은 선택 입력이다. 싼 물건까지 기록을 강제하지 않는다.
  const claimer = typeof claimedBy === "string" ? claimedBy.trim() : "";
  if (claimer.length > FIELD_LIMITS.claimedBy) {
    return NextResponse.json({ error: "입력값이 너무 깁니다." }, { status: 400 });
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
    return NextResponse.json({ error: "물품을 찾을 수 없습니다." }, { status: 404 });
  }

  // 수령 기록(lost_found_private). 완료할 때 이름을 적었으면 남기고, 완료를 해제하면 지운다.
  // 확인용 특징(private_note)은 건드리지 않는다 — upsert 는 보낸 컬럼만 갱신한다.
  let privateError = null;
  if (isResolved && claimer) {
    ({ error: privateError } = await supabase
      .from("lost_found_private")
      .upsert({ item_id: id, claimed_by: claimer, claimed_at: new Date().toISOString() }));
  } else if (!isResolved) {
    ({ error: privateError } = await supabase
      .from("lost_found_private")
      .update({ claimed_by: null, claimed_at: null })
      .eq("item_id", id));
  }

  revalidatePath("/lost-found");
  revalidatePath("/admin/lost-found");

  if (privateError) {
    return NextResponse.json(
      { error: `완료 상태는 바꿨지만 수령 기록을 저장하지 못했습니다: ${privateError.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

/** 습득물 삭제. 사진이 있으면 Storage 파일도 함께 지운다(임원만, RLS 이중 방어). */
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
    return NextResponse.json({ error: "물품을 찾을 수 없습니다." }, { status: 404 });
  }

  const { error: deleteError } = await supabase
    .from("lost_found_items")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json(
      { error: `삭제하지 못했습니다: ${deleteError.message}` },
      { status: 500 },
    );
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
