"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { DEFAULT_EVENT_COLOR } from "@/lib/calendar-utils";

import { ColorPicker } from "./color-picker";

type Event = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  color: string;
};

export function EventRow({ event }: { event: Event }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description ?? "");
  const [eventDate, setEventDate] = useState(event.event_date);
  const [color, setColor] = useState(event.color || DEFAULT_EVENT_COLOR);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setError(null);

    if (!title.trim() || !eventDate) {
      setError("제목과 날짜를 입력해주세요.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch(`/api/calendar/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, eventDate, color }),
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error ?? "수정 중 문제가 발생했습니다.");
        return;
      }

      setEditing(false);
      router.refresh();
    } catch {
      setError("수정 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`"${event.title}" 일정을 삭제할까요?`)) return;

    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/calendar/${event.id}`, { method: "DELETE" });
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

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-4 py-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: event.color || DEFAULT_EVENT_COLOR }}
            />
            {event.title}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{event.event_date}</p>
          {event.description && (
            <p className="mt-1 text-sm text-slate-600">{event.description}</p>
          )}
          {error && (
            <p role="alert" className="mt-1 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            수정
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

  return (
    <form
      onSubmit={handleSave}
      className="flex flex-col gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
        />
        <input
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
        />
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
      />
      <ColorPicker value={color} onChange={setColor} />
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-800 disabled:opacity-60"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white"
        >
          취소
        </button>
      </div>
    </form>
  );
}
