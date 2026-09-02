import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";

// 담당 브랜치: feature/archive-requests

export const metadata: Metadata = {
  title: "아카이브",
};

type Album = {
  name: string;
  coverUrl: string;
  count: number;
};

export default async function ArchivePage() {
  const supabase = await createClient();
  const { data: photos } = await supabase
    .from("archive_photos")
    .select("album, image_url, created_at")
    .order("created_at", { ascending: false });

  const albums: Album[] = [];
  const seen = new Map<string, Album>();

  for (const photo of photos ?? []) {
    if (!photo.album) continue;
    const existing = seen.get(photo.album);
    if (existing) {
      existing.count += 1;
    } else {
      const album: Album = { name: photo.album, coverUrl: photo.image_url, count: 1 };
      seen.set(photo.album, album);
      albums.push(album);
    }
  }

  return (
    <>
      <PageHeader
        title="아카이브"
        description="지난 학생회 활동 사진을 앨범별로 모아두었습니다."
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-16">
        {albums.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
            <p className="text-lg font-semibold text-slate-900">
              아직 등록된 앨범이 없습니다
            </p>
            <p className="mt-2 text-sm text-slate-600">
              학생회 활동 사진이 등록되면 이곳에서 볼 수 있어요.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {albums.map((album) => (
              <Link
                key={album.name}
                href={`/archive/${encodeURIComponent(album.name)}`}
                className="group overflow-hidden rounded-lg border border-slate-200 transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                  <Image
                    src={album.coverUrl}
                    alt={album.name}
                    fill
                    sizes="(min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                  />
                </div>
                <div className="px-3 py-2.5">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {album.name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">사진 {album.count}장</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
