import { LOST_FOUND_PICKUP } from "@/lib/lost-found";
import { createClient } from "@/lib/supabase/server";

/**
 * 분실물 "찾으러 오는 법"의 보관 장소 · 시간 (서버 전용).
 *
 * lib/lost-found.ts 는 클라이언트 컴포넌트도 가져다 쓰므로, 서버 Supabase 클라이언트가
 * 필요한 이 함수는 파일을 따로 둔다.
 * 테이블이 아직 없거나(마이그레이션 전) 조회에 실패하면 LOST_FOUND_PICKUP 상수로 대신한다.
 */
export async function getPickupSettings() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lost_found_settings")
    .select("pickup_place, pickup_hours")
    .eq("id", 1)
    .maybeSingle();

  return {
    place: data?.pickup_place ?? LOST_FOUND_PICKUP.place,
    hours: data?.pickup_hours ?? LOST_FOUND_PICKUP.hours,
  };
}
