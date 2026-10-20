import { CalendarIcon } from "@/components/icons";
import { SectionHeader } from "@/components/section-header";
import { DEFAULT_EVENT_COLOR, WEEKDAYS, diffDays, groupEventsByDate } from "@/lib/calendar-utils";

function ddayText(count: number) {
  return count === 0 ? "D-DAY" : `D-${count}`;
}

/** 'YYYY-MM-DD' → '10월 12일' */
function monthDay(dateKey: string) {
  const [, month, day] = dateKey.split("-").map(Number);
  return `${month}월 ${day}일`;
}

/**
 * 홈 "이번 주 일정" 카드. 맨 위에 D-day 한 줄(임원이 "D-day로 표시"한 일정 중 오늘 이후 가장 가까운 것),
 * 이번 주 월~금 날짜 줄(오늘 강조, 일정 있는 날 색 점)과 오늘 이후 가장 가까운 일정 최대 2개.
 * 날짜는 전부 seoulToday() 기준 dateKey 로 계산한다.
 * 주말에는 다음 주 월~금을 받아 제목을 "다음 주 일정"으로 바꾼다.
 */
export function HomeWeekCard({
  weekKeys,
  isNextWeek,
  todayKey,
  dday,
  weekEvents,
  upcoming,
}: {
  /** 보여줄 주의 월~금 'YYYY-MM-DD' (homeWeekKeys) */
  weekKeys: string[];
  /** 주말이라 다음 주를 보여주는지 */
  isNextWeek: boolean;
  todayKey: string;
  /** D-day 로 표시할 일정. 없으면 D-day 줄을 그리지 않는다. */
  dday: { title: string; event_date: string } | null;
  weekEvents: { event_date: string; color: string }[];
  upcoming: { id: string; title: string; event_date: string }[];
}) {
  const eventsByDate = groupEventsByDate(weekEvents);
  // D-day 줄에 이미 나온 일정은 아래 목록에서 다시 쓰지 않는다.
  const listed = upcoming.filter(
    (event) => !(dday && event.title === dday.title && event.event_date === dday.event_date),
  );

  return (
    <section aria-labelledby="home-week-heading" className="card flex h-full flex-col p-5">
      <SectionHeader
        id="home-week-heading"
        title={isNextWeek ? "다음 주 일정" : "이번 주 일정"}
        icon={<CalendarIcon />}
        action={{ href: "/calendar", label: "전체 보기" }}
      />

      {dday && (
        <p className="mt-4 flex items-baseline gap-2 border-b border-slate-100 pb-3">
          <span className="shrink-0 text-card-title font-bold text-brand-700 tabular-nums">
            {ddayText(diffDays(dday.event_date, todayKey))}
          </span>
          <span className="min-w-0 truncate text-body-sm font-semibold text-slate-900">
            {dday.title}
          </span>
          <span className="ml-auto shrink-0 text-body-sm text-slate-600">
            {monthDay(dday.event_date)}
          </span>
        </p>
      )}

      <ol className="mt-3 grid grid-cols-5 gap-1 rounded-control bg-slate-50 px-1 py-2 text-center">
        {weekKeys.map((key, i) => {
          const day = Number(key.slice(8));
          const isToday = key === todayKey;
          const firstEvent = eventsByDate.get(key)?.[0];
          return (
            <li key={key} className="flex flex-col items-center gap-1">
              <span className="text-caption text-slate-600">{WEEKDAYS[i + 1]}</span>
              <span
                aria-current={isToday ? "date" : undefined}
                className={`flex size-7 items-center justify-center rounded-full text-body-sm font-semibold ${
                  isToday ? "bg-brand-700 text-white" : "text-slate-900"
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

      {listed.length === 0 ? (
        <p className="mt-3 text-body-sm text-slate-600">다가오는 일정이 없어요.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {listed.map((event) => (
            <li key={event.id} className="flex items-center gap-2 text-body-sm">
              <span className="badge badge-info shrink-0 tabular-nums">
                {ddayText(diffDays(event.event_date, todayKey))}
              </span>
              <span className="min-w-0 truncate text-slate-900">{event.title}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
