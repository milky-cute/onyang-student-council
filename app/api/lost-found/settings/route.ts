import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { FIELD_LIMITS } from "@/lib/lost-found";

import { requireOfficer } from "../require-officer";

/**
 * "찾으러 오는 법"의 보관 장소 · 시간 수정. 임원만 가능하다(RLS + 여기서 한 번 더 확인).
 * lost_found_settings 는 행이 id = 1 하나뿐이라 그 행만 갱신한다.
 */
export async function PATCH(request: Request) {
  const { supabase, error: authError } = await requireOfficer();
  if (authError) return authError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { pickupPlace, pickupHours } = (body ?? {}) as Record<string, unknown>;
  if (typeof pickupPlace !== "string" || typeof pickupHours !== "string") {
    return NextResponse.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }

  const place = pickupPlace.trim();
  const hours = pickupHours.trim();

  if (!place || !hours) {
    return NextResponse.json(
      { error: "보관 장소와 찾으러 올 수 있는 시간을 입력해주세요." },
      { status: 400 },
    );
  }
  if (place.length > FIELD_LIMITS.pickupPlace) {
    return NextResponse.json(
      { error: `보관 장소는 ${FIELD_LIMITS.pickupPlace}자 이내로 입력해주세요.` },
      { status: 400 },
    );
  }
  if (hours.length > FIELD_LIMITS.pickupHours) {
    return NextResponse.json(
      { error: `찾으러 올 수 있는 시간은 ${FIELD_LIMITS.pickupHours}자 이내로 입력해주세요.` },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("lost_found_settings")
    .update({ pickup_place: place, pickup_hours: hours, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: `저장하지 못했습니다: ${error.message}` }, { status: 500 });
  }
  if (!data) {
    // 초기 행이 없다 = 0012 마이그레이션을 아직 실행하지 않은 상태
    return NextResponse.json(
      { error: "설정 행이 없습니다. 0012 마이그레이션을 먼저 실행해주세요." },
      { status: 404 },
    );
  }

  // 홈 · 목록 · 상세 모두 새 값을 보여주도록 전체를 갱신한다.
  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true });
}
