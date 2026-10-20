import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { CalendarIcon, CameraIcon, CheckCircleIcon, MapPinIcon } from "@/components/icons";
import { LostFoundPickupGuide } from "@/components/lost-found-pickup-guide";
import { PageHeader } from "@/components/page-header";
import { retentionDeadline } from "@/lib/lost-found";
import { getPickupSettings } from "@/lib/lost-found-settings";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "분실물센터",
};

export default async function LostFoundPage() {
  const supabase = await createClient();
  const [{ data: items }, pickup] = await Promise.all([
    // 공개 테이블(lost_found_items)만 조회한다. 찾아간 날짜 같은 비공개 정보는 읽지 않는다.
    supabase
      .from("lost_found_items")
      .select("id, title, location, image_url, is_resolved, created_at")
      // 아직 안 찾아간 물건이 위로, 그 안에서 최신순
      .order("is_resolved", { ascending: true })
      .order("created_at", { ascending: false }),
    getPickupSettings(),
  ]);

  const waiting = items?.filter((item) => !item.is_resolved).length ?? 0;
  const resolved = (items?.length ?? 0) - waiting;

  return (
    <>
      <PageHeader
        title="분실물센터"
        description="학생자치회가 보관 중인 물건입니다. 잃어버린 물건이 있는지 확인해보세요."
        backHref="/"
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pt-3 pb-10 lg:pt-6 lg:pb-14">
        <LostFoundPickupGuide place={pickup.place} hours={pickup.hours} />

        {!items || items.length === 0 ? (
          <div className="card px-6 py-14 text-center">
            <p className="text-card-title font-semibold text-slate-900">보관 중인 물건이 없습니다</p>
            <p className="mt-2 text-body-sm text-slate-600">분실물이 등록되면 이곳에서 확인할 수 있어요.</p>
          </div>
        ) : (
          <>
            <p className="flex flex-wrap items-center gap-2">
              <span className="badge badge-info gap-2">
                <span aria-hidden className="size-1.5 rounded-full bg-brand-700" />
                보관 중 {waiting}
              </span>
              <span className="badge badge-muted gap-2">
                <span aria-hidden className="size-1.5 rounded-full bg-slate-400" />
                주인 찾음 {resolved}
              </span>
            </p>

            {/* 사진만 훑어보고 내 물건을 찾을 수 있게 촘촘한 격자로 둔다. */}
            {/* 컴퓨터(1024px~)에서는 5열 — 본문 폭 1120px 에서도 사진 칸이 240px 를 넘지 않는다. */}
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/lost-found/${item.id}`}
                    className="card press flex h-full flex-col overflow-hidden hover:border-brand-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                  >
                    {/* 모든 카드가 같은 크기의 정사각형 사진 자리를 갖는다. */}
                    <div
                      className={`relative aspect-square w-full ${
                        item.is_resolved ? "bg-slate-100" : "bg-brand-50"
                      }`}
                    >
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={`${item.title} 사진`}
                          fill
                          sizes="(min-width: 1152px) 212px, (min-width: 1024px) calc((100vw - 96px) / 5), (min-width: 640px) calc((100vw - 56px) / 3), calc((100vw - 44px) / 2)"
                          // 찾아간 물건은 흑백 + 흐리게
                          className={`object-cover ${item.is_resolved ? "opacity-60 grayscale" : ""}`}
                        />
                      ) : (
                        // 찾아간 물건은 가운데 "찾아감" 배지만 보이도록 자리 표시 글자를 생략한다.
                        !item.is_resolved && (
                          <div className="flex h-full flex-col items-center justify-center gap-1 text-brand-700">
                            <CameraIcon className="size-7" />
                            <span className="text-caption font-semibold">사진 없음</span>
                          </div>
                        )
                      )}

                      {item.is_resolved ? (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="rounded-full bg-slate-900/75 px-3 py-1 text-caption font-semibold text-white">
                            찾아감
                          </span>
                        </span>
                      ) : (
                        <span className="badge badge-active absolute top-2 left-2">
                          보관 중
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-1 p-3">
                      <h2
                        className={`truncate text-body-sm font-semibold ${
                          item.is_resolved ? "text-slate-600 line-through" : "text-slate-900"
                        }`}
                      >
                        {item.title}
                      </h2>
                      <p className="flex items-center gap-1 text-caption text-slate-600">
                        <MapPinIcon className="size-3.5 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </p>
                      {item.is_resolved ? (
                        // 찾아간 날짜(claimed_at)는 비공개 정보라 보여주지 않는다.
                        <p className="flex items-center gap-1 text-caption font-semibold text-slate-600">
                          <CheckCircleIcon className="size-3.5 shrink-0" />
                          주인 찾음
                        </p>
                      ) : (
                        <p className="flex items-center gap-1 text-caption text-slate-600">
                          <CalendarIcon className="size-3.5 shrink-0" />
                          {retentionDeadline(item.created_at).shortLabel}까지 보관
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
