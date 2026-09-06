"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import {
  ALLOWED_IMAGE_TYPES,
  FIELD_LIMITS,
  MAX_IMAGE_SIZE,
  type LostFoundTypeValue,
} from "@/lib/lost-found";

const initialForm = {
  title: "",
  description: "",
  location: "",
  storageLocation: "",
  reporterName: "",
  reporterClass: "",
};

const inputClass =
  "rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700";

export function LostFoundForm({ type }: { type: LostFoundTypeValue }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(initialForm);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const isFound = type === "found";

  function update<K extends keyof typeof initialForm>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!form.title.trim() || !form.reporterName.trim() || !form.reporterClass.trim()) {
      setError("물품 설명, 이름, 학급은 필수입니다.");
      return;
    }
    if (isFound && (!form.location.trim() || !form.storageLocation.trim())) {
      setError("주운 장소와 보관 장소를 입력해주세요.");
      return;
    }

    const file = fileInputRef.current?.files?.[0];
    if (file) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setError("사진은 JPG · PNG · WebP 형식만 올릴 수 있습니다.");
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setError("사진 크기는 5MB 이하여야 합니다.");
        return;
      }
    }

    const payload = new FormData();
    payload.set("type", type);
    payload.set("title", form.title);
    payload.set("description", form.description);
    payload.set("location", form.location);
    payload.set("storageLocation", form.storageLocation);
    payload.set("reporterName", form.reporterName);
    payload.set("reporterClass", form.reporterClass);
    if (file) payload.set("image", file);

    setPending(true);
    try {
      const res = await fetch("/api/lost-found", { method: "POST", body: payload });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error ?? "등록 중 문제가 발생했습니다.");
        return;
      }

      setForm(initialForm);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSubmitted(true);
      router.refresh();
    } catch {
      setError("등록 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setPending(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-brand-200 bg-brand-50 px-6 py-8 text-center">
        <p className="text-base font-semibold text-slate-900">등록되었습니다</p>
        <p className="mt-2 text-sm text-slate-600">
          {isFound
            ? "주인이 목록을 보고 찾아갈 수 있어요. 물건은 적어주신 보관 장소에 맡겨주세요."
            : "물건을 본 학생이 적어주신 학급으로 연락할 수 있어요."}
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-5 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white"
        >
          하나 더 등록하기
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-slate-200 px-5 py-6"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-sm font-medium text-slate-700">
          어떤 물건인가요? <span className="text-red-600">*</span>
        </label>
        <input
          id="title"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          required
          maxLength={FIELD_LIMITS.title}
          placeholder="예: 검정색 무선 이어폰"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-slate-700">
          자세한 설명 (선택)
        </label>
        <textarea
          id="description"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          rows={3}
          maxLength={FIELD_LIMITS.description}
          placeholder="색깔, 특징, 브랜드 등을 적어주세요"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="location" className="text-sm font-medium text-slate-700">
            {isFound ? "어디서 주웠나요?" : "어디서 잃어버린 것 같나요? (선택)"}
            {isFound && <span className="text-red-600"> *</span>}
          </label>
          <input
            id="location"
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            required={isFound}
            maxLength={FIELD_LIMITS.location}
            placeholder="예: 3층 복도"
            className={inputClass}
          />
        </div>

        {isFound && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="storageLocation" className="text-sm font-medium text-slate-700">
              어디에 보관 중인가요? <span className="text-red-600">*</span>
            </label>
            <input
              id="storageLocation"
              value={form.storageLocation}
              onChange={(e) => update("storageLocation", e.target.value)}
              required
              maxLength={FIELD_LIMITS.storageLocation}
              placeholder="예: 학생회실"
              className={inputClass}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reporterName" className="text-sm font-medium text-slate-700">
            이름 <span className="text-red-600">*</span>
          </label>
          <input
            id="reporterName"
            value={form.reporterName}
            onChange={(e) => update("reporterName", e.target.value)}
            required
            maxLength={FIELD_LIMITS.reporterName}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reporterClass" className="text-sm font-medium text-slate-700">
            학급 <span className="text-red-600">*</span>
          </label>
          <input
            id="reporterClass"
            value={form.reporterClass}
            onChange={(e) => update("reporterClass", e.target.value)}
            required
            maxLength={FIELD_LIMITS.reporterClass}
            placeholder="예: 2학년 3반"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="image" className="text-sm font-medium text-slate-700">
          사진 (선택)
        </label>
        <input
          id="image"
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          className="text-sm text-slate-600 file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-50"
        />
        <p className="text-xs text-slate-500">JPG · PNG · WebP, 5MB 이하</p>
      </div>

      <p className="text-xs text-slate-500">
        이름과 학급은 목록에 함께 공개됩니다. 전화번호 같은 개인정보는 적지 마세요.
      </p>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:opacity-60"
      >
        {pending ? "등록 중…" : isFound ? "습득물 등록" : "분실물 등록"}
      </button>
    </form>
  );
}
