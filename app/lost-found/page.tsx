import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { formatDate } from "@/lib/format-date";
import { TYPE_LABELS, isLostFoundType, type LostFoundTypeValue } from "@/lib/lost-found";
import { createClient } from "@/lib/supabase/server";

import { LostFoundForm } from "./lost-found-form";

export const metadata: Metadata = {
  title: "분실물센터",
};

const TABS: { value: LostFoundTypeValue; label: string; hint: string }[] = [
  { value: "found", label: "습득물", hint: "누군가 주워서 보관 중인 물건이에요." },
  { value: "lost", label: "분실물", hint: "친구가 잃어버린 물건이에요. 보셨다면 알려주세요." },
];

export default async function LostFoundPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const requested = (await searchParams).type;
  const activeType: LostFoundTypeValue = isLostFoundType(requested) ? requested : "found";

  const supabase = await createClient();
  const { data: items } = await supabase
    .from("lost_found_items")
    .select(
      "id, type, title, description, location, storage_location, image_url, reporter_name, reporter_class, is_resolved, created_at",
    )
    .eq("type", activeType)
    // 아직 주인을 못 찾은 항목이 위로 오고, 그 안에서 최신순
    .order("is_resolved", { ascending: true })
    .order("created_at", { ascending: false });

  const activeTab = TABS.find((tab) => tab.value === activeType);

  return (
    <>
      <PageHeader
        title="분실물센터"
        description="주운 물건과 잃어버린 물건을 등록하고 주인을 찾아보세요."
        backHref="/"
      />

      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:py-14">
        {/* 습득물 / 분실물 탭 */}
        <nav aria-label="분실물 종류" className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const isActive = tab.value === activeType;
            return (
              <Link
                key={tab.value}
                href={tab.value === "found" ? "/lost-found" : `/lost-found?type=${tab.value}`}
                aria-current={isActive ? "true" : undefined}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-700 text-white"
                    : "border border-slate-300 text-slate-600 hover:border-brand-300 hover:text-brand-700"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <p className="mt-3 text-sm text-slate-600">{activeTab?.hint}</p>

        <div className="mt-8">
          <h2 className="text-lg font-bold text-slate-900">
            {TYPE_LABELS[activeType]} 등록하기
          </h2>
          <p className="mb-4 mt-1 text-sm text-slate-600">
            로그인 없이 등록할 수 있어요.
          </p>
          <LostFoundForm key={activeType} type={activeType} />
        </div>

        <div className="mt-14 border-t border-slate-200 pt-10">
          <h2 className="text-lg font-bold text-slate-900">
            등록된 {TYPE_LABELS[activeType]}
          </h2>

          {!items || items.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">
              아직 등록된 {TYPE_LABELS[activeType]}이 없습니다.
            </p>
          ) : (
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={`flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white ${
                    // 해결된 항목은 흐리게 — 목록에서 빼지 않는 이유는 주인이
                    // "이미 찾아갔구나"를 확인할 수 있어야 하기 때문이다.
                    item.is_resolved ? "opacity-60" : ""
                  }`}
                >
                  {item.image_url && (
                    <div className="relative aspect-[4/3] w-full bg-slate-100">
                      <Image
                        src={item.image_url}
                        alt={item.title}
                        fill
                        sizes="(min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                        {TYPE_LABELS[item.type]}
                      </span>
                      {item.is_resolved && (
                        <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
                          {item.type === "found" ? "주인 찾음" : "물건 찾음"}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 text-base font-semibold text-slate-900">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                        {item.description}
                      </p>
                    )}

                    <dl className="mt-3 flex flex-col gap-1 text-sm text-slate-600">
                      {item.location && (
                        <div className="flex gap-2">
                          <dt className="shrink-0 text-slate-500">
                            {item.type === "found" ? "주운 곳" : "잃어버린 곳"}
                          </dt>
                          <dd>{item.location}</dd>
                        </div>
                      )}
                      {item.storage_location && (
                        <div className="flex gap-2">
                          <dt className="shrink-0 text-slate-500">보관 중</dt>
                          <dd className="font-medium text-slate-900">
                            {item.storage_location}
                          </dd>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <dt className="shrink-0 text-slate-500">등록</dt>
                        <dd>
                          {item.reporter_name} · {item.reporter_class}
                        </dd>
                      </div>
                    </dl>

                    <time
                      dateTime={item.created_at}
                      className="mt-4 text-xs text-slate-500"
                    >
                      {formatDate(item.created_at)}
                    </time>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
