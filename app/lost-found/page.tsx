import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

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
    supabase
      .from("lost_found_items")
      .select("id, title, description, location, image_url, is_resolved, created_at")
      // 아직 안 찾아간 물건이 위로, 그 안에서 최신순
      .order("is_resolved", { ascending: true })
      .order("created_at", { ascending: false }),
    getPickupSettings(),
  ]);

  const waiting = items?.filter((item) => !item.is_resolved).length ?? 0;

  return (
    <>
      <PageHeader
        title="분실물센터"
        description="학생자치회가 보관 중인 물건입니다. 잃어버린 물건이 있는지 확인해보세요."
        backHref="/"
      />

      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
        <LostFoundPickupGuide place={pickup.place} hours={pickup.hours} />

        {!items || items.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
            <p className="text-lg font-semibold text-slate-900">
              보관 중인 물건이 없습니다
            </p>
            <p className="mt-2 text-sm text-slate-600">
              분실물이 등록되면 이곳에서 확인할 수 있어요.
            </p>
          </div>
        ) : (
          <>
            <p className="mt-8 text-sm text-slate-600">
              보관 중인 물건 {waiting}개
              {items.length > waiting && ` · 주인을 찾은 물건 ${items.length - waiting}개`}
            </p>

            {/* 사진만 훑어보고 내 물건을 찾을 수 있게 촘촘한 격자로 둔다. */}
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={
                    // 찾아간 물건도 목록에 남긴다 — 같은 물건을 또 문의하는 걸 줄이려는 목적.
                    item.is_resolved ? "opacity-50" : ""
                  }
                >
                  <Link
                    href={`/lost-found/${item.id}`}
                    className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition-colors hover:border-brand-300"
                  >
                    {/* 모든 카드가 같은 크기의 정사각형 사진 자리를 갖는다. */}
                    <div className="relative aspect-square w-full bg-slate-100">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.title}
                          fill
                          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-slate-400">
                          사진 없음
                        </div>
                      )}
                      {item.is_resolved && (
                        <span className="absolute left-2 top-2 rounded-full bg-slate-900/75 px-2.5 py-0.5 text-xs font-semibold text-white">
                          찾아감
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col p-3">
                      <h2 className="line-clamp-1 text-sm font-semibold text-slate-900">
                        {item.title}
                      </h2>
                      {item.description && (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-600">
                          {item.description}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-slate-500">주운 곳 {item.location}</p>
                      {!item.is_resolved && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {retentionDeadline(item.created_at).label}까지 보관
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
