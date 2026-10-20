"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { ALLOWED_IMAGE_TYPES, FIELD_LIMITS, MAX_IMAGE_SIZE } from "@/lib/lost-found";

const initialForm = {
  title: "",
  description: "",
  location: "",
  storageLocation: "",
  privateNote: "",
};

const inputClass =
  "rounded-chip border border-slate-300 px-3 py-3 text-body-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700";

export function ItemForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(initialForm);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function update<K extends keyof typeof initialForm>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.title.trim() || !form.location.trim() || !form.storageLocation.trim()) {
      setError("물품 이름, 습득 장소, 보관 장소를 입력해주세요.");
      return;
    }

    const file = fileInputRef.current?.files?.[0];
    if (file) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setError("사진은 JPG · PNG · WebP 형식만 올릴 수 있습니다.");
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setError("사진 크기는 4MB 이하여야 합니다.");
        return;
      }
    }

    const payload = new FormData();
    payload.set("title", form.title);
    payload.set("description", form.description);
    payload.set("location", form.location);
    payload.set("storageLocation", form.storageLocation);
    payload.set("privateNote", form.privateNote);
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
      setSuccess("등록했습니다. 학생들이 /lost-found 에서 바로 볼 수 있어요.");
      router.refresh();
    } catch {
      setError("등록 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-chip border border-slate-200 px-5 py-6"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="text-body-sm font-semibold text-slate-700">
          물품 이름
        </label>
        <input
          id="title"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          required
          maxLength={FIELD_LIMITS.title}
          placeholder="예: 검정색 우산"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-body-sm font-semibold text-slate-700">
          물품 설명 (선택)
        </label>
        <textarea
          id="description"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          rows={2}
          maxLength={FIELD_LIMITS.description}
          placeholder="색깔, 브랜드, 특징 등"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="location" className="text-body-sm font-semibold text-slate-700">
            습득 장소
          </label>
          <input
            id="location"
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
            required
            maxLength={FIELD_LIMITS.location}
            placeholder="예: 3층 복도"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="storageLocation" className="text-body-sm font-semibold text-slate-700">
            보관 장소
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
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="privateNote" className="text-body-sm font-semibold text-slate-700">
          확인용 특징 (관리자만 보임, 선택)
        </label>
        <input
          id="privateNote"
          value={form.privateNote}
          onChange={(e) => update("privateNote", e.target.value)}
          maxLength={FIELD_LIMITS.privateNote}
          placeholder="예: 케이스 뒷면 고양이 스티커, 왼쪽 모서리 흠집"
          className={inputClass}
        />
        <p className="text-caption text-slate-600">
          공개 목록에는 나오지 않아요. 찾으러 온 학생에게 물어봐서 본인 물건인지 확인할 때 쓰세요.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="image" className="text-body-sm font-semibold text-slate-700">
          사진 (선택)
        </label>
        <input
          id="image"
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(",")}
          className="text-body-sm text-slate-700 file:mr-3 file:rounded-chip file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-body-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
        />
        <p className="text-caption text-slate-600">JPG · PNG · WebP, 4MB 이하</p>
      </div>

      {error && (
        <p role="alert" className="text-body-sm text-red-600">
          {error}
        </p>
      )}
      {success && <p className="text-body-sm text-brand-700">{success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-control bg-brand-700 px-4 py-3 text-body-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
      >
        {pending ? "등록 중…" : "습득물 등록"}
      </button>
    </form>
  );
}
