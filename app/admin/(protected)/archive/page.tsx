import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";

import { PhotoGrid } from "./photo-grid";
import { UploadForm } from "./upload-form";

// 담당 브랜치: feature/archive-requests
// (protected) 레이아웃이 로그인 여부를 이미 확인하므로 이 페이지는 화면만 담당한다.

export const metadata: Metadata = {
  title: "아카이브 관리",
};

type Photo = {
  id: string;
  title: string;
  image_url: string;
};

export default async function AdminArchivePage() {
  const supabase = await createClient();
  const { data: photos } = await supabase
    .from("archive_photos")
    .select("id, title, image_url, album, created_at")
    .order("created_at", { ascending: false });

  const albumMap = new Map<string, Photo[]>();
  for (const photo of photos ?? []) {
    if (!photo.album) continue;
    const list = albumMap.get(photo.album) ?? [];
    list.push({ id: photo.id, title: photo.title, image_url: photo.image_url });
    albumMap.set(photo.album, list);
  }
  const albums = Array.from(albumMap.entries()).map(([name, photos]) => ({ name, photos }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">아카이브 관리</h1>
        <p className="mt-2 text-sm text-slate-600">
          앨범 이름을 입력하고 사진을 선택하면 바로 업로드됩니다. 기존 앨범 이름을 그대로
          입력하면 같은 앨범에 사진이 추가됩니다.
        </p>
      </div>

      <UploadForm existingAlbums={albums.map((a) => a.name)} />

      <div className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-slate-900">등록된 앨범</h2>
        {albums.length === 0 ? (
          <p className="text-sm text-slate-600">아직 등록된 앨범이 없습니다.</p>
        ) : (
          albums.map((album) => (
            <div key={album.name} className="rounded-lg border border-slate-200 px-4 py-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-medium text-slate-900">{album.name}</p>
                <span className="text-xs text-slate-500">사진 {album.photos.length}장</span>
              </div>
              <PhotoGrid photos={album.photos} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
