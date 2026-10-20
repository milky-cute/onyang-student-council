import Link from "next/link";

import { ChevronRightIcon } from "@/components/icons";

/**
 * 카드 머리: 아이콘 타일 + 제목(+ 제목 옆 배지 등 children) + 오른쪽 "전체 보기" 링크.
 * primary 는 화면의 1순위 카드(홈 급식)용으로 제목을 한 단계 크게(22px) 쓴다. 나머지는 18px.
 */
export function SectionHeader({
  id,
  title,
  icon,
  primary = false,
  action,
  children,
}: {
  /** h2 의 id. 감싸는 section 의 aria-labelledby 와 맞춘다. */
  id: string;
  title: string;
  icon?: React.ReactNode;
  primary?: boolean;
  action?: { href: string; label: string };
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      {icon && <span className="icon-tile">{icon}</span>}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
        <h2
          id={id}
          className={`${primary ? "text-title" : "text-card-title"} font-bold text-slate-900`}
        >
          {title}
        </h2>
        {children}
      </div>
      {action && (
        <Link href={action.href} className="btn btn-ghost -mr-2 shrink-0">
          {action.label}
          <ChevronRightIcon className="size-4" />
        </Link>
      )}
    </div>
  );
}
