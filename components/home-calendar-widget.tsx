import Link from "next/link";

// 담당 브랜치: feature/round3-home-archive
// 주의: 날짜/요일 계산 로직은 다른 브랜치(feature/round3-calendar-polish)의
// app/calendar/calendar-view.tsx 와 겹치지만, 병합 충돌을 피하기 위해 이 컴포넌트
// 안에서 자체적으로 구현한다 (공용 유틸로 뽑지 않음 — 나중에 브랜치 병합 시 정리 예정).

type HomeCalendarEvent = {
  id: string;
  title: string;
  event_date: string;
  color: string;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export function HomeCalendarWidget({
  events,
  today,
}: {
  events: HomeCalendarEvent[];
  /**
   * 한국 시간 기준 오늘 (seoulToday() 값, month 는 0-based).
   * 서버(Vercel)는 UTC 라 여기서 new Date() 를 쓰면 한국 시간 0~9시에 날짜가 하루 밀린다.
   */
  today: { year: number; month: number; day: number };
}) {
  const { year, month } = today;

  const eventsByDate = new Map<string, HomeCalendarEvent[]>();
  for (const event of events) {
    const list = eventsByDate.get(event.event_date) ?? [];
    list.push(event);
    eventsByDate.set(event.event_date, list);
  }

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = toDateKey(year, month, today.day);

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return { day, dateKey: toDateKey(year, month, day), weekday: new Date(year, month, day).getDay() };
  });

  return (
    <Link
      href="/calendar"
      className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">
          {year}년 {month + 1}월 일정
        </p>
        <span className="text-xs font-medium text-brand-700">전체 보기 →</span>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-400">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={i === 0 ? "text-red-600" : i === 6 ? "text-blue-600" : ""}>
            {w}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map(({ day, dateKey, weekday }) => {
          const dayEvents = eventsByDate.get(dateKey) ?? [];
          const isToday = dateKey === todayKey;
          const dotColor = dayEvents[0]?.color;

          return (
            <div
              key={dateKey}
              className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md text-[11px] ${
                isToday ? "bg-brand-700 font-semibold text-white" : "text-slate-700"
              }`}
            >
              <span
                className={
                  isToday
                    ? "text-white"
                    : weekday === 0
                      ? "text-red-600"
                      : weekday === 6
                        ? "text-blue-600"
                        : ""
                }
              >
                {day}
              </span>
              {dotColor && (
                <span
                  aria-hidden
                  className="size-1 rounded-full"
                  style={{ backgroundColor: isToday ? "#ffffff" : dotColor }}
                />
              )}
            </div>
          );
        })}
      </div>
    </Link>
  );
}
