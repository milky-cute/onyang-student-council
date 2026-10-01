import Image from "next/image";
import Link from "next/link";

import { BoxIcon, CameraIcon, ChevronRightIcon } from "@/components/icons";

/** 공개 테이블(lost_found_items)의 공개 컬럼만. 비공개 정보는 홈에서 읽지 않는다. */
type RecentItem = { id: string; title: string; image_url: string | null; location: string };

/**
 * 홈 화면 분실물센터 카드. 오늘의 급식 카드 바로 아래(컴퓨터에서는 오른쪽)에 둔다.
 * count 가 null 이면 조회에 실패한 것 — 홈 전체를 깨지 않고 안내 문구만 보여준다.
 * 등록은 임원만 하므로 학생용 등록 · 신고 버튼은 두지 않는다.
 */
export function HomeLostFoundCard({
  count,
  items,
}: {
  count: number | null;
  items: RecentItem[];
}) {
  return (
    <section aria-labelledby="home-lost-found-heading" className="card flex flex-col p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <BoxIcon />
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
          <h2 id="home-lost-found-heading" className="text-lg font-bold text-slate-900">
            분실물센터
          </h2>
          {count !== null && count > 0 && (
            <span className="rounded-full bg-brand-700 px-2.5 py-0.5 text-xs font-semibold text-white">
              보관 중 {count}개
            </span>
          )}
        </div>
        <Link
          href="/lost-found"
          className="-mr-2 flex min-h-11 shrink-0 items-center gap-0.5 rounded-lg px-2 text-sm font-medium text-brand-700 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-700"
        >
          더보기
          <ChevronRightIcon className="size-4" />
        </Link>
      </div>

      {count === null ? (
        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
          잃어버린 물건이 있다면 분실물센터에서 확인해보세요.
        </p>
      ) : count === 0 || items.length === 0 ? (
        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
          지금 보관 중인 분실물이 없어요.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-3 gap-2.5">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/lost-found/${item.id}`}
                className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl bg-brand-50">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      fill
                      sizes="(min-width: 1024px) 170px, 30vw"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-1 text-brand-700">
                      <CameraIcon className="size-6" />
                      <span className="text-[11px] font-medium">사진 없음</span>
                    </div>
                  )}
                  <span className="absolute left-1.5 top-1.5 rounded-md bg-brand-700 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    보관 중
                  </span>
                </div>
                <p className="mt-1.5 truncate text-sm font-semibold text-slate-900">{item.title}</p>
                <p className="truncate text-xs text-slate-500">{item.location}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-4">
        <Link
          href="/lost-found"
          className="flex h-12 w-full items-center justify-center rounded-xl bg-brand-700 text-[15px] font-semibold text-white transition-colors hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
        >
          내 물건 찾아보기
        </Link>
        <p className="mt-2 text-center text-xs text-slate-500">물건을 주웠다면 학생회실로 가져다주세요</p>
      </div>
    </section>
  );
}
