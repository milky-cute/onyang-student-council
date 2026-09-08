"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { formatDate } from "@/lib/format-date";

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

export function ItemRow({ item }: { item: Item }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/lost-found/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isResolved: !item.is_resolved }),
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error ?? "변경 중 문제가 발생했습니다.");
        return;
      }

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

  return (
    <div
      className={`flex flex-wrap items-start justify-between gap-4 rounded-lg border border-slate-200 px-4 py-4 ${
        item.is_resolved ? "bg-slate-50" : ""
      }`}
    >
      <div className="flex min-w-0 flex-1 gap-4">
        {item.image_url && (
          <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-slate-100">
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
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
            {item.title}
            {item.is_resolved && (
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
                찾아감
              </span>
            )}
          </p>

          {item.description && (
            <p className="mt-1 text-sm text-slate-600">{item.description}</p>
          )}

          <p className="mt-1 text-xs text-slate-500">
            주운 곳 {item.location} · 보관 {item.storage_location}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {formatDate(item.created_at)} 등록
          </p>

          {error && (
            <p role="alert" className="mt-1 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* 가장 자주 쓰는 동작이라 채운 버튼으로 눈에 띄게 둔다. */}
        <button
          type="button"
          onClick={handleToggle}
          disabled={pending}
          className={
            item.is_resolved
              ? "rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60"
              : "rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:opacity-60"
          }
        >
          {item.is_resolved ? "완료 취소" : "완료 표시"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
        >
          삭제
        </button>
      </div>
    </div>
  );
}
