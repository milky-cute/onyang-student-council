"use client";

import Link from "next/link";
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
  is_dday: boolean;
  /** 학생회 사업에서 자동으로 만든 일정이면 그 사업 id. 여기서는 고칠 수 없다. */
  project_id: string | null;
};

export function EventRow({ event }: { event: Event }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description ?? "");
  const [eventDate, setEventDate] = useState(event.event_date);
  const [color, setColor] = useState(event.color || DEFAULT_EVENT_COLOR);
  const [isDday, setIsDday] = useState(event.is_dday);
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
        body: JSON.stringify({ title, description, eventDate, color, isDday }),
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-slate-200 px-4 py-3">
        <div>
          <p className="flex items-center gap-2 text-body-sm font-semibold text-slate-900">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: event.color || DEFAULT_EVENT_COLOR }}
            />
            {event.title}
            {event.is_dday && (
              <span className="badge badge-soon">
                D-day
              </span>
            )}
            {event.project_id && <span className="badge badge-info">사업에서 자동</span>}
          </p>
          <p className="mt-0.5 text-caption text-slate-600">{event.event_date}</p>
          {event.description && (
            <p className="mt-1 text-body-sm text-slate-600">{event.description}</p>
          )}
          {error && (
            <p role="alert" className="mt-1 text-body-sm text-red-600">
              {error}
            </p>
          )}
        </div>
        {event.project_id ? (
          <Link
            href={`/admin/projects/${event.project_id}/edit`}
            className="shrink-0 rounded-chip border border-slate-300 px-3 py-2 text-caption font-semibold text-slate-700 hover:bg-slate-50"
          >
            사업에서 고치기
          </Link>
        ) : (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-chip border border-slate-300 px-3 py-2 text-caption font-semibold text-slate-700 hover:bg-slate-50"
            >
              수정
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="rounded-chip border border-red-300 px-3 py-2 text-caption font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              삭제
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className="flex flex-col gap-3 rounded-chip border border-brand-100 bg-brand-50 px-4 py-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="rounded-chip border border-slate-300 px-3 py-2 text-body-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
        />
        <input
          type="date"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
          required
          className="rounded-chip border border-slate-300 px-3 py-2 text-body-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
        />
      </div>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        className="rounded-chip border border-slate-300 px-3 py-2 text-body-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
      />
      <ColorPicker value={color} onChange={setColor} />
      <label className="flex items-center gap-2 text-body-sm font-semibold text-slate-700">
        <input
          type="checkbox"
          checked={isDday}
          onChange={(e) => setIsDday(e.target.checked)}
          className="size-4 rounded border-slate-300 text-brand-700 focus:ring-brand-700"
        />
        D-day로 표시
      </label>
      {error && (
        <p role="alert" className="text-body-sm text-red-600">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-control bg-brand-700 px-3 py-2 text-caption font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-chip border border-slate-300 px-3 py-2 text-caption font-semibold text-slate-700 hover:bg-white"
        >
          취소
        </button>
      </div>
    </form>
  );
}
