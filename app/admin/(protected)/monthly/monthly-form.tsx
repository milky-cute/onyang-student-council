"use client";

import Link from "next/link";
import { useActionState } from "react";

import { ImageUploadField } from "@/components/image-upload-field";
import type { MonthlyActivity } from "@/lib/supabase/database.types";

import { saveMonthlyActivity, type MonthlyFormState } from "./actions";

const FIELD_CLASS =
  "rounded-chip border border-slate-300 px-3 py-3 text-body-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700";

/** 학생회 부서 목록. 새 부서가 생기면 여기만 고치면 된다. */
const DEPARTMENTS = [
  "회장단",
  "학습부",
  "운영기획부",
  "대외협력부",
  "복지안전부",
];

/** 이번 달을 'YYYY-MM' 으로. 새 활동 등록 시 기본값. */
function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** 새 활동 등록과 수정에 함께 쓰는 폼. activity 가 있으면 수정 모드. */
export function MonthlyForm({ activity }: { activity?: MonthlyActivity }) {
  const [state, formAction, pending] = useActionState<
    MonthlyFormState,
    FormData
  >(saveMonthlyActivity, null);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      {activity && <input type="hidden" name="id" value={activity.id} />}

      <div className="flex flex-col gap-2">
        <label
          htmlFor="year_month"
          className="text-body-sm font-semibold text-slate-700"
        >
          연월
        </label>
        <input
          id="year_month"
          name="year_month"
          type="month"
          required
          defaultValue={activity?.year_month ?? currentYearMonth()}
          className={`${FIELD_CLASS} w-full sm:w-56`}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="department"
          className="text-body-sm font-semibold text-slate-700"
        >
          부서
        </label>
        <select
          id="department"
          name="department"
          required
          defaultValue={activity?.department ?? ""}
          className={`${FIELD_CLASS} w-full sm:w-56`}
        >
          <option value="" disabled>
            부서 선택
          </option>
          {DEPARTMENTS.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="text-body-sm font-semibold text-slate-700">
          활동명
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={activity?.title ?? ""}
          className={FIELD_CLASS}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="description"
          className="text-body-sm font-semibold text-slate-700"
        >
          활동 내용
        </label>
        <textarea
          id="description"
          name="description"
          rows={8}
          defaultValue={activity?.description ?? ""}
          className={FIELD_CLASS}
        />
      </div>

      <ImageUploadField
        name="image_url"
        folder="monthly"
        defaultValue={activity?.image_url}
      />

      {state?.error && (
        <p
          role="alert"
          className="rounded-chip border border-red-300 bg-red-50 px-4 py-3 text-body-sm text-red-800"
        >
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-control bg-brand-700 px-5 py-3 text-body-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
        <Link
          href="/admin/monthly"
          className="rounded-chip border border-slate-300 px-5 py-3 text-body-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
