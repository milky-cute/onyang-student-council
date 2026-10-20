import Link from "next/link";

import { NAV_ITEMS, SITE } from "@/lib/site-config";

/**
 * 전역 푸터.
 *
 * ⚠️ 2단계 이후 feature 브랜치에서는 이 파일을 수정하지 않는다.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div>
            <p className="text-body font-bold text-slate-900">
              {SITE.fullName}
            </p>
            <p className="mt-2 max-w-md text-body-sm leading-relaxed text-slate-600">
              {SITE.description}
            </p>
          </div>

          <nav aria-label="푸터 메뉴">
            <ul className="grid grid-cols-2 gap-x-8 md:grid-cols-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-11 items-center text-body-sm text-slate-600 hover:text-brand-700"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-6 text-caption text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.fullName}
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://www.instagram.com/onyang_high_official/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center gap-2 text-slate-600 hover:text-brand-700"
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
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
              </svg>
              학생자치회 인스타
            </a>
            <Link href="/admin" className="inline-flex min-h-11 items-center hover:text-brand-700">
              임원 로그인
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
