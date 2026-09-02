import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";

import { UploadForm } from "./upload-form";

// 담당 브랜치: feature/archive-requests
// (protected) 레이아웃이 로그인 여부를 이미 확인하므로 이 페이지는 화면만 담당한다.

export const metadata: Metadata = {
  title: "아카이브 관리",
};

export default async function AdminArchivePage() {
  const supabase = await createClient();
  const { data: photos } = await supabase
    .from("archive_photos")
    .select("album, created_at")
    .order("created_at", { ascending: false });

  const albumCounts = new Map<string, number>();
  for (const photo of photos ?? []) {
    if (!photo.album) continue;
    albumCounts.set(photo.album, (albumCounts.get(photo.album) ?? 0) + 1);
  }
  const albums = Array.from(albumCounts.entries()).map(([name, count]) => ({ name, count }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">아카이브 관리</h1>
        <p className="mt-2 text-sm text-slate-600">
          앨범 이름을 입력하고 사진을 여러 장 골라 한 번에 업로드하세요. 기존 앨범 이름을
          그대로 입력하면 같은 앨범에 사진이 추가됩니다.
        </p>
      </div>

      <UploadForm existingAlbums={albums.map((a) => a.name)} />

      <div>
        <h2 className="text-lg font-semibold text-slate-900">등록된 앨범</h2>
        {albums.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">아직 등록된 앨범이 없습니다.</p>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-slate-200 rounded-lg border border-slate-200">
            {albums.map((album) => (
              <li
                key={album.name}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span className="font-medium text-slate-900">{album.name}</span>
                <span className="text-slate-500">사진 {album.count}장</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
