import Link from "next/link";

import { ChevronLeftIcon } from "@/components/icons";

/**
 * 하위 페이지 상단 제목. 회색 페이지 배경 위에 얇게 놓인다.
 * backHref 가 있으면 제목 왼쪽에 뒤로가기 화살표를 둔다.
 */
export function PageHeader({
  title,
  description,
  backHref,
}: {
  title: string;
  description: string;
  backHref?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-3 pb-1 lg:pt-10 lg:pb-2">
      <div className="flex items-center gap-1">
        {backHref && (
          <Link
            href={backHref}
            aria-label="뒤로 가기"
            className="-ml-2.5 flex size-11 shrink-0 items-center justify-center rounded-full text-slate-700 hover:bg-slate-200/60 focus-visible:outline-2 focus-visible:outline-brand-700"
          >
            <ChevronLeftIcon className="size-6" />
          </Link>
        )}
        <h1 className="text-xl font-bold text-slate-900 lg:text-3xl">{title}</h1>
      </div>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-600 lg:mt-2 lg:text-base">
        {description}
      </p>
    </div>
  );
}
