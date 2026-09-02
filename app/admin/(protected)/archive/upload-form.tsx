"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UploadForm({ existingAlbums }: { existingAlbums: string[] }) {
  const router = useRouter();
  const [album, setAlbum] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!album.trim()) {
      setError("앨범 이름을 입력해주세요.");
      return;
    }
    if (files.length === 0) {
      setError("업로드할 사진을 선택해주세요.");
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

      setSuccess(`사진 ${body.count}장을 업로드했습니다.`);
      setTitle("");
      setDescription("");
      setFiles([]);
      router.refresh();
    } catch {
      setError("업로드 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-lg border border-slate-200 px-5 py-6"
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="album" className="text-sm font-medium text-slate-700">
          앨범 이름
        </label>
        <input
          id="album"
          list="existing-albums"
          value={album}
          onChange={(e) => setAlbum(e.target.value)}
          required
          placeholder="예: 2026 체육대회"
          className="rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
        />
        <datalist id="existing-albums">
          {existingAlbums.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-sm font-medium text-slate-700">
          사진 제목 (비워두면 앨범 이름으로 자동 설정)
        </label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium text-slate-700">
          설명 (선택)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="files" className="text-sm font-medium text-slate-700">
          사진 선택 (여러 장 가능 · 장당 5MB 이하)
        </label>
        <input
          id="files"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
        />
        {files.length > 0 && <p className="text-xs text-slate-500">{files.length}장 선택됨</p>}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {success && <p className="text-sm text-brand-700">{success}</p>}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:opacity-60"
      >
        {pending ? "업로드 중…" : "업로드"}
      </button>
    </form>
  );
}
