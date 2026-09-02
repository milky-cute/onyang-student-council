import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";

// 담당 브랜치: feature/archive-requests
// 2단계 할 일:
//   - 제출 폼 → supabase.rpc("submit_request", ...)
//   - 조회 폼 → supabase.rpc("get_my_requests", ...) (이름·학번·PIN 검증)
//   requests 테이블은 RLS 로 직접 select 가 막혀 있으므로 반드시 위 함수를 통해야 한다.

export const metadata: Metadata = {
  title: "요구사항",
};

export default function RequestsPage() {
  return (
    <>
      <PageHeader
        title="요구사항"
        description="학교에 바라는 점을 남기고, 답변을 확인할 수 있습니다."
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-20">
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-slate-900">준비중입니다</p>
          <p className="mt-2 text-sm text-slate-600">
            요구사항 제출·조회 기능을 만들고 있어요. 조금만 기다려 주세요.
          </p>
        </div>
      </div>
    </>
  );
}
