import Link from "next/link";

/**
 * 하위 페이지 상단의 제목 배너.
 *
 * 2단계에서 각 feature 브랜치가 이 컴포넌트를 **가져다 쓰기만** 하면
 * 두 브랜치의 페이지 디자인이 서로 어긋나지 않는다.
 */
export function PageHeader({
  title,
  description,
  backHref,
}: {
  title: string;
  description: string;
  /**
   * 값이 있을 때만 제목 위에 뒤로가기 버튼을 렌더링한다.
   * 넘기지 않으면 기존 페이지들과 100% 동일하게 그려진다.
   */
  backHref?: string;
}) {
  return (
    <div className="border-b border-slate-200 bg-brand-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
        {backHref && (
          <Link
            href={backHref}
            aria-label="뒤로 가기"
            className="mb-4 flex size-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
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
        )}
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
          {description}
        </p>
      </div>
    </div>
  );
}
