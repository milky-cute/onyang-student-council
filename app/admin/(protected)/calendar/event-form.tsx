"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { DEFAULT_EVENT_COLOR } from "@/lib/calendar-utils";

import { ColorPicker } from "./color-picker";

const initialForm = {
  title: "",
  description: "",
  eventDate: "",
  color: DEFAULT_EVENT_COLOR,
  isDday: false,
};

type FormState = typeof initialForm;

export function EventForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.title.trim() || !form.eventDate) {
      setError("제목과 날짜를 입력해주세요.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error ?? "일정 등록 중 문제가 발생했습니다.");
        return;
      }

      setForm(initialForm);
      router.refresh();
    } catch {
      setError("일정 등록 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-control border border-slate-200 px-5 py-6"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-2">
          <label htmlFor="title" className="text-body-sm font-semibold text-slate-700">
            제목
          </label>
          <input
            id="title"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            required
            className="rounded-chip border border-slate-300 px-3 py-3 text-body-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="eventDate" className="text-body-sm font-semibold text-slate-700">
            날짜
          </label>
          <input
            id="eventDate"
            type="date"
            value={form.eventDate}
            onChange={(e) => update("eventDate", e.target.value)}
            required
            className="rounded-chip border border-slate-300 px-3 py-3 text-body-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-body-sm font-semibold text-slate-700">
          설명 (선택)
        </label>
        <textarea
          id="description"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          rows={2}
          className="rounded-chip border border-slate-300 px-3 py-3 text-body-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
        />
      </div>

      <ColorPicker value={form.color} onChange={(color) => update("color", color)} />

      <label className="flex items-center gap-2 text-body-sm font-semibold text-slate-700">
        <input
          type="checkbox"
          checked={form.isDday}
          onChange={(e) => update("isDday", e.target.checked)}
          className="size-4 rounded border-slate-300 text-brand-700 focus:ring-brand-700"
        />
        D-day로 표시
      </label>

      {error && (
        <p role="alert" className="text-body-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-control bg-brand-700 px-4 py-3 text-body-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
      >
        {pending ? "등록 중…" : "일정 등록"}
      </button>
    </form>
  );
}
