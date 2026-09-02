import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";

import { RequestForm } from "./request-form";

// 담당 브랜치: feature/archive-requests

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
      </div>
    </>
  );
}
