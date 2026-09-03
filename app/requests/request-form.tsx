"use client";

import Link from "next/link";
import { useState } from "react";

const CATEGORIES = ["시설", "급식", "행사", "기타"];

const initialForm = {
  studentName: "",
  studentNumber: "",
  pin: "",
  title: "",
  category: CATEGORIES[0],
  content: "",
};

type FormState = typeof initialForm;

export function RequestForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.studentName.trim() || !form.studentNumber.trim()) {
      setError("이름과 학번을 입력해주세요.");
      return;
    }
    if (!/^\d{4}$/.test(form.pin)) {
      setError("PIN은 숫자 4자리로 입력해주세요.");
      return;
    }
    if (!form.title.trim() || !form.content.trim()) {
      setError("제목과 내용을 입력해주세요.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error ?? "제출 중 문제가 발생했습니다.");
        return;
      }

      setSubmitted(true);
      setForm(initialForm);
    } catch {
      setError("제출 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setPending(false);
    }
  }

  if (submitted) {
    return (
      <div className="mt-8 rounded-lg border border-brand-200 bg-brand-50 px-6 py-10 text-center">
        <p className="text-lg font-semibold text-slate-900">제출이 완료되었습니다</p>
        <p className="mt-2 text-sm text-slate-600">
          입력하신 이름 · 학번 · PIN을 기억해두시면{" "}
          <Link href="/requests/check" className="font-semibold text-brand-700 underline">
            조회 페이지
          </Link>
          에서 답변 상태를 확인할 수 있어요.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-6 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
        >
          다른 요구사항 작성하기
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="studentName" className="text-sm font-medium text-slate-700">
            이름
          </label>
          <input
            id="studentName"
            value={form.studentName}
            onChange={(e) => update("studentName", e.target.value)}
            required
            autoComplete="name"
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
            onChange={(e) => update("studentNumber", e.target.value)}
            required
            inputMode="numeric"
            className="rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="pin" className="text-sm font-medium text-slate-700">
          PIN (숫자 4자리 · 조회할 때 필요해요)
        </label>
        <input
          id="pin"
          value={form.pin}
          onChange={(e) => update("pin", e.target.value.replace(/\D/g, "").slice(0, 4))}
          required
          inputMode="numeric"
          maxLength={4}
          className="w-32 rounded-md border border-slate-300 px-3 py-2.5 text-sm tracking-widest outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="category" className="text-sm font-medium text-slate-700">
          카테고리
        </label>
        <input
          id="category"
          list="category-suggestions"
          value={form.category}
          onChange={(e) => update("category", e.target.value)}
          placeholder="목록에서 고르거나 새로 입력하세요"
          className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700 sm:w-64"
        />
        <datalist id="category-suggestions">
          {CATEGORIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-sm font-medium text-slate-700">
          제목
        </label>
        <input
          id="title"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          required
          className="rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="content" className="text-sm font-medium text-slate-700">
          내용
        </label>
        <textarea
          id="content"
          value={form.content}
          onChange={(e) => update("content", e.target.value)}
          required
          rows={6}
          className="rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:opacity-60"
      >
        {pending ? "제출 중…" : "제출하기"}
      </button>
    </form>
  );
}
