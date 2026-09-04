import Link from "next/link";

import { HomeCalendarWidget } from "@/components/home-calendar-widget";
import { diffDays, seoulToday } from "@/lib/calendar-utils";
import { NAV_ITEMS, SITE } from "@/lib/site-config";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const monthEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const monthEnd = `${monthEndDate.getFullYear()}-${String(monthEndDate.getMonth() + 1).padStart(2, "0")}-${String(monthEndDate.getDate()).padStart(2, "0")}`;

  const { data: events } = await supabase
    .from("calendar_events")
    .select("id, title, event_date, color")
    .gte("event_date", monthStart)
    .lte("event_date", monthEnd);

  const today = seoulToday();
  const { data: ddayEvent } = await supabase
    .from("calendar_events")
    .select("id, title, event_date")
    .eq("is_dday", true)
    .gte("event_date", today.dateKey)
    .order("event_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  const ddayCount = ddayEvent ? diffDays(ddayEvent.event_date, today.dateKey) : 0;

  return (
    <>
      {/* 히어로 */}
      <section className="border-b border-slate-200 bg-brand-50">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 sm:py-24 lg:flex-row lg:items-center lg:justify-between">
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

          <div className="w-full lg:max-w-sm lg:shrink-0">
            {ddayEvent && (
              <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
                <span className="text-sm font-semibold text-amber-900">{ddayEvent.title}</span>
                <span className="text-2xl font-extrabold text-amber-600">
                  {ddayCount === 0 ? "D-DAY" : `D-${ddayCount}`}
                </span>
              </div>
            )}
            <HomeCalendarWidget events={events ?? []} />
          </div>
        </div>
      </section>

      {/* 메뉴 카드 */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
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
      </section>
    </>
  );
}
