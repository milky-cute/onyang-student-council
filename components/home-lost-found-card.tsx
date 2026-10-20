import Image from "next/image";
import Link from "next/link";

import { BoxIcon, CameraIcon } from "@/components/icons";
import { SectionHeader } from "@/components/section-header";

/** 공개 테이블(lost_found_items)의 공개 컬럼만. 비공개 정보는 홈에서 읽지 않는다. */
type RecentItem = { id: string; title: string; image_url: string | null; location: string };

/**
 * 홈 화면 분실물센터 카드. 학생회 사업 카드 아래(컴퓨터에서는 이번 주 일정 왼쪽)에 둔다.
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
    <section aria-labelledby="home-lost-found-heading" className="card flex h-full flex-col p-5">
      <SectionHeader
        id="home-lost-found-heading"
        title="분실물센터"
        icon={<BoxIcon />}
        action={{ href: "/lost-found", label: "전체 보기" }}
      >
        {count !== null && count > 0 && <span className="badge badge-ok">보관 중 {count}개</span>}
      </SectionHeader>

      {count === null ? (
        <p className="mt-4 rounded-control bg-slate-50 px-4 py-6 text-center text-body-sm text-slate-600">
          잃어버린 물건이 있다면 분실물센터에서 확인해보세요.
        </p>
      ) : count === 0 || items.length === 0 ? (
        <p className="mt-4 rounded-control bg-slate-50 px-4 py-6 text-center text-body-sm text-slate-600">
          지금 보관 중인 분실물이 없어요.
        </p>
      ) : (
        // 컴퓨터에서 사진이 너무 커지지 않게 한 칸 최대 240px
        <ul className="mt-4 grid grid-cols-3 gap-3 lg:grid-cols-[repeat(3,minmax(0,240px))]">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/lost-found/${item.id}`}
                className="group block rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
              >
                <div className="relative aspect-square overflow-hidden rounded-control bg-brand-50">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      fill
                      sizes="(min-width: 1024px) 240px, 30vw"
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-1 text-brand-700">
                      <CameraIcon className="size-6" />
                      <span className="text-caption">사진 없음</span>
                    </div>
                  )}
                </div>
                <p className="mt-2 truncate text-body-sm font-semibold text-slate-900">{item.title}</p>
                <p className="truncate text-caption text-slate-600">{item.location}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto pt-4">
        <Link href="/lost-found" className="btn btn-primary h-12 w-full">
          내 물건 찾아보기
        </Link>
        <p className="mt-2 text-center text-caption text-slate-600">물건을 주웠다면 학생회실로 가져다주세요</p>
      </div>
    </section>
  );
}
