"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS, SITE } from "@/lib/site-config";

/**
 * 전역 헤더.
 * - 모바일(lg 미만): 로고와 학교 · 학생자치회 이름만 있는 얇은 앱 바. 메뉴는 하단 탭바(BottomTabBar)가 맡는다.
 * - 컴퓨터(lg 이상): 왼쪽 로고와 이름, 오른쪽에 NAV_ITEMS 전체가 있는 메뉴바.
 */
export function SiteHeader() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 lg:h-16">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-3 rounded-chip focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
        >
          <Image
            src="/logo.jpg"
            alt={`${SITE.schoolName} ${SITE.councilName} 로고`}
            width={36}
            height={36}
            className="size-8 shrink-0 rounded-full lg:size-9"
          />
          <span className="flex flex-col leading-tight">
            <span className="text-caption text-slate-600">
              {SITE.schoolName}
            </span>
            <span className="text-body font-bold text-slate-900">
              {SITE.councilName}
            </span>
          </span>
        </Link>

        <nav aria-label="주요 메뉴" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`flex h-11 items-center rounded-chip px-3 text-body-sm font-semibold transition-colors ${
                    isActive(item.href)
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-brand-700"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="ml-2">
              <Link
                href="/admin"
                className="flex h-11 items-center rounded-chip border border-brand-700 px-3 text-body-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
              >
                임원 로그인
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
