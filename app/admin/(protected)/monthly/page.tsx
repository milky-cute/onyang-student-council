import type { Metadata } from "next";
import Link from "next/link";

import { AdminBackLink } from "@/components/admin-back-link";
import { formatYearMonth } from "@/lib/format-date";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "이달의 학생자치회 관리",
};

export default async function AdminMonthlyPage() {
  const supabase = await createClient();

  const { data: activities, error } = await supabase
    .from("monthly_activities")
    .select("id, year_month, department, title, created_at")
    .order("year_month", { ascending: false })
    .order("department", { ascending: true });

  // 연월별로 묶어서 보여준다.
  const byMonth = new Map<string, NonNullable<typeof activities>>();
  for (const activity of activities ?? []) {
    const list = byMonth.get(activity.year_month) ?? [];
    list.push(activity);
    byMonth.set(activity.year_month, list);
  }

  return (
    <>
      <AdminBackLink />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            이달의 학생자치회 관리
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            부서별 활동을 연월을 지정해 등록합니다.
          </p>
        </div>
        <Link
          href="/admin/monthly/new"
          className="rounded-md bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
        >
          활동 등록
        </Link>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-8 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          목록을 불러오지 못했습니다: {error.message}
        </p>
      )}

      {!error && byMonth.size === 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
          <p className="text-sm text-slate-600">아직 등록된 활동이 없습니다.</p>
        </div>
      )}

      {!error && byMonth.size > 0 && (
        <div className="mt-8 flex flex-col gap-8">
          {[...byMonth.entries()].map(([yearMonth, list]) => (
            <section key={yearMonth}>
              <h2 className="text-base font-semibold text-slate-900">
                {formatYearMonth(yearMonth)}
              </h2>
              <ul className="mt-3 divide-y divide-slate-200 border-y border-slate-200">
                {list.map((activity) => (
                  <li
                    key={activity.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-4"
                  >
                    <div className="min-w-0">
                      <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                        {activity.department}
                      </span>
                      <p className="mt-1 truncate text-[15px] font-medium text-slate-900">
                        {activity.title}
                      </p>
                    </div>
                    <Link
                      href={`/admin/monthly/${activity.id}/edit`}
                      className="shrink-0 text-sm font-medium text-brand-700 hover:underline"
                    >
                      수정
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
