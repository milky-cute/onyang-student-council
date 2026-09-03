"use client";

import { useMemo, useState } from "react";

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toDateKey(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

export function CalendarView({ events }: { events: CalendarEvent[] }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(
    toDateKey(today.getFullYear(), today.getMonth(), today.getDate()),
  );

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const list = map.get(event.event_date) ?? [];
      list.push(event);
      map.set(event.event_date, list);
    }
    return map;
  }, [events]);

  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

  function goToPrevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    return { day, dateKey: toDateKey(viewYear, viewMonth, day) };
  });

  const selectedEvents = eventsByDate.get(selectedDate) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={goToPrevMonth}
          aria-label="이전 달"
          className="flex size-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <p className="text-lg font-bold text-slate-900">
          {viewYear}년 {viewMonth + 1}월
        </p>
        <button
          type="button"
          onClick={goToNextMonth}
          aria-label="다음 달"
          className="flex size-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-5"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {days.map(({ day, dateKey }) => {
            const hasEvents = eventsByDate.has(dateKey);
            const isSelected = dateKey === selectedDate;
            const isToday = dateKey === todayKey;
            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => setSelectedDate(dateKey)}
                className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md text-sm transition-colors ${
                  isSelected
                    ? "bg-brand-700 font-semibold text-white"
                    : isToday
                      ? "border border-brand-700 font-semibold text-brand-700"
                      : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span>{day}</span>
                {hasEvents && (
                  <span
                    aria-hidden
                    className={`size-1 rounded-full ${isSelected ? "bg-white" : "bg-brand-700"}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 px-4 py-4">
        <p className="text-sm font-semibold text-slate-900">{selectedDate.replace(/-/g, ". ")}</p>
        {selectedEvents.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">등록된 일정이 없습니다.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {selectedEvents.map((event) => (
              <li key={event.id}>
                <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                {event.description && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                    {event.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
