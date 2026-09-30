"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { FIELD_LIMITS } from "@/lib/lost-found";

const inputClass =
  "rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700";

/** "찾으러 오는 법"의 보관 장소 · 시간 설정. /lost-found 와 상세 페이지 안내 박스에 쓰인다. */
export function PickupSettingsForm({ place, hours }: { place: string; hours: string }) {
  const router = useRouter();
  const [pickupPlace, setPickupPlace] = useState(place);
  const [pickupHours, setPickupHours] = useState(hours);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    if (!pickupPlace.trim() || !pickupHours.trim()) {
      setError("보관 장소와 찾으러 올 수 있는 시간을 입력해주세요.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/lost-found/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickupPlace, pickupHours }),
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error ?? "저장 중 문제가 발생했습니다.");
        return;
      }

      setSaved(true);
      router.refresh();
    } catch {
      setError("저장 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-brand-200 bg-brand-50 px-5 py-5"
    >
      <div>
        <h2 className="text-base font-semibold text-slate-900">찾으러 오는 법 설정</h2>
        <p className="mt-1 text-xs text-slate-600">
          분실물센터 목록과 공유 링크 페이지 맨 위 안내에 그대로 나옵니다.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pickupPlace" className="text-sm font-medium text-slate-700">
            보관 장소
          </label>
          <input
            id="pickupPlace"
            value={pickupPlace}
            onChange={(e) => {
              setPickupPlace(e.target.value);
              setSaved(false);
            }}
            required
            maxLength={FIELD_LIMITS.pickupPlace}
            placeholder="예: 본관 2층 학생회실"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pickupHours" className="text-sm font-medium text-slate-700">
            찾으러 올 수 있는 시간
          </label>
          <input
            id="pickupHours"
            value={pickupHours}
            onChange={(e) => {
              setPickupHours(e.target.value);
              setSaved(false);
            }}
            required
            maxLength={FIELD_LIMITS.pickupHours}
            placeholder="예: 점심시간 (12:30~13:20)"
            className={inputClass}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:opacity-60"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
        {saved && <p className="text-sm font-medium text-brand-700">저장했어요</p>}
      </div>
    </form>
  );
}
