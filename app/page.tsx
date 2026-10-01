import Link from "next/link";

import { HomeCalendarWidget } from "@/components/home-calendar-widget";
import { HomeLostFoundCard } from "@/components/home-lost-found-card";
import { TodayMealCard } from "@/components/today-meal-card";
import { diffDays, monthRange, seoulToday } from "@/lib/calendar-utils";
import { getMeal } from "@/lib/meal";
import { NAV_ITEMS, SITE } from "@/lib/site-config";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();

  // 한국 시간 기준 오늘. 달력 위젯과 위젯용 일정 조회 범위가 모두 이 값을 쓴다
  // (서버가 UTC 라 new Date() 를 쓰면 한국 시간 매달 1일 0~9시에 지난달이 된다).
  const today = seoulToday();
  const { start: monthStart, end: monthEnd } = monthRange(today.year, today.month);

  // 서로 의존하지 않는 조회라 한 번에 보낸다 (직렬로 기다리면 왕복이 여러 번).
  // 급식 조회는 실패해도 예외 없이 status: "error" 를 돌려주므로 여기서 같이 기다려도 안전하다.
  // Supabase 조회도 실패하면 throw 대신 error 를 돌려준다(분실물 카드는 그때 안내 문구만 보여준다).
  const [
    { data: events },
    { data: ddayEvent },
    meal,
    { count: lostFoundCount, error: lostFoundError },
    { data: lostFoundThumbs },
  ] = await Promise.all([
    supabase
      .from("calendar_events")
      .select("id, title, event_date, color")
      .gte("event_date", monthStart)
      .lte("event_date", monthEnd),
    supabase
      .from("calendar_events")
      .select("id, title, event_date")
      .eq("is_dday", true)
      .gte("event_date", today.dateKey)
      .order("event_date", { ascending: true })
      .limit(1)
      .maybeSingle(),
    getMeal(today.dateKey),
    // 분실물은 공개 테이블(lost_found_items)만 조회한다. 비공개 정보는 홈에서 읽지 않는다.
    supabase
      .from("lost_found_items")
      .select("id", { count: "exact", head: true })
      .eq("is_resolved", false),
    supabase
      .from("lost_found_items")
      .select("id, title, image_url")
      .eq("is_resolved", false)
      .not("image_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const ddayCount = ddayEvent ? diffDays(ddayEvent.event_date, today.dateKey) : 0;

  return (
    <>
      {/* 히어로 */}
      <section className="border-b border-slate-200 bg-brand-50">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:py-16 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-700">
              {SITE.schoolName} {SITE.councilName}
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
              학생의 목소리가
              <br className="sm:hidden" /> 학교를 바꿉니다
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600">
              {SITE.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/board"
                className="rounded-md bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
              >
                학생자치회 게시판 보기
              </Link>
              <Link
                href="/requests"
                className="rounded-md border border-brand-700 bg-white px-5 py-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
              >
                요구사항 남기기
              </Link>
            </div>
          </div>

          {/* 급식은 학생들이 매일 찾는 정보라 첫 화면(D-day 바로 아래)에 둔다. */}
          <div className="w-full lg:max-w-md lg:shrink-0">
            {ddayEvent && (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
                <span className="text-sm font-semibold text-amber-900">{ddayEvent.title}</span>
                <span className="text-2xl font-extrabold text-amber-600">
                  {ddayCount === 0 ? "D-DAY" : `D-${ddayCount}`}
                </span>
              </div>
            )}
            <TodayMealCard dateKey={today.dateKey} meal={meal} />
            <HomeLostFoundCard
              count={lostFoundError ? null : (lostFoundCount ?? 0)}
              thumbnails={(lostFoundThumbs ?? []).flatMap((item) =>
                item.image_url ? [{ id: item.id, title: item.title, image_url: item.image_url }] : [],
              )}
            />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
          {/* 이번 달 일정 — 모바일에서는 둘러보기보다 먼저, 데스크톱에서는 오른쪽 */}
          <div className="lg:order-last">
            <h2 className="text-xl font-bold text-slate-900">이번 달 일정</h2>
            <div className="mt-6">
              <HomeCalendarWidget events={events ?? []} today={today} />
            </div>
          </div>

          {/* 메뉴 카드 */}
          <div>
            <h2 className="text-xl font-bold text-slate-900">둘러보기</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group flex h-full flex-col rounded-lg border border-slate-200 bg-white p-6 transition-colors hover:border-brand-300 hover:bg-brand-50"
                  >
                    <span className="text-base font-semibold text-slate-900 group-hover:text-brand-700">
                      {item.label}
                    </span>
                    <span className="mt-2 text-sm leading-relaxed text-slate-600">
                      {item.description}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
