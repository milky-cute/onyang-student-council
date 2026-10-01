import Link from "next/link";

import { CalendarIcon } from "@/components/icons";
import { DEFAULT_EVENT_COLOR, WEEKDAYS, diffDays, groupEventsByDate } from "@/lib/calendar-utils";

function ddayText(count: number) {
  return count === 0 ? "D-DAY" : `D-${count}`;
}

/** 'YYYY-MM-DD' → '10월 12일' */
function monthDay(dateKey: string) {
  const [, month, day] = dateKey.split("-").map(Number);
  return `${month}월 ${day}일`;
}

/** 홈 D-day 카드. 임원이 "D-day로 표시"한 일정 중 오늘 이후 가장 가까운 것. */
export function HomeDdayCard({
  event,
  todayKey,
}: {
  event: { title: string; event_date: string };
  todayKey: string;
}) {
  return (
    <Link
      href="/calendar"
      className="flex flex-col rounded-2xl border border-amber-100 bg-amber-50 p-4 transition-colors hover:border-amber-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 sm:p-5"
    >
      <p className="line-clamp-2 text-sm font-semibold text-amber-900">{event.title}</p>
      <p className="mt-2 text-4xl font-extrabold tracking-tight text-amber-700">
        {ddayText(diffDays(event.event_date, todayKey))}
      </p>
      <p className="mt-auto pt-2 text-sm font-medium text-amber-800">{monthDay(event.event_date)}</p>
    </Link>
  );
}

/**
 * 홈 "이번 주 일정" 카드. 이번 주 월~금 날짜 줄(오늘 강조, 일정 있는 날 색 점)과
 * 오늘 이후 가장 가까운 일정 최대 2개. 날짜는 전부 seoulToday() 기준 dateKey 로 계산한다.
 */
export function HomeWeekCard({
  weekKeys,
  todayKey,
  weekEvents,
  upcoming,
}: {
  /** 이번 주 월~금 'YYYY-MM-DD' */
  weekKeys: string[];
  todayKey: string;
  weekEvents: { event_date: string; color: string }[];
  upcoming: { id: string; title: string; event_date: string }[];
}) {
  const eventsByDate = groupEventsByDate(weekEvents);

  return (
    <section aria-labelledby="home-week-heading" className="card flex h-full flex-col p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 id="home-week-heading" className="text-sm font-bold text-slate-900">
          이번 주 일정
        </h2>
        <Link
          href="/calendar"
          aria-label="전체 일정 보기"
          className="-m-2 flex size-11 items-center justify-center rounded-lg text-brand-700 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-700"
        >
          <CalendarIcon className="size-5" />
        </Link>
      </div>

      <ol className="mt-2 grid grid-cols-5 gap-0.5 rounded-xl bg-slate-50 px-1 py-2 text-center">
        {weekKeys.map((key, i) => {
          const day = Number(key.slice(8));
          const isToday = key === todayKey;
          const firstEvent = eventsByDate.get(key)?.[0];
          return (
            <li key={key} className="flex flex-col items-center gap-0.5">
              <span className="text-[11px] font-medium text-slate-500">{WEEKDAYS[i + 1]}</span>
              <span
                aria-current={isToday ? "date" : undefined}
                className={`flex size-7 items-center justify-center rounded-full text-sm font-semibold ${
                  isToday ? "bg-brand-700 text-white" : "text-slate-800"
                }`}
              >
                {day}
              </span>
              <span
                aria-hidden
                className="size-1.5 rounded-full"
                style={{
                  backgroundColor: firstEvent ? firstEvent.color || DEFAULT_EVENT_COLOR : "transparent",
                }}
              />
            </li>
          );
        })}
      </ol>

      {upcoming.length === 0 ? (
        <p className="mt-3 text-xs text-slate-500">다가오는 일정이 없어요.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-1.5">
          {upcoming.map((event) => (
            <li key={event.id} className="flex items-center gap-2 text-sm">
              <span className="shrink-0 rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-bold text-amber-800">
                {ddayText(diffDays(event.event_date, todayKey))}
              </span>
              <span className="min-w-0 truncate text-slate-800">{event.title}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
