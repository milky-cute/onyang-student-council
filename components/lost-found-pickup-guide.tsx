import { LOST_FOUND_PICKUP } from "@/lib/lost-found";

/**
 * 분실물 "찾으러 오는 법" 안내.
 * 목록(/lost-found)과 공유 링크로 들어오는 상세 페이지(/lost-found/[id]) 맨 위에 쓴다.
 * place · hours 는 임원이 관리 화면에서 고치는 값(getPickupSettings)을 넘겨받는다.
 */
export function LostFoundPickupGuide({ place, hours }: { place: string; hours: string }) {
  return (
    <div className="rounded-lg border border-brand-200 bg-brand-50 px-5 py-4">
      <p className="text-sm font-semibold text-slate-900">내 물건을 찾았다면</p>
      <dl className="mt-2 flex flex-col gap-1 text-sm text-slate-700">
        <div className="flex gap-2">
          <dt className="shrink-0 font-semibold text-brand-700">보관 장소</dt>
          <dd>{place}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 font-semibold text-brand-700">찾으러 올 수 있는 시간</dt>
          <dd>{hours}</dd>
        </div>
      </dl>
      <p className="mt-2 text-sm text-slate-600">{LOST_FOUND_PICKUP.verifyNote}</p>
      <p className="mt-1 text-xs text-slate-500">
        물건을 주웠다면 학생자치회로 가져다주세요. 대신 등록해 드립니다.
      </p>
    </div>
  );
}
