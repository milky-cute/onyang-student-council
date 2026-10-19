/**
 * 캘린더 공용 로직.
 *
 * /calendar 의 CalendarView 가 쓰는 날짜 그리드·요일 색상 규칙을 모아둔
 * 순수 함수 모음이다. 상태를 갖지 않으므로 서버 컴포넌트에서도 그대로 쓸 수 있고,
 * 홈 화면 캘린더 위젯(별도 브랜치)도 이 모듈을 재사용한다.
 */

export const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 일정 색상 기본값 — 브랜드 블루 계열 */
export const DEFAULT_EVENT_COLOR = "#2563eb";

/**
 * 공휴일 프리셋 색상.
 * 이 색 일정이 있는 날은 캘린더에서 날짜 숫자도 일요일처럼 빨갛게 표시한다.
 */
export const HOLIDAY_COLOR = "#dc2626";

/** 임원이 고르는 프리셋 색상 */
export const COLOR_PRESETS = [
  { value: HOLIDAY_COLOR, label: "공휴일" },
  { value: "#2563eb", label: "일반 일정" },
  { value: "#16a34a", label: "행사" },
  { value: "#9333ea", label: "시험 · 평가" },
] as const;

/**
 * 일정 색상이 공휴일 프리셋인지.
 * 색상은 저장 시 소문자로 정규화되지만, 직접 입력한 값이 섞여도 되도록 비교할 때 한 번 더 낮춘다.
 */
export function isHolidayColor(color: string | null | undefined) {
  return color?.toLowerCase() === HOLIDAY_COLOR;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** (2026, 8, 3) → '2026-09-03'. month 는 0-based. */
export function toDateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

/**
 * 요일별 글자색.
 * 일요일은 빨강, 토요일은 파랑, 나머지는 fallback 을 그대로 쓴다.
 */
export function weekdayTextClass(weekday: number, fallback = "text-slate-700") {
  if (weekday === 0) return "text-red-600";
  if (weekday === 6) return "text-blue-600";
  return fallback;
}

export type MonthDay = {
  day: number;
  /** 'YYYY-MM-DD' */
  dateKey: string;
  /** 0(일) ~ 6(토) */
  weekday: number;
};

/** 달력 그리드에 필요한 앞쪽 빈 칸 수와 날짜 목록. month 는 0-based. */
export function buildMonthGrid(year: number, month: number) {
  const leadingBlanks = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: MonthDay[] = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return {
      day,
      dateKey: toDateKey(year, month, day),
      weekday: new Date(year, month, day).getDay(),
    };
  });

  return { leadingBlanks, days };
}

/** 해당 달의 1일 ~ 말일을 'YYYY-MM-DD' 로. Supabase gte/lte 필터에 쓴다. */
export function monthRange(year: number, month: number) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return {
    start: toDateKey(year, month, 1),
    end: toDateKey(year, month, lastDay),
  };
}

/** 날짜별로 이벤트를 묶는다. */
export function groupEventsByDate<T extends { event_date: string }>(events: T[]) {
  const map = new Map<string, T[]>();
  for (const event of events) {
    const list = map.get(event.event_date) ?? [];
    list.push(event);
    map.set(event.event_date, list);
  }
  return map;
}

const SEOUL_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * 한국 시간 기준 오늘. month 는 0-based.
 *
 * 서버(Vercel)는 UTC 로 동작하므로 서버 컴포넌트에서 '이번 달'을 구할 때
 * 월말·월초에 한 달 어긋나지 않도록 이 함수를 쓴다.
 */
export function seoulToday() {
  const [year, month, day] = SEOUL_DATE_FORMAT.format(new Date())
    .split("-")
    .map(Number);

  return {
    year,
    month: month - 1,
    day,
    dateKey: toDateKey(year, month - 1, day),
  };
}

/** 'YYYY-MM-DD' → '10월 1일 (목)'. 서버 시간대와 상관없이 날짜 문자열만으로 계산한다. */
export function dateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return `${month}월 ${day}일 (${WEEKDAYS[weekday]})`;
}

/**
 * dateKey 가 속한 주(월~일)의 월~금 'YYYY-MM-DD' 다섯 개.
 * 일요일은 바로 앞 월요일부터의 주로 본다.
 */
export function weekdayKeys(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const offset = (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7; // 월=0 … 일=6
  return Array.from({ length: 5 }, (_, i) =>
    new Date(Date.UTC(year, month - 1, day - offset + i)).toISOString().slice(0, 10),
  );
}

/**
 * 홈 일정 카드가 보여줄 월~금. 평일은 이번 주, 주말(토·일)은 다음 주.
 * weekdayKeys 는 일요일에 지난 월요일을 돌려주므로 토요일은 +2일, 일요일은 +1일 한 날짜로 계산한다.
 */
export function homeWeekKeys(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const shift = weekday === 6 ? 2 : weekday === 0 ? 1 : 0;
  const base = new Date(Date.UTC(year, month - 1, day + shift)).toISOString().slice(0, 10);
  return { keys: weekdayKeys(base), isNextWeek: shift > 0 };
}

/** 'YYYY-MM-DD' 두 날짜 사이의 일수 차이 (a - b). D-day 계산에 쓴다. */
export function diffDays(a: string, b: string) {
  const toUTC = (key: string) => {
    const [year, month, day] = key.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((toUTC(a) - toUTC(b)) / (24 * 60 * 60 * 1000));
}
