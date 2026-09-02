import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";

import { AnswerForm } from "./answer-form";

// 담당 브랜치: feature/archive-requests
// (protected) 레이아웃이 로그인 여부를 이미 확인하므로 이 페이지는 화면만 담당한다.

export const metadata: Metadata = {
  title: "요구사항 관리",
};

export default async function AdminRequestsPage() {
  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("requests")
    .select(
      "id, student_name, student_number, title, category, content, status, answer, created_at",
    )
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">요구사항 관리</h1>
        <p className="mt-2 text-sm text-slate-600">
          학생이 제출한 요구사항을 확인하고 답변을 남기세요. 답변을 저장하면 학생의 조회
          페이지에 바로 표시됩니다.
        </p>
      </div>

      {!requests || requests.length === 0 ? (
        <p className="text-sm text-slate-600">아직 제출된 요구사항이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {requests.map((r) => (
            <div key={r.id} className="rounded-lg border border-slate-200 px-5 py-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{r.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {r.student_name} · {r.student_number}
                    {r.category ? ` · ${r.category}` : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    r.status === "답변완료"
                      ? "bg-brand-700 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {r.status}
                </span>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{r.content}</p>

              <div className="mt-4">
                <AnswerForm requestId={r.id} initialAnswer={r.answer} status={r.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
