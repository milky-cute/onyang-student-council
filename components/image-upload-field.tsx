"use client";

import Image from "next/image";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { STORAGE_BUCKET } from "@/lib/supabase/env";

/**
 * 이미지 한 장을 Supabase Storage 에 올리고, 결과 URL 을 hidden input 으로 폼에 실어 보낸다.
 *
 * 파일은 브라우저에서 Storage 로 바로 올라간다(서버를 거치지 않음).
 * 업로드 권한은 Storage 정책의 is_officer() 가 검사한다.
 */
export function ImageUploadField({
  name,
  folder,
  defaultValue,
}: {
  /** 폼에 실릴 hidden input 의 name */
  name: string;
  /** media 버킷 안의 폴더 */
  folder: "board" | "monthly";
  defaultValue?: string | null;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const supabase = createClient();
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${folder}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (uploadError) {
      setError(`업로드에 실패했습니다: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    setUrl(data.publicUrl);
    setUploading(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-body-sm font-semibold text-slate-700">이미지</span>

      <input type="hidden" name={name} value={url} />

      {url && (
        <div className="relative aspect-[4/3] w-full max-w-xs overflow-hidden rounded-chip border border-slate-200 bg-slate-100">
          <Image
            src={url}
            alt="업로드한 이미지 미리보기"
            fill
            sizes="320px"
            className="object-cover"
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          disabled={uploading}
          className="text-body-sm text-slate-600 file:mr-3 file:rounded-chip file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-body-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
        />
        {url && !uploading && (
          <button
            type="button"
            onClick={() => setUrl("")}
            className="text-body-sm text-slate-600 hover:text-red-600"
          >
            이미지 제거
          </button>
        )}
      </div>

      {uploading && <p className="text-body-sm text-slate-600">업로드 중…</p>}
      {error && (
        <p role="alert" className="text-body-sm text-red-600">
          {error}
        </p>
      )}
      <p className="text-caption text-slate-600">
        JPG · PNG · WebP · GIF, 파일당 5MB 까지
      </p>
    </div>
  );
}
