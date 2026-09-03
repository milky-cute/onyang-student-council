"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Photo = {
  id: string;
  title: string;
  image_url: string;
};

export function PhotoGrid({ photos }: { photos: Photo[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(photo: Photo) {
    if (!window.confirm(`"${photo.title}" 사진을 삭제할까요? 되돌릴 수 없습니다.`)) return;

    setError(null);
    setDeletingId(photo.id);
    try {
      const res = await fetch(`/api/archive/${photo.id}`, { method: "DELETE" });
      const body = await res.json();

      if (!res.ok) {
        setError(body.error ?? "삭제 중 문제가 발생했습니다.");
        return;
      }

      router.refresh();
    } catch {
      setError("삭제 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative aspect-square overflow-hidden rounded-md bg-slate-100"
          >
            <Image
              src={photo.image_url}
              alt={photo.title}
              fill
              sizes="(min-width: 768px) 16vw, 33vw"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => handleDelete(photo)}
              disabled={deletingId === photo.id}
              aria-label={`${photo.title} 삭제`}
              className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-red-600 disabled:opacity-60"
            >
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="size-3.5"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
