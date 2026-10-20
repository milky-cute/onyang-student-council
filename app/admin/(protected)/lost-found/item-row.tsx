"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { formatDate } from "@/lib/format-date";
import { FIELD_LIMITS } from "@/lib/lost-found";

type Item = {
  id: string;
  title: string;
  description: string | null;
  location: string;
  storage_location: string;
  image_url: string | null;
  is_resolved: boolean;
  created_at: string;
};

/** lost_found_private 행. 임원 화면에서만 내려온다. */
type PrivateInfo = {
  private_note: string | null;
  claimed_by: string | null;
  claimed_at: string | null;
};

export function ItemRow({
  item,
  privateInfo,
  deadlineLabel,
  isExpired,
}: {
  item: Item;
  privateInfo: PrivateInfo | null;
  /** 'M월 D일' — 보관 기한 */
  deadlineLabel: string;
  /** 보관 기한이 지났는데 아직 찾아가지 않음 */
  isExpired: boolean;
}) {
  const router = useRouter();
  const [claimedBy, setClaimedBy] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleToggle() {
    if (
      item.is_resolved &&
      privateInfo?.claimed_by &&
      !window.confirm(`완료를 취소하면 수령 기록(${privateInfo.claimed_by})이 지워집니다. 계속할까요?`)
    ) {
      return;
    }

    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/lost-found/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isResolved: !item.is_resolved,
          ...(item.is_resolved ? {} : { claimedBy }),
        }),
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error ?? "변경 중 문제가 발생했습니다.");
        return;
      }

      setClaimedBy("");
      router.refresh();
    } catch {
      setError("변경 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        `"${item.title}" 을(를) 삭제할까요? 되돌릴 수 없습니다.\n\n주인이 찾아간 경우라면 삭제 대신 "완료 표시"를 눌러주세요.`,
      )
    ) {
      return;
    }

    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/lost-found/${item.id}`, { method: "DELETE" });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error ?? "삭제 중 문제가 발생했습니다.");
        return;
      }

      router.refresh();
    } catch {
      setError("삭제 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setPending(false);
    }
  }

  /** 단톡방 등에 올릴 공개 상세 페이지 주소를 복사한다. */
  async function handleCopyLink() {
    const url = `${window.location.origin}/lost-found/${item.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(`복사하지 못했습니다. 직접 복사해주세요: ${url}`);
    }
  }

  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-4 rounded-control border border-slate-200 px-4 py-4 ${
        item.is_resolved ? "bg-slate-50" : ""
      }`}
    >
      <div className="flex min-w-0 flex-1 gap-4">
        {item.image_url && (
          <div className="relative size-20 shrink-0 overflow-hidden rounded-chip bg-slate-100">
            <Image
              src={item.image_url}
              alt={item.title}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
        )}

        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-body-sm font-semibold text-slate-900">
            {item.title}
            {item.is_resolved && (
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-caption font-semibold text-slate-600">
                찾아감
              </span>
            )}
            {isExpired && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-caption font-semibold text-red-700">
                기한 지남
              </span>
            )}
          </p>

          {item.description && (
            <p className="mt-1 text-body-sm text-slate-600">{item.description}</p>
          )}

          <p className="mt-1 text-caption text-slate-600">
            주운 곳 {item.location} · 보관 {item.storage_location}
          </p>
          <p className="mt-0.5 text-caption text-slate-600">
            {formatDate(item.created_at)} 등록
            {!item.is_resolved && ` · ${deadlineLabel}까지 보관`}
          </p>

          {/* 임원 전용 정보 — lost_found_private */}
          {(privateInfo?.private_note || privateInfo?.claimed_by) && (
            <dl className="mt-2 flex flex-col gap-0.5 rounded-chip bg-amber-50 px-3 py-2 text-caption text-amber-900">
              {privateInfo.private_note && (
                <div className="flex gap-2">
                  <dt className="shrink-0 font-semibold">확인용 특징</dt>
                  <dd>{privateInfo.private_note}</dd>
                </div>
              )}
              {privateInfo.claimed_by && (
                <div className="flex gap-2">
                  <dt className="shrink-0 font-semibold">받아간 사람</dt>
                  <dd>
                    {privateInfo.claimed_by}
                    {privateInfo.claimed_at && ` (${formatDate(privateInfo.claimed_at)})`}
                  </dd>
                </div>
              )}
            </dl>
          )}

          {error && (
            <p role="alert" className="mt-1 text-body-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        {!item.is_resolved && (
          <input
            value={claimedBy}
            onChange={(e) => setClaimedBy(e.target.value)}
            maxLength={FIELD_LIMITS.claimedBy}
            placeholder="받아간 사람 (이름·학번, 선택)"
            aria-label="받아간 사람 (선택)"
            className="w-56 rounded-chip border border-slate-300 px-3 py-2 text-body-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
          />
        )}
        <div className="flex items-center gap-2">
          {/* 가장 자주 쓰는 동작이라 채운 버튼으로 눈에 띄게 둔다. */}
          <button
            type="button"
            onClick={handleToggle}
            disabled={pending}
            className={
              item.is_resolved
                ? "rounded-chip border border-slate-300 px-3 py-2 text-body-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60"
                : "rounded-control bg-brand-700 px-4 py-2 text-body-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
            }
          >
            {item.is_resolved ? "완료 취소" : "완료 표시"}
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="rounded-chip border border-slate-300 px-3 py-2 text-body-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            {copied ? "복사됨" : "링크 복사"}
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
      </div>
    </div>
  );
}
