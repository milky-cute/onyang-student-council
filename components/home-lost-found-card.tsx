import Image from "next/image";
import Link from "next/link";

type Thumbnail = { id: string; title: string; image_url: string };

/**
 * 홈 화면 분실물센터 카드. 오늘의 급식 카드 바로 아래에 둔다.
 * count 가 null 이면 조회에 실패한 것 — 홈 전체를 깨지 않고 안내 문구만 보여준다.
 */
export function HomeLostFoundCard({
  count,
  thumbnails,
}: {
  count: number | null;
  thumbnails: Thumbnail[];
}) {
  return (
    <Link
      href="/lost-found"
      className="mt-4 block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md sm:p-6"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">분실물센터</h2>
        {count !== null && count > 0 && (
          <span className="text-sm font-semibold text-brand-700">보관 중 {count}개</span>
        )}
      </div>

      {count === null ? (
        <p className="mt-3 text-sm text-slate-600">잃어버린 물건이 있다면 분실물센터에서 확인해보세요.</p>
      ) : count === 0 ? (
        <p className="mt-3 text-sm text-slate-600">지금 보관 중인 분실물이 없어요.</p>
      ) : (
        <>
          {thumbnails.length > 0 && (
            <ul className="mt-4 grid grid-cols-3 gap-2">
              {thumbnails.map((item) => (
                <li
                  key={item.id}
                  className="relative aspect-square overflow-hidden rounded-md bg-slate-100"
                >
                  <Image
                    src={item.image_url}
                    alt={item.title}
                    fill
                    sizes="(min-width: 1024px) 140px, 33vw"
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-right text-xs font-medium text-brand-700">내 물건 찾아보기 →</p>
        </>
      )}
    </Link>
  );
}
