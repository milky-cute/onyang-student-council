import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";

// 담당 브랜치: feature/board-monthly
// 2단계 할 일: monthly_activities 를 year_month 기준으로 묶어 부서별 활동 렌더링

export const metadata: Metadata = {
  title: "이달의 학생회",
};

export default function MonthlyPage() {
  return (
    <>
      <PageHeader
        title="이달의 학생회"
        description="매월 각 부서가 어떤 활동을 했는지 정리해 보여드립니다."
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-20">
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-slate-900">준비중입니다</p>
          <p className="mt-2 text-sm text-slate-600">
            부서별 활동 정리를 준비하고 있어요. 조금만 기다려 주세요.
          </p>
        </div>
      </div>
    </>
  );
}
