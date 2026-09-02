import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";

import { CheckForm } from "./check-form";

// 담당 브랜치: feature/archive-requests

export const metadata: Metadata = {
  title: "요구사항 조회",
};

export default function RequestsCheckPage() {
  return (
    <>
      <PageHeader
        title="내 요구사항 조회"
        description="제출할 때 입력한 이름 · 학번 · PIN으로 본인 글과 답변 상태를 확인하세요."
      />
      <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:py-16">
        <CheckForm />
      </div>
    </>
  );
}
