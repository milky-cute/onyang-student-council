import Link from "next/link";

import { HomeLostFoundCard } from "@/components/home-lost-found-card";
import { HomeProjectsCard, type HomeProject } from "@/components/home-projects-card";
import { HomeWeekCard } from "@/components/home-schedule-cards";
import { ChevronRightIcon, InstagramIcon, MapPinIcon, ClockIcon, NAV_ICONS } from "@/components/icons";
import { SectionHeader } from "@/components/section-header";
import { TodayMealCard } from "@/components/today-meal-card";
import { dateLabel, homeWeekKeys, seoulToday } from "@/lib/calendar-utils";
import { getPickupSettings } from "@/lib/lost-found-settings";
import { getMeal } from "@/lib/meal";
import { sortForHome } from "@/lib/projects";
import { NAV_ITEMS, SITE } from "@/lib/site-config";
import { createClient } from "@/lib/supabase/server";

/** "학생자치회 서비스" 목록에서 빼는 메뉴 — 하단 탭(사업 · 분실물 · 일정)과 홈 카드가 이미 링크한다. */
const TAB_HREFS = ["/projects", "/lost-found", "/calendar"];
const SERVICE_ITEMS = NAV_ITEMS.filter((item) => !TAB_HREFS.includes(item.href));

export default async function HomePage() {
  const supabase = await createClient();

  // 한국 시간 기준 오늘. 날짜 칩 · 급식 · 사업 · D-day · 이번 주 일정이 모두 이 값을 쓴다
  // (서버가 UTC 라 new Date() 를 쓰면 한국 시간 0~9시에 하루 밀린다).
  const today = seoulToday();
  // 주말에는 다음 주 월~금
  const { keys: weekKeys, isNextWeek } = homeWeekKeys(today.dateKey);

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
    { data: allProjects },
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
    // 최신순으로 받아 두고, 고르기 · 정렬은 날짜로 계산하는 sortForHome 이 한다.
    supabase
      .from("projects")
      .select(
        "id, title, summary, description, is_always, start_date, end_date, apply_start, apply_end, is_pinned, created_at",
      )
      .order("created_at", { ascending: false }),
  ]);

  // 고정 → 신청 중(마감 가까운 순) → 진행중(종료 가까운 순) 최대 3개, 없으면 상시 사업.
  // 조회에 실패하면 빈 목록.
  const picked = sortForHome(allProjects ?? [], today.dateKey);

  // 고른 사업의 대표 사진(sort_order 가 가장 작은 것)만 따로 가져온다.
  const { data: photos } = picked.length
    ? await supabase
        .from("project_photos")
        .select("project_id, image_url")
        .in(
          "project_id",
          picked.map((p) => p.id),
        )
        .order("sort_order", { ascending: true })
    : { data: [] };
  const homeProjects: HomeProject[] = picked.map((p) => ({
    ...p,
    image_url: photos?.find((photo) => photo.project_id === p.id)?.image_url ?? null,
  }));

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pt-5 pb-8 lg:gap-6 lg:pt-8">
      {/* 맨 위: 오늘 날짜 + 한 줄 문구. 학생자치회 이름은 헤더에 있으니 h1 은 화면 읽기 프로그램용으로만 둔다. */}
      <div>
        <h1 className="sr-only">{SITE.shortName}</h1>
        <p className="text-title font-bold text-slate-900">
          <time dateTime={today.dateKey}>{dateLabel(today.dateKey)}</time>
        </p>
        <p className="mt-1 text-body-sm text-slate-600 lg:text-body">{SITE.tagline}</p>
      </div>

      {/*
        중요도 순: 급식 → 학생회 사업 → 분실물센터 → 일정. 휴대폰에서는 이 순서로 한 줄씩.
        컴퓨터에서는 5칸 격자의 3:2 — 급식 | 사업, 분실물 | 일정, 서비스 | 학생회실 안내.
      */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:gap-6">
        <div className="lg:col-span-3">
          <TodayMealCard meal={meal} />
        </div>
        <div className="lg:col-span-2">
          <HomeProjectsCard projects={homeProjects} todayKey={today.dateKey} />
        </div>
        <div className="lg:col-span-3">
          <HomeLostFoundCard
            count={lostFoundError ? null : (lostFoundCount ?? 0)}
            items={recentLostItems ?? []}
          />
        </div>
        <div className="lg:col-span-2">
          <HomeWeekCard
            weekKeys={weekKeys}
            isNextWeek={isNextWeek}
            todayKey={today.dateKey}
            dday={ddayEvent}
            weekEvents={weekEvents ?? []}
            upcoming={upcoming ?? []}
          />
        </div>

        {/* 학생자치회 서비스 — 하단 탭에 없는 메뉴만 가벼운 목록으로 */}
        <section aria-labelledby="home-services-heading" className="card p-5 lg:col-span-3">
          <SectionHeader id="home-services-heading" title="학생자치회 서비스" />
          <ul className="mt-2 flex flex-col divide-y divide-slate-100">
            {SERVICE_ITEMS.map((item) => {
              const Icon = NAV_ICONS[item.href];
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="-mx-2 flex min-h-16 items-center gap-3 rounded-control px-2 py-3 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-brand-700"
                  >
                    <span className="icon-tile">{Icon && <Icon />}</span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-body font-semibold text-slate-900">{item.label}</span>
                      <span className="text-body-sm text-slate-600">{item.shortDescription}</span>
                    </span>
                    <ChevronRightIcon className="size-5 shrink-0 text-slate-400" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 학생회실 안내 — 값은 임원이 관리 화면에서 고치는 "찾으러 오는 법" 설정 */}
        <section aria-labelledby="home-office-heading" className="card self-start p-5 lg:col-span-2">
          <SectionHeader id="home-office-heading" title="학생회실 안내" />
          <dl className="mt-3 flex flex-col gap-2 text-body-sm">
            <div className="flex items-start gap-2">
              <MapPinIcon className="mt-0.5 size-4 shrink-0 text-brand-700" />
              <dt className="w-16 shrink-0 text-slate-600">위치</dt>
              <dd className="font-semibold text-slate-900">{pickup.place}</dd>
            </div>
            <div className="flex items-start gap-2">
              <ClockIcon className="mt-0.5 size-4 shrink-0 text-brand-700" />
              <dt className="w-16 shrink-0 text-slate-600">운영 시간</dt>
              <dd className="font-semibold text-slate-900">{pickup.hours}</dd>
            </div>
          </dl>
          <a
            href="https://www.instagram.com/onyang_high_official/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex min-h-11 items-center gap-2 rounded-control bg-slate-50 px-3 text-body-sm text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-brand-700"
          >
            <InstagramIcon className="size-5 shrink-0 text-slate-700" />
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
