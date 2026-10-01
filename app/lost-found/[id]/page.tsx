import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cache } from "react";

import { BoxIcon, CalendarIcon, CameraIcon, ClockIcon, MapPinIcon } from "@/components/icons";
import { LostFoundPickupGuide } from "@/components/lost-found-pickup-guide";
import { PageHeader } from "@/components/page-header";
import { formatDate } from "@/lib/format-date";
import { retentionDeadline } from "@/lib/lost-found";
import { getPickupSettings } from "@/lib/lost-found-settings";
import { SITE } from "@/lib/site-config";
import { SITE_URL } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

/**
 * 공개 컬럼만 조회한다. 확인용 특징·수령 기록(lost_found_private)은 이 페이지에서 절대 읽지 않는다.
 * generateMetadata 와 페이지가 같은 요청에서 한 번만 조회하도록 cache 로 감싼다.
 */
const getItem = cache(async (id: string) => {
  const supabase = await createClient();
  // 형식이 잘못된 id 는 DB 가 오류를 돌려주고 data 가 null 이 되어 notFound 로 이어진다.
  const { data } = await supabase
    .from("lost_found_items")
    .select("id, title, description, location, storage_location, image_url, is_resolved, created_at")
    .eq("id", id)
    .maybeSingle();
  return data;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await getItem((await params).id);
  if (!item) return { title: "분실물" };

  const description = item.is_resolved
    ? "주인이 찾아간 물건이에요."
    : `${SITE.councilName} 분실물센터에서 보관 중이에요. 보관 장소: ${item.storage_location}`;

  // 단톡방에 링크를 올리면 물건 사진이 미리보기로 뜨게 한다. og 는 절대 URL 이어야 한다.
  return {
    title: `${item.title} — 분실물센터`,
    description,
    openGraph: {
      title: `${item.title} — 분실물센터`,
      description,
      url: `${SITE_URL}/lost-found/${item.id}`,
      siteName: SITE.fullName,
      images: item.image_url ? [{ url: item.image_url, alt: item.title }] : undefined,
    },
  };
}

export default async function LostFoundItemPage({ params }: Props) {
  const [item, pickup] = await Promise.all([getItem((await params).id), getPickupSettings()]);
  if (!item) notFound();

  return (
    <>
      <PageHeader
        title={item.title}
        description={
          item.is_resolved
            ? "주인이 찾아간 물건이에요."
            : `${SITE.councilName}가 보관 중인 분실물이에요.`
        }
        backHref="/lost-found"
      />

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 pt-3 pb-10 lg:pt-6 lg:pb-14">
        {!item.is_resolved && <LostFoundPickupGuide place={pickup.place} hours={pickup.hours} />}

        <article className="card overflow-hidden">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.title}
              width={1200}
              height={900}
              sizes="(min-width: 768px) 768px, 100vw"
              // 찾아간 물건은 목록과 같이 흑백 + 흐리게
              className={`h-auto w-full ${item.is_resolved ? "opacity-60 grayscale" : ""}`}
            />
          ) : (
            <div
              className={`flex aspect-[4/3] w-full flex-col items-center justify-center gap-1.5 ${
                item.is_resolved ? "bg-slate-100 text-slate-500" : "bg-brand-50 text-brand-700"
              }`}
            >
              <CameraIcon className="size-10" />
              <span className="text-sm font-medium">사진 없음</span>
            </div>
          )}

          <div className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">{item.title}</h2>
              {item.is_resolved ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  주인 찾음
                </span>
              ) : (
                <span className="rounded-full bg-brand-700 px-2.5 py-0.5 text-xs font-semibold text-white">
                  보관 중
                </span>
              )}
            </div>

            {item.description && (
              <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700">
                {item.description}
              </p>
            )}

            <dl className="mt-4 flex flex-col gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <div className="flex items-start gap-2">
                <MapPinIcon className="mt-0.5 size-4 shrink-0 text-slate-500" />
                <dt className="w-16 shrink-0 text-slate-500">주운 곳</dt>
                <dd className="text-slate-800">{item.location}</dd>
              </div>
              <div className="flex items-start gap-2">
                <BoxIcon className="mt-0.5 size-4 shrink-0 text-slate-500" />
                <dt className="w-16 shrink-0 text-slate-500">보관 장소</dt>
                <dd className="font-semibold text-brand-700">{item.storage_location}</dd>
              </div>
              <div className="flex items-start gap-2">
                <CalendarIcon className="mt-0.5 size-4 shrink-0 text-slate-500" />
                <dt className="w-16 shrink-0 text-slate-500">등록일</dt>
                <dd className="text-slate-800">
                  <time dateTime={item.created_at}>{formatDate(item.created_at)}</time>
                </dd>
              </div>
              {!item.is_resolved && (
                <div className="flex items-start gap-2">
                  <ClockIcon className="mt-0.5 size-4 shrink-0 text-slate-500" />
                  <dt className="w-16 shrink-0 text-slate-500">보관 기한</dt>
                  <dd className="font-medium text-slate-800">
                    {retentionDeadline(item.created_at).label}까지
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </article>
      </div>
    </>
  );
}
