import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";

import { RequestForm } from "./request-form";

// 담당 브랜치: feature/archive-requests

export const metadata: Metadata = {
  title: "요구사항",
};

export default async function RequestsPage() {
  const supabase = await createClient();
  const { data: publicRequests } = await supabase.rpc("get_public_requests");

  return (
    <>
      <PageHeader
        title="요구사항"
        description="학교에 바라는 점을 남기고, 답변을 확인할 수 있습니다."
        backHref="/"
      />
      <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:py-16">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            제출한 요구사항은 이름 · 학번 · PIN으로 조회할 수 있어요.
          </p>
          <Link
            href="/requests/check"
            className="shrink-0 rounded-md border border-brand-700 px-3 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-700 hover:text-white"
          >
            내 요구사항 조회
          </Link>
        </div>

        <RequestForm />

        <div className="mt-16 flex flex-col gap-4 border-t border-slate-200 pt-10">
          <h2 className="text-lg font-bold text-slate-900">답변된 요구사항</h2>
          {!publicRequests || publicRequests.length === 0 ? (
            <p className="text-sm text-slate-600">아직 공개된 답변이 없습니다.</p>
          ) : (
            publicRequests.map((r) => (
              <div key={r.id} className="rounded-lg border border-slate-200 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{r.title}</p>
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                    {r.answered_department ?? "학생자치회"}
                  </span>
                </div>
                {r.category && <p className="mt-1 text-xs text-slate-500">{r.category}</p>}
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{r.content}</p>
                {r.answer && (
                  <div className="mt-3 rounded-md bg-brand-50 px-3 py-3">
                    <p className="text-xs font-semibold text-brand-700">답변</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{r.answer}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
