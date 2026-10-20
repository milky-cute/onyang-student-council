"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UploadForm({ existingAlbums }: { existingAlbums: string[] }) {
  const router = useRouter();
  const [album, setAlbum] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setError(null);
    setSuccess(null);

    if (!album.trim()) {
      setError("앨범 이름을 먼저 입력해주세요.");
      event.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.set("album", album.trim());
    formData.set("title", title.trim());
    formData.set("description", description.trim());
    for (const file of files) {
      formData.append("files", file);
    }

    setPending(true);
    try {
      const res = await fetch("/api/archive", { method: "POST", body: formData });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error ?? "업로드 중 문제가 발생했습니다.");
        return;
      }

      setSuccess(
        `사진 ${body.count}장을 업로드했습니다. 계속 사진을 선택하면 같은 앨범에 추가됩니다.`,
      );
      router.refresh();
    } catch {
      setError("업로드 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setPending(false);
      event.target.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-control border border-slate-200 px-5 py-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="album" className="text-body-sm font-semibold text-slate-700">
          앨범 이름
        </label>
        <input
          id="album"
          list="existing-albums"
          value={album}
          onChange={(e) => setAlbum(e.target.value)}
          placeholder="예: 2026 체육대회"
          className="rounded-chip border border-slate-300 px-3 py-3 text-body-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
        />
        <datalist id="existing-albums">
          {existingAlbums.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="title" className="text-body-sm font-semibold text-slate-700">
          사진 제목 (비워두면 앨범 이름으로 자동 설정)
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-chip border border-slate-300 px-3 py-3 text-body-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="description" className="text-body-sm font-semibold text-slate-700">
          설명 (선택)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="rounded-chip border border-slate-300 px-3 py-3 text-body-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="files" className="text-body-sm font-semibold text-slate-700">
          사진 선택 — 고르는 즉시 업로드됩니다. 여러 장을 한 번에 골라도 되고, 한 장씩 여러
          번 골라도 같은 앨범에 계속 추가됩니다 (장당 5MB 이하)
        </label>
        <input
          id="files"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          disabled={pending}
          onChange={handleFilesSelected}
          className="text-body-sm text-slate-700 file:mr-3 file:rounded-chip file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-body-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100 disabled:opacity-60"
        />
        {pending && <p className="text-caption text-slate-600">업로드 중…</p>}
      </div>

      {error && (
        <p role="alert" className="text-body-sm text-red-600">
          {error}
        </p>
      )}
      {success && <p className="text-body-sm text-brand-700">{success}</p>}
    </div>
  );
}
