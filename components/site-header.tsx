"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { NAV_ITEMS, SITE } from "@/lib/site-config";

/**
 * 전역 헤더. 데스크톱은 가로 네비게이션, 모바일(md 미만)은 햄버거 메뉴.
 *
 * ⚠️ 2단계 이후 feature 브랜치에서는 이 파일을 수정하지 않는다.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        {/* 로고 + 학교명 */}
        <Link href="/" className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="flex size-9 items-center justify-center rounded-lg bg-brand-700 text-sm font-bold text-white"
          >
            온양
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[15px] font-bold text-slate-900">
              {SITE.schoolName}
            </span>
            <span className="text-xs font-medium text-brand-700">
              {SITE.councilName}
            </span>
          </span>
        </Link>

        {/* 데스크톱 네비게이션 */}
        <nav aria-label="주요 메뉴" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
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
                className="rounded-md border border-brand-700 px-3 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-700 hover:text-white"
              >
                임원 로그인
              </Link>
            </li>
          </ul>
        </nav>

        {/* 모바일 햄버거 버튼 */}
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          className="inline-flex size-10 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100 md:hidden"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="size-6"
          >
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {/* 모바일 메뉴 */}
      {open && (
        <nav
          id="mobile-menu"
          aria-label="주요 메뉴 (모바일)"
          // 메뉴 안의 링크를 누르면(이벤트 버블링) 메뉴를 닫는다.
          onClick={() => setOpen(false)}
          className="border-t border-slate-200 bg-white md:hidden"
        >
          <ul className="mx-auto w-full max-w-6xl px-4 py-2">
            <li>
              <Link
                href="/"
                aria-current={pathname === "/" ? "page" : undefined}
                className={`block rounded-md px-3 py-3 text-[15px] font-medium ${
                  pathname === "/"
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-700"
                }`}
              >
                홈
              </Link>
            </li>
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`block rounded-md px-3 py-3 text-[15px] font-medium ${
                    isActive(item.href)
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-700"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="my-2 border-t border-slate-200 pt-2">
              <Link
                href="/admin"
                className="block rounded-md px-3 py-3 text-[15px] font-semibold text-brand-700"
              >
                임원 로그인
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
