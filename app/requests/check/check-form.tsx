"use client";

import { useState } from "react";

type MyRequest = {
  id: string;
  title: string;
  category: string | null;
  content: string;
  status: "대기" | "답변완료";
  answer: string | null;
  answered_department: string | null;
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
          <div className="flex flex-col gap-2">
            <label htmlFor="studentName" className="text-body-sm font-semibold text-slate-700">
              이름
            </label>
            <input
              id="studentName"
              value={form.studentName}
              onChange={(e) => setForm((p) => ({ ...p, studentName: e.target.value }))}
              required
              className="rounded-chip border border-slate-300 px-3 py-3 text-body outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="studentNumber" className="text-body-sm font-semibold text-slate-700">
              학번
            </label>
            <input
              id="studentNumber"
              value={form.studentNumber}
              onChange={(e) => setForm((p) => ({ ...p, studentNumber: e.target.value }))}
              required
              inputMode="numeric"
              className="rounded-chip border border-slate-300 px-3 py-3 text-body outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="pin" className="text-body-sm font-semibold text-slate-700">
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
              className="rounded-chip border border-slate-300 px-3 py-3 text-body tracking-widest outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="text-body-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary self-start"
        >
          {pending ? "조회 중…" : "조회하기"}
        </button>
      </form>

      {results && (
        <div className="flex flex-col gap-3">
          {results.length === 0 ? (
            <p className="text-body-sm text-slate-600">
              입력하신 정보와 일치하는 요구사항이 없습니다.
            </p>
          ) : (
            results.map((r) => (
              <div key={r.id} className="card animate-enter p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{r.title}</p>
                  <span
                    className={`badge ${
                      r.status === "답변완료"
                        ? "badge-active"
                        : "badge-muted"
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                {r.category && <p className="mt-1 text-caption text-slate-600">{r.category}</p>}
                <p className="mt-3 whitespace-pre-wrap text-body-sm text-slate-700">{r.content}</p>
                {r.answer && (
                  <div className="mt-3 rounded-control bg-brand-50 px-4 py-3">
                    <p className="text-caption font-semibold text-brand-700">
                      {r.answered_department ?? "학생자치회"} 답변
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-body-sm text-slate-700">{r.answer}</p>
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
