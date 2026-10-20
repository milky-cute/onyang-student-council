import { ClockIcon, MapPinIcon } from "@/components/icons";
import { LOST_FOUND_PICKUP } from "@/lib/lost-found";

/**
 * 분실물 "찾으러 오는 법" 안내 카드.
 * 목록(/lost-found)과 공유 링크로 들어오는 상세 페이지(/lost-found/[id]) 맨 위에 쓴다.
 * place · hours 는 임원이 관리 화면에서 고치는 값(getPickupSettings)을 넘겨받는다.
 */
export function LostFoundPickupGuide({ place, hours }: { place: string; hours: string }) {
  return (
    <section aria-labelledby="pickup-guide-heading" className="card p-5">
      <h2 id="pickup-guide-heading" className="text-body font-bold text-slate-900">
        내 물건을 찾았다면?
      </h2>
      <dl className="mt-3 flex flex-col gap-2 rounded-control bg-brand-50 px-4 py-3 text-body-sm">
        <div className="flex items-start gap-2">
          <MapPinIcon className="mt-0.5 size-4 shrink-0 text-brand-700" />
          <dt className="w-24 shrink-0 text-slate-600">보관 장소</dt>
          <dd className="font-semibold text-slate-900">{place}</dd>
        </div>
        <div className="flex items-start gap-2">
          <ClockIcon className="mt-0.5 size-4 shrink-0 text-brand-700" />
          <dt className="w-24 shrink-0 text-slate-600">찾으러 오는 시간</dt>
          <dd className="font-semibold text-slate-900">{hours}</dd>
        </div>
      </dl>
      <p className="mt-3 text-caption text-slate-600">{LOST_FOUND_PICKUP.verifyNote}</p>
      <p className="mt-3 rounded-control bg-amber-50 px-4 py-3 text-body-sm font-semibold text-amber-900">
        물건을 주웠다면 학생회실로 가져다주세요
      </p>
    </section>
  );
}
