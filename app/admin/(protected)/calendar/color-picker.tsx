"use client";

import { COLOR_PRESETS } from "@/lib/calendar-utils";

/** 일정 색상 선택. 등록 폼(EventForm)과 수정 폼(EventRow)이 함께 쓴다. */
export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  const current = value.toLowerCase();

  return (
    <div className="flex flex-col gap-2">
      <span className="text-body-sm font-semibold text-slate-700">색상</span>
      <div className="flex flex-wrap items-center gap-2">
        {COLOR_PRESETS.map((preset) => {
          const selected = current === preset.value;
          return (
            <button
              key={preset.value}
              type="button"
              onClick={() => onChange(preset.value)}
              aria-label={`${preset.label} 색상`}
              aria-pressed={selected}
              style={{ backgroundColor: preset.value }}
              className={`flex size-7 items-center justify-center rounded-full transition ${
                selected
                  ? "ring-2 ring-slate-900 ring-offset-2"
                  : "hover:ring-2 hover:ring-slate-300 hover:ring-offset-2"
              }`}
            >
              {selected && (
                <svg
                  aria-hidden
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-4 text-white"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </button>
          );
        })}

        {/* 프리셋 외의 색도 고를 수 있게 */}
        <input
          type="color"
          value={current}
          onChange={(e) => onChange(e.target.value)}
          aria-label="색상 직접 선택"
          className="size-7 cursor-pointer rounded-full border border-slate-300 bg-white p-0.5"
        />
      </div>
    </div>
  );
}
