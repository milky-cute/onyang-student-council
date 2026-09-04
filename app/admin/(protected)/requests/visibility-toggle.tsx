"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function VisibilityToggle({
  requestId,
  isPublic,
}: {
  requestId: string;
  isPublic: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !isPublic }),
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

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={isPublic}
        aria-label="답변된 요구사항 공개 여부"
        onClick={handleToggle}
        disabled={pending}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors disabled:opacity-60 ${
          isPublic ? "bg-brand-700" : "bg-slate-300"
        }`}
      >
        <span
          className={`inline-block size-3.5 rounded-full bg-white transition-transform ${
            isPublic ? "translate-x-[18px]" : "translate-x-1"
          }`}
        />
      </button>
      <span className="text-xs font-medium text-slate-600">
        {isPublic ? "공개" : "비공개"}
      </span>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
