"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const initialForm = { studentName: "", studentNumber: "", pin: "" };

const inputClass =
  "min-h-11 rounded-chip border border-slate-300 px-3 py-3 text-body outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700";

/** 입장권 로그인 폼. 성공하면 쿠키가 생기고, 화면을 새로 그려 입장권을 보여준다. */
export function PassLoginForm() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.studentName.trim() || !form.studentNumber.trim()) {
      setError("이름과 학번을 입력해 주세요.");
      return;
    }
    if (!/^\d{4}$/.test(form.pin)) {
      setError("PIN은 숫자 4자리로 입력해 주세요.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/pass/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error ?? "로그인 중 문제가 발생했어요.");
        return;
      }

      router.refresh();
    } catch {
      setError("로그인 중 문제가 발생했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-4 p-5">
      <div>
        <h2 className="text-card-title font-bold text-slate-900">본인 확인</h2>
        <p className="mt-1 text-body-sm text-slate-600">
          처음이라면 지금 입력한 4자리가 내 PIN이 돼요. 다음부터는 같은 PIN을 입력해 주세요.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="passStudentName" className="text-body-sm font-semibold text-slate-700">
          이름
        </label>
        <input
          id="passStudentName"
          value={form.studentName}
          onChange={(e) => setForm((p) => ({ ...p, studentName: e.target.value }))}
          required
          autoComplete="name"
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="passStudentNumber" className="text-body-sm font-semibold text-slate-700">
          학번
        </label>
        <input
          id="passStudentNumber"
          value={form.studentNumber}
          onChange={(e) => setForm((p) => ({ ...p, studentNumber: e.target.value.trim() }))}
          required
          inputMode="numeric"
          placeholder="예: 20211"
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="passPin" className="text-body-sm font-semibold text-slate-700">
          PIN (숫자 4자리)
        </label>
        <input
          id="passPin"
          type="password"
          value={form.pin}
          onChange={(e) =>
            setForm((p) => ({ ...p, pin: e.target.value.replace(/\D/g, "").slice(0, 4) }))
          }
          required
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          className={`${inputClass} tracking-widest`}
        />
      </div>

      {error && (
        <p role="alert" className="text-body-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-control bg-brand-700 px-4 text-body font-semibold text-white transition-colors hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700 disabled:opacity-60"
      >
        {pending ? "확인 중…" : "입장권 열기"}
      </button>
    </form>
  );
}
