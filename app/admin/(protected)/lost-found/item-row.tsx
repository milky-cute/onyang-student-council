"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { TYPE_LABELS, type LostFoundTypeValue } from "@/lib/lost-found";

type Item = {
  id: string;
  type: LostFoundTypeValue;
  title: string;
  location: string | null;
  storage_location: string | null;
  reporter_name: string;
  reporter_class: string;
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
    if (!window.confirm(`"${item.title}" 항목을 삭제할까요? 되돌릴 수 없습니다.`)) return;

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
      className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3 ${
        item.is_resolved ? "bg-slate-50" : ""
      }`}
    >
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
          <span className="rounded bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
            {TYPE_LABELS[item.type]}
          </span>
          {item.title}
          {item.is_resolved && (
            <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
              완료
            </span>
          )}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {item.reporter_name} · {item.reporter_class}
          {item.location ? ` · ${item.location}` : ""}
          {item.storage_location ? ` · 보관: ${item.storage_location}` : ""}
        </p>
        {error && (
          <p role="alert" className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>

      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={handleToggle}
          disabled={pending}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {item.is_resolved ? "완료 취소" : "완료 처리"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
        >
          삭제
        </button>
      </div>
    </div>
  );
}
