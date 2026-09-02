import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { deleteMonthlyActivity } from "../../actions";
import { MonthlyForm } from "../../monthly-form";

export const metadata: Metadata = {
  title: "활동 수정",
};

export default async function EditMonthlyActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: activity } = await supabase
    .from("monthly_activities")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!activity) {
    notFound();
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">활동 수정</h1>

      <div className="mt-8">
        <MonthlyForm activity={activity} />
      </div>

      <div className="mt-12 max-w-2xl border-t border-slate-200 pt-6">
        <h2 className="text-sm font-semibold text-slate-900">활동 삭제</h2>
        <p className="mt-1 text-sm text-slate-600">
          삭제한 활동은 되돌릴 수 없습니다.
        </p>
        <form action={deleteMonthlyActivity} className="mt-3">
          <input type="hidden" name="id" value={activity.id} />
          <button
            type="submit"
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
          >
            이 활동 삭제하기
          </button>
        </form>
      </div>
    </>
  );
}
