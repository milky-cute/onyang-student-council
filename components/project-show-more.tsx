"use client";

import { useState } from "react";

/**
 * 끝난 사업 목록. 처음에는 initial 개만 보여주고 "더 보기" 버튼으로 나머지를 펼친다.
 * 카드는 서버에서 그려서 넘겨받는다.
 */
export function ProjectShowMore({
  items,
  initial,
  label,
}: {
  items: { key: string; node: React.ReactNode }[];
  initial: number;
  label: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, initial);

  return (
    <>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
        {visible.map((item) => (
          <li key={item.key}>{item.node}</li>
        ))}
      </ul>
      {!expanded && items.length > initial && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex min-h-11 items-center justify-center self-center rounded-xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
        >
          {label} ({items.length - initial})
        </button>
      )}
    </>
  );
}
