import type { Metadata } from "next";

import { AdminBackLink } from "@/components/admin-back-link";
import { createClient } from "@/lib/supabase/server";

import { EventForm } from "./event-form";
import { EventRow } from "./event-row";

// 담당 브랜치: feature/round2-fixes
// (protected) 레이아웃이 로그인 여부를 이미 확인하므로 이 페이지는 화면만 담당한다.

export const metadata: Metadata = {
  title: "일정 관리",
};

export default async function AdminCalendarPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("calendar_events")
    .select("id, title, description, event_date, color")
    .order("event_date", { ascending: true });

  return (
    <>
      <AdminBackLink />
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">일정 관리</h1>
          <p className="mt-2 text-sm text-slate-600">
            학사일정 · 행사를 등록하면 로그인 없이 누구나 /calendar 에서 볼 수 있습니다.
          </p>
        </div>

        <EventForm />

        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-slate-900">등록된 일정</h2>
          {!events || events.length === 0 ? (
            <p className="text-sm text-slate-600">아직 등록된 일정이 없습니다.</p>
          ) : (
            events.map((event) => <EventRow key={event.id} event={event} />)
          )}
        </div>
      </div>
    </>
  );
}
