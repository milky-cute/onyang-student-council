"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { MAX_ROSTER_LINES, parseRoster, type RosterEntry, type RosterError } from "@/lib/pass";

type Preview = {
  toAdd: RosterEntry[];
  existing: RosterEntry[];
  /** 이미 있는 학번 중 좌석이 바뀌는 학생 (좌석 표시를 쓰는 사업만) */
  seatChanges: RosterEntry[];
  /** 붙여넣은 글 안에서 두 번 이상 나온 좌석 */
  duplicateSeats: string[];
  errors: RosterError[];
};

/** "학번 이름" 또는 좌석이 있으면 "학번 이름 좌석" */
function entryText(entry: RosterEntry) {
  return [entry.studentNumber, entry.studentName, entry.seat].filter(Boolean).join(" ");
}

/**
 * 명단 붙여넣기 → 미리보기(추가될 인원 · 형식 오류 줄 · 이미 있는 학번) → 추가.
 * seatLabel 이 있으면(좌석 표시를 쓰는 사업) "학번 이름 좌석" 3칸도 받는다.
 */
export function RosterForm({
  projectId,
  existing,
  seatLabel,
}: {
  projectId: string;
  existing: { student_number: string; seat: string | null }[];
  /** 좌석 표시 이름. 좌석 표시를 안 쓰는 사업이면 null */
  seatLabel: string | null;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handlePreview() {
    setError(null);
    setMessage(null);

    if (text.split(/\r?\n/).length > MAX_ROSTER_LINES) {
      setError(`한 번에 ${MAX_ROSTER_LINES}줄까지 붙여넣을 수 있습니다.`);
      return;
    }

    // 학번 → 지금 좌석. 서버(api/pass/holders)와 같은 기준으로 나눈다.
    const saved = new Map(existing.map((holder) => [holder.student_number, holder.seat]));
    const { entries, errors } = parseRoster(text, seatLabel !== null);
    const isSeatChange = (entry: RosterEntry) =>
      entry.seat !== undefined && entry.seat !== saved.get(entry.studentNumber);

    const seatCounts = new Map<string, number>();
    for (const entry of entries) {
      if (entry.seat) seatCounts.set(entry.seat, (seatCounts.get(entry.seat) ?? 0) + 1);
    }

    setPreview({
      toAdd: entries.filter((entry) => !saved.has(entry.studentNumber)),
      existing: entries.filter((entry) => saved.has(entry.studentNumber) && !isSeatChange(entry)),
      seatChanges: entries.filter((entry) => saved.has(entry.studentNumber) && isSeatChange(entry)),
      duplicateSeats: [...seatCounts].filter(([, count]) => count > 1).map(([seat]) => seat),
      errors,
    });
  }

  async function handleAdd() {
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/pass/holders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, text }),
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error ?? "추가 중 문제가 발생했습니다.");
        return;
      }

      setText("");
      setPreview(null);
      setMessage(
        `${body.added}명을 명단에 추가했습니다.` +
          (body.updated > 0 ? ` ${body.updated}명의 ${seatLabel}을(를) 바꿨습니다.` : ""),
      );
      router.refresh();
    } catch {
      setError("추가 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-chip border border-brand-100 bg-brand-50 px-5 py-5">
      <div>
        <h2 className="text-body font-semibold text-slate-900">명단 추가</h2>
        <p className="mt-1 text-caption text-slate-600">
          한 줄에 한 명씩 &ldquo;학번 이름&rdquo;을 붙여넣으세요. 탭 · 공백 · 쉼표 모두 구분자로
          쓸 수 있어 구글 시트에서 학번 · 이름 두 열을 복사해 그대로 붙여넣어도 됩니다.
        </p>
        {seatLabel && (
          <p className="mt-1 text-caption text-slate-600">
            {seatLabel}까지 넣으려면 &ldquo;학번 이름 좌석&rdquo; 순서로 세 칸을 붙여넣어도 됩니다(예:
            20211 홍길동 A-12). 이미 있는 학번은 {seatLabel}만 바뀌고, 두 칸만 쓴 줄은 이미
            들어간 {seatLabel}을(를) 그대로 둡니다.
          </p>
        )}
      </div>

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setPreview(null);
          setMessage(null);
        }}
        rows={8}
        aria-label="학번 이름 명단"
        placeholder={seatLabel ? "20211 홍길동 A-12\n20212 김온양 A-13" : "20211 홍길동\n20212 김온양"}
        className="rounded-chip border border-slate-300 px-3 py-3 font-mono text-body-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
      />

      {preview && (
        <div className="flex flex-col gap-3 rounded-chip bg-white px-4 py-3 text-body-sm">
          <p className="font-semibold text-slate-900">
            추가될 인원 {preview.toAdd.length}명
            {preview.seatChanges.length > 0 &&
              ` · ${seatLabel} 변경 ${preview.seatChanges.length}명`}
            {preview.existing.length > 0 && ` · 이미 있는 학번 ${preview.existing.length}명`}
            {preview.errors.length > 0 && ` · 형식 오류 ${preview.errors.length}줄`}
          </p>

          {preview.toAdd.length > 0 && (
            <p className="text-slate-700">{preview.toAdd.map(entryText).join(", ")}</p>
          )}

          {preview.seatChanges.length > 0 && (
            <div>
              <p className="text-caption font-semibold text-slate-600">
                이미 있는 학번 ({seatLabel}만 바꿈)
              </p>
              <p className="mt-0.5 text-slate-700">
                {preview.seatChanges.map(entryText).join(", ")}
              </p>
            </div>
          )}

          {preview.existing.length > 0 && (
            <div>
              <p className="text-caption font-semibold text-slate-600">이미 있는 학번 (건너뜀)</p>
              <p className="mt-0.5 text-slate-600">
                {preview.existing.map(entryText).join(", ")}
              </p>
            </div>
          )}

          {preview.duplicateSeats.length > 0 && (
            <p className="text-amber-900">
              <span className="badge badge-soon">중복</span> 붙여넣은 명단에 같은 {seatLabel}이(가)
              두 번 이상 있어요: {preview.duplicateSeats.join(", ")} (저장은 할 수 있어요)
            </p>
          )}

          {preview.errors.length > 0 && (
            <div>
              <p className="text-caption font-semibold text-red-700">형식 오류 (추가하지 않음)</p>
              <ul className="mt-0.5 flex flex-col gap-0.5 text-red-700">
                {preview.errors.map((e) => (
                  <li key={e.line}>
                    {e.line}번째 줄 &ldquo;{e.text}&rdquo; — {e.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="text-body-sm text-red-600">
          {error}
        </p>
      )}
      {message && <p className="text-body-sm text-brand-700">{message}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handlePreview}
          disabled={!text.trim()}
          className="min-h-11 rounded-chip border border-slate-300 bg-white px-4 text-body-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60"
        >
          미리보기
        </button>
        {preview && (preview.toAdd.length > 0 || preview.seatChanges.length > 0) && (
          <button
            type="button"
            onClick={handleAdd}
            disabled={pending}
            className="min-h-11 rounded-control bg-brand-700 px-4 text-body-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
          >
            {pending
              ? "추가 중…"
              : [
                  preview.toAdd.length > 0 && `${preview.toAdd.length}명 추가`,
                  preview.seatChanges.length > 0 &&
                    `${preview.seatChanges.length}명 ${seatLabel} 변경`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
          </button>
        )}
      </div>
    </div>
  );
}
