"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { DEFAULT_SEAT_LABEL, SEAT_LABEL_LIMIT } from "@/lib/pass";
import {
  ALLOWED_IMAGE_TYPES,
  FIELD_LIMITS,
  MAX_IMAGE_SIZE,
  MAX_LINKS,
  MAX_PHOTOS,
  needsUnoptimized,
  type ProjectLinkKind,
  type ProjectWithMedia,
} from "@/lib/projects";

type LinkDraft = {
  /** 화면에서만 쓰는 키 */
  key: string;
  label: string;
  url: string;
  kind: ProjectLinkKind;
  showQr: boolean;
};

const inputClass =
  "rounded-chip border border-slate-300 px-3 py-3 text-body-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700";
const labelClass = "text-body-sm font-semibold text-slate-700";
const smallButton =
  "rounded-chip border border-slate-300 bg-white px-3 py-2 text-caption font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40";

/** 배열에서 index 의 항목을 한 칸 위(-1)/아래(+1)로 옮긴다. */
function move<T>(list: T[], index: number, offset: -1 | 1) {
  const target = index + offset;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/**
 * 사업 등록 · 수정 폼. project 가 있으면 수정.
 *
 * 사진은 고르는 즉시 /api/projects/photos 로 한 장씩 올리고 URL 만 모아 둔다.
 * 저장할 때 사업 정보 + 사진 URL(순서대로, 첫 장이 대표) + 링크를 JSON 으로 한 번에 보낸다.
 */
export function ProjectForm({ project }: { project?: ProjectWithMedia }) {
  const router = useRouter();
  const keyRef = useRef(0);
  const newKey = () => `link-${keyRef.current++}`;

  const [form, setForm] = useState({
    title: project?.title ?? "",
    summary: project?.summary ?? "",
    description: project?.description ?? "",
    startDate: project?.start_date ?? "",
    endDate: project?.end_date ?? "",
    applyStart: project?.apply_start ?? "",
    applyEnd: project?.apply_end ?? "",
    target: project?.target ?? "",
    place: project?.place ?? "",
    contact: project?.contact ?? "",
    passLabel: project?.pass_label ?? "",
    passSeatLabel: project?.pass_seat_label ?? "",
  });
  const [isAlways, setIsAlways] = useState(project?.is_always ?? false);
  const [hasPass, setHasPass] = useState(project?.has_pass ?? false);
  const [passSeatEnabled, setPassSeatEnabled] = useState(project?.pass_seat_enabled ?? false);
  const [isPinned, setIsPinned] = useState(project?.is_pinned ?? false);
  const [photos, setPhotos] = useState<string[]>(project?.photos.map((p) => p.image_url) ?? []);
  const [links, setLinks] = useState<LinkDraft[]>(
    () =>
      project?.links.map((link) => ({
        key: link.id,
        label: link.label,
        url: link.url,
        kind: link.kind,
        showQr: link.show_qr,
      })) ?? [],
  );
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 저장된 사진은 폼에서 빼도 바로 지우지 않는다(저장해야 반영). 새로 올린 사진만 즉시 정리한다.
  const [savedPhotos] = useState(() => new Set(project?.photos.map((p) => p.image_url)));

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateLink(key: string, patch: Partial<LinkDraft>) {
    setLinks((prev) => prev.map((link) => (link.key === key ? { ...link, ...patch } : link)));
  }

  async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;
    setError(null);

    const room = MAX_PHOTOS - photos.length;
    if (files.length > room) {
      setError(`사진은 최대 ${MAX_PHOTOS}장까지 올릴 수 있습니다. (${room}장 더 가능)`);
      return;
    }
    for (const file of files) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        setError(`${file.name}: 사진은 JPG · PNG · WebP 형식만 올릴 수 있습니다.`);
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setError(`${file.name}: 사진 크기는 4MB 이하여야 합니다.`);
        return;
      }
    }

    setUploading(true);
    try {
      for (const file of files) {
        const payload = new FormData();
        payload.set("image", file);
        const res = await fetch("/api/projects/photos", { method: "POST", body: payload });
        const body = await res.json();
        if (!res.ok) {
          setError(`${file.name}: ${body.error ?? "사진을 올리지 못했습니다."}`);
          return;
        }
        setPhotos((prev) => [...prev, body.url as string]);
      }
    } catch {
      setError("사진을 올리는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(url: string) {
    setPhotos((prev) => prev.filter((photo) => photo !== url));
    if (!savedPhotos.has(url)) {
      // 실패해도 고아 파일만 남으므로 기다리지 않는다.
      fetch("/api/projects/photos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      }).catch(() => {});
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    setPending(true);
    try {
      const res = await fetch(project ? `/api/projects/${project.id}` : "/api/projects", {
        method: project ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          isAlways,
          hasPass,
          passSeatEnabled,
          isPinned,
          photos,
          links: links.map(({ label, url, kind, showQr }) => ({ label, url, kind, showQr })),
        }),
      });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error ?? "저장 중 문제가 발생했습니다.");
        return;
      }

      router.push("/admin/projects");
      router.refresh();
    } catch {
      setError("저장 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setPending(false);
    }
  }

  const textField = (
    key: keyof typeof form,
    label: string,
    limit: number,
    placeholder: string,
  ) => (
    <div className="flex flex-col gap-2">
      <label htmlFor={key} className={labelClass}>
        {label}
      </label>
      <input
        id={key}
        value={form[key]}
        onChange={(e) => update(key, e.target.value)}
        maxLength={limit}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  );

  const dateField = (key: keyof typeof form, label: string, min?: string) => (
    <div className="flex flex-col gap-2">
      <label htmlFor={key} className={labelClass}>
        {label}
      </label>
      <input
        id={key}
        type="date"
        value={form[key]}
        min={min || undefined}
        onChange={(e) => update(key, e.target.value)}
        required={key === "startDate"}
        className={inputClass}
      />
    </div>
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="flex max-w-3xl flex-col gap-6 rounded-control border border-slate-200 bg-white px-5 py-6"
    >
      {/* 사진 */}
      <fieldset className="flex flex-col gap-2">
        <legend className={labelClass}>
          사진 (선택, 최대 {MAX_PHOTOS}장 · 첫 장이 대표 사진)
        </legend>
        {photos.length > 0 && (
          <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {photos.map((url, index) => (
              <li key={url} className="flex flex-col gap-2">
                <div className="relative aspect-[4/3] overflow-hidden rounded-control border border-slate-200 bg-slate-100">
                  <Image
                    src={url}
                    unoptimized={needsUnoptimized(url)}
                    alt={`사진 ${index + 1}`}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />
                  {index === 0 && (
                    <span className="absolute left-1.5 top-1.5 rounded-chip bg-brand-700 px-2 py-0.5 text-caption font-semibold text-white">
                      대표
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => move(prev, index, -1))}
                    disabled={index === 0}
                    aria-label={`사진 ${index + 1} 위로`}
                    className={smallButton}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotos((prev) => move(prev, index, 1))}
                    disabled={index === photos.length - 1}
                    aria-label={`사진 ${index + 1} 아래로`}
                    className={smallButton}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removePhoto(url)}
                    className={`${smallButton} ml-auto text-red-600`}
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
        {photos.length < MAX_PHOTOS && (
          <input
            type="file"
            multiple
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            onChange={handleFiles}
            disabled={uploading}
            aria-label="사진 추가"
            className="text-body-sm text-slate-700 file:mr-3 file:rounded-chip file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-body-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
          />
        )}
        <p className="text-caption text-slate-600">
          {uploading ? "사진 올리는 중…" : "JPG · PNG · WebP, 장당 4MB 이하. 여러 장을 한 번에 고를 수 있어요."}
        </p>
      </fieldset>

      {textField("title", "제목 (필수)", FIELD_LIMITS.title, "예: 시험 기간 스터디룸 개방")}
      {textField("summary", "한 줄 소개 (선택)", FIELD_LIMITS.summary, "목록 카드에 보이는 짧은 소개")}

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className={labelClass}>
          설명 (필수)
        </label>
        <textarea
          id="description"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          rows={6}
          maxLength={FIELD_LIMITS.description}
          placeholder="줄바꿈은 그대로 보여요."
          className={inputClass}
        />
      </div>

      {/* 기간 */}
      <fieldset className="flex flex-col gap-3">
        <legend className={labelClass}>행사 기간</legend>
        <label className="flex items-center gap-2 text-body-sm text-slate-700">
          <input
            type="checkbox"
            checked={isAlways}
            onChange={(e) => setIsAlways(e.target.checked)}
            className="size-4 accent-brand-700"
          />
          상시 사업 (기간 없음)
        </label>
        {!isAlways && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {dateField("startDate", "시작일 (필수)")}
            {dateField("endDate", "종료일 (비우면 시작일 하루)", form.startDate)}
          </div>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className={labelClass}>신청 기간 (선택)</legend>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {dateField("applyStart", "신청 시작일")}
          {dateField("applyEnd", "신청 마감일", form.applyStart)}
        </div>
        <p className="text-caption text-slate-600">
          비우면 &lsquo;신청&rsquo; 링크는 사업이 끝나기 전까지 항상 열려 있어요.
        </p>
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {textField("target", "대상 (선택)", FIELD_LIMITS.target, "예: 2학년 전체")}
        {textField("place", "장소 (선택)", FIELD_LIMITS.place, "예: 3층 자율학습실")}
        {textField("contact", "문의처 (선택)", FIELD_LIMITS.contact, "예: 학생회실")}
      </div>

      {/* 링크 */}
      <fieldset className="flex flex-col gap-3">
        <legend className={labelClass}>링크 (선택, 최대 {MAX_LINKS}개)</legend>
        {links.map((link, index) => (
          <div key={link.key} className="flex flex-col gap-3 rounded-control border border-slate-200 px-4 py-3">
            <div className="flex items-center gap-1">
              <span className="text-caption font-semibold text-slate-600">{index + 1}번째 링크</span>
              <button
                type="button"
                onClick={() => setLinks((prev) => move(prev, index, -1))}
                disabled={index === 0}
                aria-label={`${index + 1}번째 링크 위로`}
                className={`${smallButton} ml-auto`}
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => setLinks((prev) => move(prev, index, 1))}
                disabled={index === links.length - 1}
                aria-label={`${index + 1}번째 링크 아래로`}
                className={smallButton}
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => setLinks((prev) => prev.filter((item) => item.key !== link.key))}
                className={`${smallButton} text-red-600`}
              >
                삭제
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr]">
              <input
                value={link.label}
                onChange={(e) => updateLink(link.key, { label: e.target.value })}
                required
                maxLength={FIELD_LIMITS.linkLabel}
                placeholder="버튼 이름 (예: 신청하기)"
                aria-label={`${index + 1}번째 링크 버튼 이름`}
                className={inputClass}
              />
              <input
                type="url"
                value={link.url}
                onChange={(e) => updateLink(link.key, { url: e.target.value })}
                required
                maxLength={FIELD_LIMITS.linkUrl}
                pattern="https://.+"
                placeholder="https://forms.gle/..."
                aria-label={`${index + 1}번째 링크 주소`}
                className={inputClass}
              />
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-body-sm text-slate-700">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`kind-${link.key}`}
                  checked={link.kind === "apply"}
                  onChange={() => updateLink(link.key, { kind: "apply" })}
                  className="size-4 accent-brand-700"
                />
                신청 (신청 기간을 따름)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`kind-${link.key}`}
                  checked={link.kind === "other"}
                  onChange={() => updateLink(link.key, { kind: "other" })}
                  className="size-4 accent-brand-700"
                />
                기타
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={link.showQr}
                  onChange={(e) => updateLink(link.key, { showQr: e.target.checked })}
                  className="size-4 accent-brand-700"
                />
                QR로도 보여주기
              </label>
            </div>
          </div>
        ))}
        {links.length < MAX_LINKS && (
          <button
            type="button"
            onClick={() =>
              setLinks((prev) => [
                ...prev,
                {
                  key: newKey(),
                  label: "",
                  url: "",
                  // 첫 링크는 대개 신청 구글폼이다.
                  kind: prev.length === 0 ? "apply" : "other",
                  showQr: false,
                },
              ])
            }
            className="self-start rounded-chip border border-dashed border-slate-400 px-4 py-2 text-body-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            + 링크 추가
          </button>
        )}
      </fieldset>

      {/* 입장권 · 고정 */}
      <fieldset className="flex flex-col gap-3">
        <legend className={labelClass}>입장권 · 표시</legend>
        <label className="flex items-center gap-2 text-body-sm text-slate-700">
          <input
            type="checkbox"
            checked={hasPass}
            onChange={(e) => setHasPass(e.target.checked)}
            className="size-4 accent-brand-700"
          />
          입장권 사용 (승인한 학생에게 휴대폰 입장권을 보여줍니다)
        </label>
        {hasPass && (
          <div className="flex flex-col gap-2">
            <label htmlFor="passLabel" className={labelClass}>
              입장권 이름 (선택)
            </label>
            <input
              id="passLabel"
              value={form.passLabel}
              onChange={(e) => update("passLabel", e.target.value)}
              maxLength={FIELD_LIMITS.passLabel}
              placeholder={`비우면 "${form.title.trim() || "제목"} 입장권"`}
              className={inputClass}
            />
          </div>
        )}
        {hasPass && (
          <label className="flex items-center gap-2 text-body-sm text-slate-700">
            <input
              type="checkbox"
              checked={passSeatEnabled}
              onChange={(e) => setPassSeatEnabled(e.target.checked)}
              className="size-4 accent-brand-700"
            />
            좌석 표시 (입장권에 학생별 좌석을 보여줍니다)
          </label>
        )}
        {hasPass && passSeatEnabled && (
          <div className="flex flex-col gap-2">
            <label htmlFor="passSeatLabel" className={labelClass}>
              좌석 표시 이름 (선택)
            </label>
            <input
              id="passSeatLabel"
              value={form.passSeatLabel}
              onChange={(e) => update("passSeatLabel", e.target.value)}
              maxLength={SEAT_LABEL_LIMIT}
              placeholder={`비우면 "${DEFAULT_SEAT_LABEL}"`}
              className={inputClass}
            />
          </div>
        )}
        <label className="flex items-center gap-2 text-body-sm text-slate-700">
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
            className="size-4 accent-brand-700"
          />
          상단 고정 (목록 · 홈에서 먼저 보여줍니다)
        </label>
      </fieldset>

      {error && (
        <p role="alert" className="text-body-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || uploading}
        className="self-start rounded-control bg-brand-700 px-4 py-3 text-body-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
      >
        {pending ? "저장 중…" : project ? "수정 내용 저장" : "사업 등록"}
      </button>
    </form>
  );
}
