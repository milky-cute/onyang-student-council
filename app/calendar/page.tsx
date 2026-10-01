import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";

import { CalendarView } from "./calendar-view";

// 담당 브랜치: feature/round2-fixes

export const metadata: Metadata = {
  title: "일정",
};

export default async function CalendarPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("calendar_events")
    .select("id, title, description, event_date, color")
    .order("event_date", { ascending: true });

  return (
    <>
      <PageHeader
        title="일정"
        description="학생자치회가 등록한 학사일정 · 행사를 달력에서 확인하세요."
        backHref="/"
      />
      <div className="mx-auto w-full max-w-4xl px-4 pt-4 pb-10 lg:pt-6 lg:pb-14">
        <div className="card p-4 sm:p-6">
          <CalendarView events={events ?? []} />
        </div>
      </div>
    </>
  );
}
