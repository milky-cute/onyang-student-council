import Link from "next/link";

import { HomeLostFoundCard } from "@/components/home-lost-found-card";
import { HomeDdayCard, HomeWeekCard } from "@/components/home-schedule-cards";
import { InstagramIcon, MapPinIcon, ClockIcon, NAV_ICONS } from "@/components/icons";
import { TodayMealCard } from "@/components/today-meal-card";
import { dateLabel, seoulToday, weekdayKeys } from "@/lib/calendar-utils";
import { getPickupSettings } from "@/lib/lost-found-settings";
import { getMeal } from "@/lib/meal";
import { NAV_ITEMS, SITE } from "@/lib/site-config";
import { createClient } from "@/lib/supabase/server";

/** "학생자치회 서비스" 타일의 파스텔 아이콘 배경 */
const TILE_COLORS: Record<string, string> = {
  "/lost-found": "bg-blue-50 text-blue-700",
  "/board": "bg-indigo-50 text-indigo-700",
  "/monthly": "bg-amber-50 text-amber-700",
  "/archive": "bg-emerald-50 text-emerald-700",
  "/requests": "bg-rose-50 text-rose-700",
  "/calendar": "bg-sky-50 text-sky-700",
};

export default async function HomePage() {
  const supabase = await createClient();

  // 한국 시간 기준 오늘. 날짜 칩 · 급식 · D-day · 이번 주 일정이 모두 이 값을 쓴다
  // (서버가 UTC 라 new Date() 를 쓰면 한국 시간 0~9시에 하루 밀린다).
  const today = seoulToday();
  const weekKeys = weekdayKeys(today.dateKey);

  // 서로 의존하지 않는 조회라 한 번에 보낸다 (직렬로 기다리면 왕복이 여러 번).
  // 급식 조회와 Supabase 조회는 실패해도 throw 대신 결과로 알려주므로 홈 전체가 깨지지 않는다.
  const [
    { data: weekEvents },
    { data: ddayEvent },
    { data: upcoming },
    meal,
    { count: lostFoundCount, error: lostFoundError },
    { data: recentLostItems },
    pickup,
  ] = await Promise.all([
    supabase
      .from("calendar_events")
      .select("event_date, color")
      .gte("event_date", weekKeys[0])
      .lte("event_date", weekKeys[4]),
    supabase
      .from("calendar_events")
      .select("title, event_date")
      .eq("is_dday", true)
      .gte("event_date", today.dateKey)
      .order("event_date", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("calendar_events")
      .select("id, title, event_date")
      .gte("event_date", today.dateKey)
      .order("event_date", { ascending: true })
      .limit(2),
    getMeal(today.dateKey),
    // 분실물은 공개 테이블(lost_found_items)의 공개 컬럼만 조회한다. 비공개 정보는 홈에서 읽지 않는다.
    supabase
      .from("lost_found_items")
      .select("id", { count: "exact", head: true })
      .eq("is_resolved", false),
    supabase
      .from("lost_found_items")
      .select("id, title, image_url, location")
      .eq("is_resolved", false)
      .order("created_at", { ascending: false })
      .limit(3),
    getPickupSettings(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pt-5 pb-8 lg:gap-6 lg:pt-10 lg:pb-14">
      {/* 짧은 소개 */}
      <section className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 lg:text-3xl">{SITE.shortName}</h1>
          <p className="mt-1 text-sm text-slate-600 lg:text-base">{SITE.tagline}</p>
        </div>
        <p className="mt-1 shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
          <time dateTime={today.dateKey}>{dateLabel(today.dateKey)}</time>
        </p>
      </section>

      {/* 1행: 매일 들어오는 이유인 급식, 주력 기능인 분실물센터 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <TodayMealCard dateKey={today.dateKey} meal={meal} />
        <HomeLostFoundCard
          count={lostFoundError ? null : (lostFoundCount ?? 0)}
          items={recentLostItems ?? []}
        />
      </div>

      {/* 2행: D-day + 이번 주 일정. D-day 가 없으면 이번 주 일정이 가로 전체를 쓴다. */}
      <div className="grid grid-cols-2 gap-3 lg:gap-6">
        {ddayEvent && <HomeDdayCard event={ddayEvent} todayKey={today.dateKey} />}
        <div className={ddayEvent ? "" : "col-span-2"}>
          <HomeWeekCard
            weekKeys={weekKeys}
            todayKey={today.dateKey}
            weekEvents={weekEvents ?? []}
            upcoming={upcoming ?? []}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:mt-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-6">
        {/* 학생자치회 서비스 */}
        <section aria-labelledby="home-services-heading">
          <h2 id="home-services-heading" className="text-lg font-bold text-slate-900">
            학생자치회 서비스
          </h2>
          <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-3">
            {NAV_ITEMS.map((item) => {
              const Icon = NAV_ICONS[item.href];
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="card flex h-full flex-col gap-3 p-4 transition-colors hover:border-brand-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                  >
                    <span
                      className={`flex size-10 items-center justify-center rounded-xl ${TILE_COLORS[item.href] ?? "bg-slate-50 text-slate-700"}`}
                    >
                      {Icon && <Icon />}
                    </span>
                    <span>
                      <span className="block text-[15px] font-semibold text-slate-900">
                        {item.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {item.shortDescription}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 학생회실 안내 — 값은 임원이 관리 화면에서 고치는 "찾으러 오는 법" 설정 */}
        <section
          aria-labelledby="home-office-heading"
          className="card self-start p-5 lg:mt-10"
        >
          <h2 id="home-office-heading" className="text-base font-bold text-slate-900">
            학생회실 안내
          </h2>
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <div className="flex items-start gap-2">
              <MapPinIcon className="mt-0.5 size-4 shrink-0 text-brand-700" />
              <dt className="w-16 shrink-0 text-slate-500">위치</dt>
              <dd className="font-medium text-slate-900">{pickup.place}</dd>
            </div>
            <div className="flex items-start gap-2">
              <ClockIcon className="mt-0.5 size-4 shrink-0 text-brand-700" />
              <dt className="w-16 shrink-0 text-slate-500">운영 시간</dt>
              <dd className="font-medium text-slate-900">{pickup.hours}</dd>
            </div>
          </dl>
          <a
            href="https://www.instagram.com/onyang_high_official/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex min-h-11 items-center gap-2 rounded-xl bg-slate-50 px-3 text-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-brand-700"
          >
            <InstagramIcon className="size-5 shrink-0 text-rose-600" />
            <span>
              온양고 공식 인스타그램{" "}
              <span className="font-semibold text-slate-900">@onyang_high_official</span>
            </span>
          </a>
        </section>
      </div>
    </div>
  );
}
