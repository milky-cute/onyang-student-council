"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ROSTER_LIMITS } from "@/lib/pass";

type Holder = {
  id: string;
  student_number: string;
  student_name: string;
  is_suspended: boolean;
  seat: string | null;
};

/**
 * 입장권 명단 검색 · 정지/해제 · 삭제 · PIN 초기화.
 * seatLabel 이 있으면(좌석 표시를 쓰는 사업) 좌석 보기 · 고치기 · 중복 표시도 한다.
 */
export function HolderList({
  holders,
  seatLabel,
}: {
  holders: Holder[];
  /** 좌석 표시 이름. 좌석 표시를 안 쓰는 사업이면 null */
  seatLabel: string | null;
}) {
  const [query, setQuery] = useState("");

  const keyword = query.trim();
  const filtered = keyword
    ? holders.filter(
        (h) =>
          h.student_number.includes(keyword) ||
          h.student_name.includes(keyword) ||
          (seatLabel !== null && (h.seat?.includes(keyword) ?? false)),
      )
    : holders;

  // 같은 좌석을 2명 이상이 쓰면 "중복". 자리 맞바꾸는 중일 수 있어 막지는 않는다.
  const seatCounts = new Map<string, number>();
  for (const holder of holders) {
    if (holder.seat) seatCounts.set(holder.seat, (seatCounts.get(holder.seat) ?? 0) + 1);
  }
  const unassigned = holders.filter((holder) => !holder.seat).length;
  const searchLabel = seatLabel ? `학번 · 이름 · ${seatLabel} 검색` : "학번 또는 이름 검색";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-card-title font-semibold text-slate-900">명단 {holders.length}명</h2>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchLabel}
          aria-label={searchLabel}
          className="w-56 rounded-chip border border-slate-300 px-3 py-2 text-body-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
        />
      </div>
      <p className="text-caption text-slate-600">
        PIN은 학번 기준으로 모든 사업에서 공통입니다. PIN 초기화는 이 사업뿐 아니라 그 학생의 모든
        사업 입장권에 적용되며, 학생은 다음에 입장권을 열 때 새 PIN을 정합니다.
      </p>
      {seatLabel && holders.length > 0 && (
        <p className="text-body-sm font-semibold text-slate-700">
          {seatLabel} 미배정 {unassigned}명
        </p>
      )}

      {holders.length === 0 ? (
        <p className="text-body-sm text-slate-600">아직 명단에 학생이 없습니다.</p>
      ) : filtered.length === 0 ? (
        <p className="text-body-sm text-slate-600">검색 결과가 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((holder) => (
            <HolderRow
              key={holder.id}
              holder={holder}
              seatLabel={seatLabel}
              isDuplicateSeat={!!holder.seat && (seatCounts.get(holder.seat) ?? 0) > 1}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function HolderRow({
  holder,
  seatLabel,
  isDuplicateSeat,
}: {
  holder: Holder;
  seatLabel: string | null;
  isDuplicateSeat: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  /** 좌석 고치는 중이면 입력칸 값, 아니면 null */
  const [seatDraft, setSeatDraft] = useState<string | null>(null);
  const who = `${holder.student_name}(${holder.student_number})`;

  async function send(url: string, init: RequestInit, fallback: string) {
    setError(null);
    setMessage(null);
    setPending(true);
    try {
      const res = await fetch(url, init);
      const body = await res.json();

      if (!res.ok) {
        setError(body.error ?? fallback);
        return false;
      }
      return true;
    } catch {
      setError(`${fallback} 잠시 후 다시 시도해주세요.`);
      return false;
    } finally {
      setPending(false);
    }
  }

  async function handleToggleSuspend() {
    const ok = await send(
      `/api/pass/holders/${holder.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSuspended: !holder.is_suspended }),
      },
      "변경 중 문제가 발생했습니다.",
    );
    if (ok) router.refresh();
  }

  async function handleSaveSeat(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = await send(
      `/api/pass/holders/${holder.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // 빈칸으로 저장하면 서버가 null(미배정)로 바꾼다.
        body: JSON.stringify({ seat: seatDraft ?? "" }),
      },
      "변경 중 문제가 발생했습니다.",
    );
    if (ok) {
      setSeatDraft(null);
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!window.confirm(`${who}을(를) 이 사업 명단에서 삭제할까요?`)) return;

    const ok = await send(
      `/api/pass/holders/${holder.id}`,
      { method: "DELETE" },
      "삭제 중 문제가 발생했습니다.",
    );
    if (ok) router.refresh();
  }

  async function handleResetPin() {
    if (
      !window.confirm(
        `${who}의 PIN과 로그인 기록을 지울까요?\n\nPIN은 모든 사업에서 공통이라 이 학생의 다른 사업 입장권에도 적용됩니다. 로그인된 휴대폰도 모두 로그아웃되고, 다음에 입장권을 열 때 새 PIN을 정하게 됩니다.`,
      )
    ) {
      return;
    }

    const ok = await send(
      "/api/pass/reset-pin",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentNumber: holder.student_number }),
      },
      "PIN 초기화 중 문제가 발생했습니다.",
    );
    if (ok) setMessage("PIN을 초기화했습니다.");
  }

  return (
    <li
      className={`flex flex-wrap items-center justify-between gap-3 rounded-control border border-slate-200 px-4 py-3 ${
        holder.is_suspended ? "bg-slate-50" : "bg-white"
      }`}
    >
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-body-sm font-semibold text-slate-900">
          <span className="tabular-nums">{holder.student_number}</span>
          {holder.student_name}
          {holder.is_suspended && (
            <span className="badge badge-error">
              정지됨
            </span>
          )}
        </p>
        {seatLabel &&
          (seatDraft === null ? (
            <div className="mt-1 flex flex-wrap items-center gap-2 text-body-sm text-slate-700">
              <span>
                {seatLabel}{" "}
                {holder.seat ? (
                  <span className="font-semibold text-slate-900">{holder.seat}</span>
                ) : (
                  <span className="text-slate-600">미배정</span>
                )}
              </span>
              {isDuplicateSeat && <span className="badge badge-soon">중복</span>}
              <button
                type="button"
                onClick={() => setSeatDraft(holder.seat ?? "")}
                disabled={pending}
                aria-label={`${who} ${seatLabel} 고치기`}
                className="min-h-11 rounded-chip border border-slate-300 px-3 text-body-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60"
              >
                고치기
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveSeat} className="mt-1 flex flex-wrap items-center gap-2">
              <input
                value={seatDraft}
                onChange={(e) => setSeatDraft(e.target.value)}
                maxLength={ROSTER_LIMITS.seat}
                placeholder="비우면 미배정"
                aria-label={`${who} ${seatLabel}`}
                autoFocus
                className="min-h-11 w-32 rounded-chip border border-slate-300 px-3 text-body-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
              />
              <button
                type="submit"
                disabled={pending}
                className="min-h-11 rounded-control bg-brand-700 px-4 text-body-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
              >
                저장
              </button>
              <button
                type="button"
                onClick={() => setSeatDraft(null)}
                disabled={pending}
                className="min-h-11 rounded-chip border border-slate-300 px-3 text-body-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60"
              >
                취소
              </button>
            </form>
          ))}
        {error && (
          <p role="alert" className="mt-1 text-body-sm text-red-600">
            {error}
          </p>
        )}
        {message && <p className="mt-1 text-body-sm text-brand-700">{message}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleToggleSuspend}
          disabled={pending}
          className="rounded-chip border border-slate-300 px-3 py-2 text-body-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60"
        >
          {holder.is_suspended ? "정지 해제" : "정지"}
        </button>
        <button
          type="button"
          onClick={handleResetPin}
          disabled={pending}
          className="rounded-chip border border-slate-300 px-3 py-2 text-body-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60"
        >
          PIN 초기화
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="rounded-chip border border-red-300 px-3 py-2 text-body-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
        >
          삭제
        </button>
      </div>
    </li>
  );
}
