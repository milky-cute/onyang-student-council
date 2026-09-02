import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";

// 담당 브랜치: feature/board-monthly
// 2단계 할 일: board_posts 테이블에서 공지(notice) / 포스터(poster) 목록 조회 후 렌더링

export const metadata: Metadata = {
  title: "학생회 게시판",
};

export default function BoardPage() {
  return (
    <>
      <PageHeader
        title="학생회 게시판"
        description="진행중인 활동 포스터와 학생회 공지사항을 확인하세요."
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-20">
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-slate-900">준비중입니다</p>
          <p className="mt-2 text-sm text-slate-600">
            게시판 기능을 만들고 있어요. 조금만 기다려 주세요.
          </p>
        </div>
      </div>
    </>
  );
}
