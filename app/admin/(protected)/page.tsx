import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "임원 대시보드",
};

const SECTIONS = [
  {
    href: "/admin/projects",
    label: "학생회 사업 관리",
    description: "사업을 등록·수정하고 QR 코드와 입장권 명단을 관리합니다.",
  },
  {
    href: "/admin/lost-found",
    label: "분실물센터 관리",
    description: "습득물을 등록하고, 주인이 찾아가면 완료 표시합니다.",
  },
  {
    href: "/admin/board",
    label: "학생자치회 게시판 관리",
    description: "공지사항과 활동 포스터를 작성·수정·삭제합니다.",
  },
  {
    href: "/admin/monthly",
    label: "이달의 학생자치회 관리",
    description: "부서별 월간 활동을 작성·수정·삭제합니다.",
  },
  {
    href: "/admin/archive",
    label: "아카이브 관리",
    description: "앨범을 만들고 활동 사진을 업로드합니다.",
  },
  {
    href: "/admin/requests",
    label: "요구사항 관리",
    description: "학생이 제출한 요구사항을 확인하고 답변합니다.",
  },
  {
    href: "/admin/calendar",
    label: "일정 관리",
    description: "학사일정 · 행사를 등록하면 /calendar 에서 누구나 볼 수 있습니다.",
  },
];

/** /admin — 로그인한 임원만 볼 수 있는 대시보드. */
export default function AdminDashboardPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">임원 대시보드</h1>
      <p className="mt-2 text-sm text-slate-600">
        아래에서 학생회 사업·분실물센터와 나머지 메뉴를 관리할 수 있습니다.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group rounded-lg border border-slate-200 px-5 py-5 transition-colors hover:border-brand-700 hover:bg-brand-50"
          >
            <p className="font-semibold text-slate-900 group-hover:text-brand-700">
              {section.label}
            </p>
            <p className="mt-1.5 text-sm text-slate-600">
              {section.description}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
