/**
 * 날짜 표시 헬퍼.
 *
 * 서버와 브라우저의 시간대가 달라 렌더 결과가 어긋나는 일이 없도록
 * 항상 한국 시간대로 고정해서 포맷한다.
 */

const DATE_FORMAT = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "long",
  day: "numeric",
});

/** '2026년 9월 3일' */
export function formatDate(isoString: string): string {
  return DATE_FORMAT.format(new Date(isoString));
}

/** 'YYYY-MM' → '2026년 9월' */
export function formatYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  return `${year}년 ${Number(month)}월`;
}
