import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import Image from "next/image";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { createPublicClient } from "@/lib/supabase/public";

// 담당 브랜치: feature/archive-requests

export const metadata: Metadata = {
  title: "아카이브",
};

// 로그인 상태를 전혀 쓰지 않는 공개 읽기 페이지라 60초 단위로 정적 캐시한다.
// 관리자가 사진을 등록/삭제하면 app/api/archive 라우트의 revalidateTag("archive") 로 즉시 갱신된다.
export const revalidate = 60;

type Album = {
  name: string;
  coverUrl: string;
  count: number;
};

// Supabase 클라이언트의 내부 fetch 는 force-cache 를 쓰지 않아 라우트 캐시만으로는
// 매 요청 DB 를 다시 때린다. 쿼리 자체를 unstable_cache 로 감싸 캐시한다.
const getArchivePhotos = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("archive_photos")
      .select("album, image_url, created_at")
      .order("created_at", { ascending: false });
    return data;
  },
  ["archive-photos"],
  { tags: ["archive"], revalidate: 60 },
);

export default async function ArchivePage() {
  const photos = await getArchivePhotos();

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
        description="지난 학생자치회 활동 사진을 앨범별로 모아두었습니다."
        backHref="/"
      />
      <div className="mx-auto w-full max-w-6xl px-4 pt-4 pb-10 lg:pt-6 lg:pb-14">
        {albums.length === 0 ? (
          <div className="rounded-card border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-card-title font-semibold text-slate-900">
              아직 등록된 앨범이 없습니다
            </p>
            <p className="mt-2 text-body-sm text-slate-600">
              학생자치회 활동 사진이 등록되면 이곳에서 볼 수 있어요.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {albums.map((album) => (
              <Link
                key={album.name}
                href={`/archive/${encodeURIComponent(album.name)}`}
                className="card press group overflow-hidden hover:border-brand-100"
              >
                <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                  <Image
                    src={album.coverUrl}
                    alt={album.name}
                    fill
                    sizes="(min-width: 1152px) 268px, (min-width: 768px) calc((100vw - 80px) / 4), (min-width: 640px) calc((100vw - 64px) / 3), calc((100vw - 48px) / 2)"
                    className="object-cover transition-transform duration-(--motion-enter) ease-enter motion-safe:group-hover:scale-105"
                  />
                </div>
                <div className="px-3 py-3">
                  <p className="truncate text-body-sm font-semibold text-slate-900">
                    {album.name}
                  </p>
                  <p className="mt-0.5 text-caption text-slate-600">사진 {album.count}장</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
