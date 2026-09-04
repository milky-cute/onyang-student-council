"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AnswerForm({
  requestId,
  initialAnswer,
  status,
  answeredDepartment,
}: {
  requestId: string;
  initialAnswer: string | null;
  status: "대기" | "답변완료";
  answeredDepartment: string | null;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(status === "대기");
  const [answer, setAnswer] = useState(initialAnswer ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!answer.trim()) {
      setError("답변 내용을 입력해주세요.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch(`/api/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error ?? "답변 저장 중 문제가 발생했습니다.");
        return;
      }

      setEditing(false);
      router.refresh();
    } catch {
      setError("답변 저장 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setPending(false);
    }
  }

  if (!editing) {
    return (
      <div className="rounded-md bg-brand-50 px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-brand-700">
            {answeredDepartment ?? "학생자치회"} 답변
          </p>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-slate-500 underline hover:text-slate-700"
          >
            답변 수정
          </button>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{initialAnswer}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        rows={3}
        placeholder="답변을 입력하세요"
        className="rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
      />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:opacity-60"
        >
          {pending ? "저장 중…" : "답변 저장"}
        </button>
        {status === "답변완료" && (
          <button
            type="button"
            onClick={() => {
              setAnswer(initialAnswer ?? "");
              setEditing(false);
            }}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
}
