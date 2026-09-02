import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";

// 담당 브랜치: feature/archive-requests
// 2단계 할 일: archive_photos 를 album 별로 묶어 사진 갤러리 렌더링

export const metadata: Metadata = {
  title: "아카이브",
};

export default function ArchivePage() {
  return (
    <>
      <PageHeader
        title="아카이브"
        description="지난 학생회 활동 사진을 앨범별로 모아두었습니다."
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-20">
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
          <p className="text-lg font-semibold text-slate-900">준비중입니다</p>
          <p className="mt-2 text-sm text-slate-600">
            활동 사진을 정리하고 있어요. 조금만 기다려 주세요.
          </p>
        </div>
      </div>
    </>
  );
}
