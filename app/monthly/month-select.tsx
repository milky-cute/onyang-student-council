"use client";

import { useRouter } from "next/navigation";

import { formatYearMonth } from "@/lib/format-date";

/** 연월 드롭다운. 선택하면 /monthly?ym=YYYY-MM 으로 이동한다. */
export function MonthSelect({
  months,
  selected,
}: {
  months: string[];
  selected: string;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="month" className="text-sm font-medium text-slate-700">
        조회할 달
      </label>
      <select
        id="month"
        value={selected}
        onChange={(event) => router.push(`/monthly?ym=${event.target.value}`)}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
      >
        {months.map((month) => (
          <option key={month} value={month}>
            {formatYearMonth(month)}
          </option>
        ))}
      </select>
    </div>
  );
}
