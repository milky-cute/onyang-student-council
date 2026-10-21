"use client";

import Image from "next/image";
import { useEffect, useRef, useSyncExternalStore } from "react";

import { SITE } from "@/lib/site-config";

const SEOUL_DATE = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  month: "long",
  day: "numeric",
  weekday: "short",
});

const SEOUL_TIME = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Seoul",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function subscribeEverySecond(callback: () => void) {
  const timer = setInterval(callback, 1000);
  return () => clearInterval(timer);
}

/**
 * 지금 시각(초 단위). 서버 렌더링과 첫 hydration 에서는 null 이라 시각이 어긋나 경고가 나지 않고,
 * 그 뒤로 매초 갱신된다.
 */
function useNowSeconds() {
  return useSyncExternalStore(
    subscribeEverySecond,
    () => Math.floor(Date.now() / 1000),
    () => null,
  );
}

/**
 * 계속 흘러가는 사선 줄무늬 띠. 캡처한 화면은 멈춰 있어서 진짜 화면과 구별된다.
 * ⚠️ 위조 방지 기능이라 동작 줄이기(prefers-reduced-motion) 설정에서도 멈추지 않는다 — 일부러 그 설정을 확인하지 않는다.
 */
function MovingStripe() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const animation = ref.current?.animate(
      [{ backgroundPosition: "0 0" }, { backgroundPosition: "32px 0" }],
      { duration: 1000, iterations: Infinity, easing: "linear" },
    );
    return () => animation?.cancel();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="h-3 w-full"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgb(255 255 255 / 0.35) 25%, transparent 25%, transparent 50%, rgb(255 255 255 / 0.35) 50%, rgb(255 255 255 / 0.35) 75%, transparent 75%)",
        backgroundSize: "32px 32px",
      }}
    />
  );
}

/** 신분증 모양 입장권. 위조 방지로 매초 흐르는 한국 시각과 움직이는 사선 띠를 넣는다. */
export function PassCard({
  passName,
  projectTitle,
  studentName,
  studentNumber,
  validLabel,
  seat,
}: {
  passName: string;
  projectTitle: string;
  studentName: string;
  studentNumber: string;
  /** '상시' 또는 'M월 D일까지' */
  validLabel: string;
  /** 좌석 표시를 쓰는 사업만 넘긴다. value 가 null 이면 미배정 */
  seat?: { label: string; value: string | null };
}) {
  const nowSeconds = useNowSeconds();
  const now = nowSeconds === null ? null : new Date(nowSeconds * 1000);

  return (
    <div className="flex flex-col gap-3">
      <section aria-label={passName} className="card overflow-hidden">
        <div className="bg-brand-700 text-white">
          <div className="flex items-center gap-3 px-5 pt-5 pb-4">
            <Image
              src="/logo.jpg"
              alt={`${SITE.schoolName} ${SITE.councilName} 로고`}
              width={48}
              height={48}
              className="size-12 shrink-0 rounded-full bg-white"
            />
            <div className="min-w-0">
              <p className="text-caption font-semibold text-brand-100">{SITE.fullName}</p>
              <p className="text-card-title font-bold">{passName}</p>
            </div>
          </div>
          <MovingStripe />
        </div>

        <div className="px-5 pt-4 pb-5">
          <p className="text-body-sm text-slate-600">{projectTitle}</p>
          <p className="mt-3 text-display font-bold text-slate-900">{studentName}</p>
          {seat &&
            (seat.value ? (
              <p className="mt-1 flex items-baseline gap-2">
                <span className="text-body font-semibold text-slate-600">{seat.label}</span>
                <span className="text-display font-bold text-brand-700 tabular-nums">
                  {seat.value}
                </span>
              </p>
            ) : (
              <p className="mt-1 text-body-sm text-slate-600">
                {seat.label} 미배정 · 학생회실에 문의해 주세요
              </p>
            ))}
          <dl className="mt-4 grid grid-cols-2 gap-3 rounded-control bg-slate-50 px-4 py-3 text-body-sm">
            <div>
              <dt className="text-caption text-slate-600">학번</dt>
              <dd className="mt-0.5 text-body font-semibold text-slate-900 tabular-nums">
                {studentNumber}
              </dd>
            </div>
            <div>
              <dt className="text-caption text-slate-600">유효 기간</dt>
              <dd className="mt-0.5 text-body font-semibold text-slate-900">{validLabel}</dd>
            </div>
          </dl>

          <div className="mt-4 text-center" aria-live="off">
            <p className="text-body-sm text-slate-600">{now ? SEOUL_DATE.format(now) : " "}</p>
            {/* 시계는 검사하는 사람이 멀리서도 초가 넘어가는 걸 보도록 토큰(28px)보다 크게 36px 로 둔다. */}
            <p className="mt-0.5 text-4xl font-bold text-brand-700 tabular-nums">
              {now ? SEOUL_TIME.format(now) : "--:--:--"}
            </p>
          </div>
        </div>
      </section>

      <p className="rounded-control bg-slate-100 px-4 py-3 text-center text-body-sm font-semibold text-slate-700">
        캡처한 화면은 사용할 수 없어요 · 화면 밝기를 높여 주세요
      </p>
    </div>
  );
}
