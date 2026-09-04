import type { Metadata } from "next";
import Image from "next/image";

import { PageHeader } from "@/components/page-header";
import { formatYearMonth } from "@/lib/format-date";
import { createClient } from "@/lib/supabase/server";

import { MonthSelect } from "./month-select";

export const metadata: Metadata = {
  title: "이달의 학생자치회",
};

type Activity = {
  id: string;
  department: string;
  title: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
};

export default async function MonthlyPage({
  searchParams,
}: {
  searchParams: Promise<{ ym?: string }>;
}) {
  const requestedMonth = (await searchParams).ym;
  const supabase = await createClient();

  // 활동이 등록된 연월 목록 (드롭다운 채우기용)
  const { data: monthRows, error: monthError } = await supabase
    .from("monthly_activities")
    .select("year_month")
    .order("year_month", { ascending: false });

  const months = [...new Set((monthRows ?? []).map((row) => row.year_month))];
  const selectedMonth =
    requestedMonth && months.includes(requestedMonth) ? requestedMonth : months[0];

  // 선택한 달의 활동. 부서별로 묶어 보여준다.
  let activities: Activity[] = [];
  let activityError = null;

  if (selectedMonth) {
    const result = await supabase
      .from("monthly_activities")
      .select("id, department, title, description, image_url, created_at")
      .eq("year_month", selectedMonth)
      .order("department", { ascending: true })
      .order("created_at", { ascending: false });

    activities = result.data ?? [];
    activityError = result.error;
  }

  const error = monthError ?? activityError;

  // 부서명 → 활동 목록
  const byDepartment = new Map<string, Activity[]>();
  for (const activity of activities) {
    const list = byDepartment.get(activity.department) ?? [];
    list.push(activity);
    byDepartment.set(activity.department, list);
  }

  return (
    <>
      <PageHeader
        title="이달의 학생자치회"
        description="매월 각 부서가 어떤 활동을 했는지 정리해 보여드립니다."
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
        {error && (
          <p
            role="alert"
            className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            활동 내역을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        )}

        {!error && months.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
            <p className="text-sm text-slate-600">
              아직 등록된 활동이 없습니다.
            </p>
          </div>
        )}

        {!error && selectedMonth && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-bold text-slate-900">
                {formatYearMonth(selectedMonth)}
              </h2>
              <MonthSelect months={months} selected={selectedMonth} />
            </div>

            {byDepartment.size === 0 ? (
              <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
                <p className="text-sm text-slate-600">
                  이 달에 등록된 활동이 없습니다.
                </p>
              </div>
            ) : (
              <div className="mt-8 flex flex-col gap-10">
                {[...byDepartment.entries()].map(([department, list]) => (
                  <section key={department}>
                    <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                      <span className="inline-block h-4 w-1 rounded-full bg-brand-700" />
                      {department}
                    </h3>

                    <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {list.map((activity) => (
                        <li
                          key={activity.id}
                          className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white"
                        >
                          {activity.image_url && (
                            <div className="relative aspect-[4/3] w-full bg-slate-100">
                              <Image
                                src={activity.image_url}
                                alt=""
                                fill
                                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="flex flex-1 flex-col p-5">
                            <h4 className="text-base font-semibold text-slate-900">
                              {activity.title}
                            </h4>
                            {activity.description && (
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                                {activity.description}
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
