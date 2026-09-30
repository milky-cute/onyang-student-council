import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { LostFoundPickupGuide } from "@/components/lost-found-pickup-guide";
import { PageHeader } from "@/components/page-header";
import { formatDate } from "@/lib/format-date";
import { retentionDeadline } from "@/lib/lost-found";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "분실물센터",
};

export default async function LostFoundPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("lost_found_items")
    .select("id, title, description, location, storage_location, image_url, is_resolved, created_at")
    // 아직 안 찾아간 물건이 위로, 그 안에서 최신순
    .order("is_resolved", { ascending: true })
    .order("created_at", { ascending: false });

  const waiting = items?.filter((item) => !item.is_resolved).length ?? 0;

  return (
    <>
      <PageHeader
        title="분실물센터"
        description="학생자치회가 보관 중인 물건입니다. 잃어버린 물건이 있는지 확인해보세요."
        backHref="/"
      />

      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
        <LostFoundPickupGuide />

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

            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                    {item.image_url && (
                      <div className="relative aspect-[4/3] w-full bg-slate-100">
                        <Image
                          src={item.image_url}
                          alt={item.title}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover"
                        />
                      </div>
                    )}

                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-semibold text-slate-900">
                          {item.title}
                        </h2>
                        {item.is_resolved && (
                          <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                            찾아감
                          </span>
                        )}
                      </div>

                      {item.description && (
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                          {item.description}
                        </p>
                      )}

                      <dl className="mt-3 flex flex-col gap-1 text-sm">
                        <div className="flex gap-2">
                          <dt className="shrink-0 text-slate-500">주운 곳</dt>
                          <dd className="text-slate-700">{item.location}</dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="shrink-0 text-slate-500">보관 장소</dt>
                          <dd className="font-semibold text-brand-700">
                            {item.storage_location}
                          </dd>
                        </div>
                      </dl>

                      <p className="mt-4 text-xs text-slate-500">
                        <time dateTime={item.created_at}>{formatDate(item.created_at)} 등록</time>
                        {!item.is_resolved &&
                          ` · ${retentionDeadline(item.created_at).label}까지 보관`}
                      </p>
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
