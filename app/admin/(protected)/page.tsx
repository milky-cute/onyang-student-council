import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "임원 대시보드",
};

/** /admin — 로그인한 임원만 볼 수 있는 대시보드. 실제 관리 기능은 2단계에서 추가한다. */
export default function AdminDashboardPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">임원 대시보드</h1>
      <p className="mt-2 text-sm text-slate-600">
        로그인에 성공했습니다. 게시글 작성, 사진 업로드, 요구사항 답변 기능은
        2단계에서 추가됩니다.
      </p>

      <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
        <p className="text-sm text-slate-600">준비중입니다</p>
      </div>
    </>
  );
}
