"use client";

import { useMemo, useState } from "react";

import {
  DEFAULT_EVENT_COLOR,
  WEEKDAYS,
  buildMonthGrid,
  groupEventsByDate,
  toDateKey,
  weekdayTextClass,
} from "@/lib/calendar-utils";

type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  color: string;
};

export function CalendarView({ events }: { events: CalendarEvent[] }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(
    toDateKey(today.getFullYear(), today.getMonth(), today.getDate()),
  );

  const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);

  const { leadingBlanks, days } = buildMonthGrid(viewYear, viewMonth);
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
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium">
          {WEEKDAYS.map((weekday, index) => (
            <div
              key={weekday}
              className={`py-1 ${weekdayTextClass(index, "text-slate-500")}`}
            >
              {weekday}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}
          {days.map(({ day, dateKey, weekday }) => {
            const dayEvents = eventsByDate.get(dateKey) ?? [];
            const firstEvent = dayEvents[0];
            const extraCount = dayEvents.length - 1;
            const isSelected = dateKey === selectedDate;
            const isToday = dateKey === todayKey;

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => setSelectedDate(dateKey)}
                className={`flex min-h-[3.5rem] flex-col items-center gap-1 rounded-md px-0.5 py-1.5 text-sm transition-colors ${
                  isSelected
                    ? "bg-brand-700 font-semibold"
                    : isToday
                      ? "border border-brand-700 font-semibold"
                      : "hover:bg-slate-100"
                }`}
              >
                <span
                  className={
                    isSelected
                      ? "text-white"
                      : isToday
                        ? "text-brand-700"
                        : weekdayTextClass(weekday)
                  }
                >
                  {day}
                </span>

                {firstEvent && (
                  <span className="flex w-full min-w-0 items-center gap-0.5">
                    <span
                      className="min-w-0 flex-1 truncate rounded px-1 py-px text-[10px] leading-tight text-white"
                      style={{
                        backgroundColor: firstEvent.color || DEFAULT_EVENT_COLOR,
                      }}
                    >
                      {firstEvent.title}
                    </span>
                    {extraCount > 0 && (
                      <span
                        className={`shrink-0 text-[10px] ${
                          isSelected ? "text-white/80" : "text-slate-500"
                        }`}
                      >
                        +{extraCount}
                      </span>
                    )}
                  </span>
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
              <li key={event.id} className="flex gap-2">
                <span
                  aria-hidden
                  className="mt-1.5 size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: event.color || DEFAULT_EVENT_COLOR }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{event.title}</p>
                  {event.description && (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                      {event.description}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
