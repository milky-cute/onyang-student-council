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
        backHref="/requests"
      />
      {/* 제목(PageHeader)과 같은 1152px 열의 왼쪽에 맞추고, 읽기 좋은 폭(672px)으로 둔다. */}
      <div className="mx-auto w-full max-w-6xl px-4 pt-4 pb-10 lg:pt-6 lg:pb-14">
        <div className="max-w-2xl">
          <CheckForm />
        </div>
      </div>
    </>
  );
}
