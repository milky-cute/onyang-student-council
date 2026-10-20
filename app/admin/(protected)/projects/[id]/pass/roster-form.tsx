"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { MAX_ROSTER_LINES, parseRoster, type RosterEntry, type RosterError } from "@/lib/pass";

type Preview = { toAdd: RosterEntry[]; existing: RosterEntry[]; errors: RosterError[] };

/** 명단 붙여넣기 → 미리보기(추가될 인원 · 형식 오류 줄 · 이미 있는 학번) → 추가 */
export function RosterForm({
  projectId,
  existingNumbers,
}: {
  projectId: string;
  existingNumbers: string[];
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

    const existing = new Set(existingNumbers);
    const { entries, errors } = parseRoster(text);
    setPreview({
      toAdd: entries.filter((entry) => !existing.has(entry.studentNumber)),
      existing: entries.filter((entry) => existing.has(entry.studentNumber)),
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
      setMessage(`${body.added}명을 명단에 추가했습니다.`);
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
        placeholder={"20211 홍길동\n20212 김온양"}
        className="rounded-chip border border-slate-300 px-3 py-3 font-mono text-body-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
      />

      {preview && (
        <div className="flex flex-col gap-3 rounded-chip bg-white px-4 py-3 text-body-sm">
          <p className="font-semibold text-slate-900">
            추가될 인원 {preview.toAdd.length}명
            {preview.existing.length > 0 && ` · 이미 있는 학번 ${preview.existing.length}명`}
            {preview.errors.length > 0 && ` · 형식 오류 ${preview.errors.length}줄`}
          </p>

          {preview.toAdd.length > 0 && (
            <p className="text-slate-700">
              {preview.toAdd.map((e) => `${e.studentNumber} ${e.studentName}`).join(", ")}
            </p>
          )}

          {preview.existing.length > 0 && (
            <div>
              <p className="text-caption font-semibold text-slate-600">이미 있는 학번 (건너뜀)</p>
              <p className="mt-0.5 text-slate-600">
                {preview.existing.map((e) => `${e.studentNumber} ${e.studentName}`).join(", ")}
              </p>
            </div>
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
        {preview && preview.toAdd.length > 0 && (
          <button
            type="button"
            onClick={handleAdd}
            disabled={pending}
            className="min-h-11 rounded-control bg-brand-700 px-4 text-body-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
          >
            {pending ? "추가 중…" : `${preview.toAdd.length}명 추가`}
          </button>
        )}
      </div>
    </div>
  );
}
