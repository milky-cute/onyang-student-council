"use client";

import { useState } from "react";

type MyRequest = {
  id: string;
  title: string;
  category: string | null;
  content: string;
  status: "대기" | "답변완료";
  answer: string | null;
  created_at: string;
  answered_at: string | null;
};

const initialForm = { studentName: "", studentNumber: "", pin: "" };

export function CheckForm() {
  const [form, setForm] = useState(initialForm);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<MyRequest[] | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResults(null);

    if (!form.studentName.trim() || !form.studentNumber.trim()) {
      setError("이름과 학번을 입력해주세요.");
      return;
    }
    if (!/^\d{4}$/.test(form.pin)) {
      setError("PIN은 숫자 4자리로 입력해주세요.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/requests/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error ?? "조회 중 문제가 발생했습니다.");
        return;
      }

      setResults(body.requests as MyRequest[]);
    } catch {
      setError("조회 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="studentName" className="text-sm font-medium text-slate-700">
              이름
            </label>
            <input
              id="studentName"
              value={form.studentName}
              onChange={(e) => setForm((p) => ({ ...p, studentName: e.target.value }))}
              required
              className="rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="studentNumber" className="text-sm font-medium text-slate-700">
              학번
            </label>
            <input
              id="studentNumber"
              value={form.studentNumber}
              onChange={(e) => setForm((p) => ({ ...p, studentNumber: e.target.value }))}
              required
              inputMode="numeric"
              className="rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="pin" className="text-sm font-medium text-slate-700">
              PIN
            </label>
            <input
              id="pin"
              value={form.pin}
              onChange={(e) =>
                setForm((p) => ({ ...p, pin: e.target.value.replace(/\D/g, "").slice(0, 4) }))
              }
              required
              inputMode="numeric"
              maxLength={4}
              className="rounded-md border border-slate-300 px-3 py-2.5 text-sm tracking-widest outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-md bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:opacity-60"
        >
          {pending ? "조회 중…" : "조회하기"}
        </button>
      </form>

      {results && (
        <div className="flex flex-col gap-3">
          {results.length === 0 ? (
            <p className="text-sm text-slate-600">
              입력하신 정보와 일치하는 요구사항이 없습니다.
            </p>
          ) : (
            results.map((r) => (
              <div key={r.id} className="rounded-lg border border-slate-200 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{r.title}</p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      r.status === "답변완료"
                        ? "bg-brand-700 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                {r.category && <p className="mt-1 text-xs text-slate-500">{r.category}</p>}
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{r.content}</p>
                {r.answer && (
                  <div className="mt-3 rounded-md bg-brand-50 px-3 py-3">
                    <p className="text-xs font-semibold text-brand-700">학생자치회 답변</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{r.answer}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
