"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  CalendarIcon,
  ChevronRightIcon,
  CloseIcon,
  FlagIcon,
  HomeIcon,
  MenuIcon,
  NAV_ICONS,
  SearchIcon,
} from "@/components/icons";
import { NAV_ITEMS } from "@/lib/site-config";

const TABS = [
  { href: "/", label: "홈", Icon: HomeIcon },
  { href: "/projects", label: "사업", Icon: FlagIcon },
  { href: "/lost-found", label: "분실물", Icon: SearchIcon },
  { href: "/calendar", label: "일정", Icon: CalendarIcon },
];

/** 더보기 시트에 넣는 메뉴(이 순서대로). 이름 · 설명은 NAV_ITEMS 를 그대로 쓴다. */
const MORE_HREFS = ["/board", "/monthly", "/archive", "/requests"];
const MORE_ITEMS = MORE_HREFS.flatMap((href) => NAV_ITEMS.filter((item) => item.href === href));

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * 모바일(lg 미만) 하단 고정 탭바.
 * 탭바 높이 + iOS 홈 표시줄(safe-area)만큼 빈 공간을 함께 그려서 본문 마지막 내용이 가려지지 않게 한다.
 * 임원 화면(/admin 이하)에서는 그리지 않는다.
 */
export function BottomTabBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    firstLinkRef.current?.focus();

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  function closeSheet() {
    setOpen(false);
    moreButtonRef.current?.focus();
  }

  if (pathname.startsWith("/admin")) return null;

  const moreActive = MORE_ITEMS.some((item) => isActivePath(pathname, item.href));

  return (
    <>
      {/* 고정 탭바가 본문을 가리지 않도록 같은 높이의 빈 공간 */}
      <div aria-hidden className="h-[calc(4rem+env(safe-area-inset-bottom))] lg:hidden" />

      <nav
        aria-label="하단 메뉴"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul className="mx-auto grid h-16 max-w-md grid-cols-5">
          {TABS.map(({ href, label, Icon }) => {
            const active = isActivePath(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-full min-h-11 flex-col items-center justify-center gap-1 text-caption font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-700 ${
                    active ? "text-brand-700" : "text-slate-600"
                  }`}
                >
                  <Icon className="size-6" />
                  {label}
                </Link>
              </li>
            );
          })}
          <li>
            <button
              ref={moreButtonRef}
              type="button"
              onClick={() => setOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-controls="more-sheet"
              className={`flex h-full min-h-11 w-full flex-col items-center justify-center gap-1 text-caption font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-700 ${
                moreActive ? "text-brand-700" : "text-slate-600"
              }`}
            >
              <MenuIcon className="size-6" />
              더보기
            </button>
          </li>
        </ul>
      </nav>

      {open && (
        <div
          id="more-sheet"
          role="dialog"
          aria-modal="true"
          aria-labelledby="more-sheet-title"
          className="fixed inset-0 z-50 lg:hidden"
        >
          <button
            type="button"
            aria-label="더보기 닫기"
            tabIndex={-1}
            onClick={closeSheet}
            className="absolute inset-0 bg-slate-900/40"
          />
          <div className="absolute inset-x-0 bottom-0 rounded-t-card bg-white px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-xl">
            <div aria-hidden className="mx-auto h-1 w-10 rounded-full bg-slate-200" />
            <div className="mt-2 flex items-center justify-between">
              <h2 id="more-sheet-title" className="text-card-title font-bold text-slate-900">
                더보기
              </h2>
              <button
                type="button"
                onClick={closeSheet}
                aria-label="닫기"
                className="flex size-11 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-brand-700"
              >
                <CloseIcon />
              </button>
            </div>
            <ul className="mt-1 flex flex-col">
              {MORE_ITEMS.map((item, index) => {
                const Icon = NAV_ICONS[item.href];
                const active = isActivePath(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      ref={index === 0 ? firstLinkRef : undefined}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className="flex min-h-14 items-center gap-3 rounded-control px-2 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-brand-700"
                    >
                      <span className="icon-tile">
                        {Icon && <Icon />}
                      </span>
                      <span className="flex flex-1 flex-col">
                        <span
                          className={`text-body font-semibold ${active ? "text-brand-700" : "text-slate-900"}`}
                        >
                          {item.label}
                        </span>
                        <span className="text-caption text-slate-600">{item.shortDescription}</span>
                      </span>
                      <ChevronRightIcon className="size-5 text-slate-400" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
