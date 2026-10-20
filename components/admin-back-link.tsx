import Link from "next/link";

/**
 * 임원 대시보드 하위 페이지 좌상단 뒤로가기 버튼.
 * components/page-header.tsx 의 backHref 버튼과 동일한 시각 스타일이다.
 * 관리자 하위 페이지들은 PageHeader 를 쓰지 않고 자체 제목 마크업을 쓰므로 별도 컴포넌트로 뺐다.
 */
export function AdminBackLink({ href = "/admin" }: { href?: string }) {
  return (
    <Link
      href={href}
      aria-label="대시보드로 돌아가기"
      className="mb-4 flex size-9 items-center justify-center rounded-chip border border-slate-300 text-slate-600 hover:bg-slate-50"
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-5"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </Link>
  );
}
