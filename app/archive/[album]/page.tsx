import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { createPublicClient } from "@/lib/supabase/public";

import { AlbumGallery } from "./album-gallery";

type Props = {
  params: Promise<{ album: string }>;
};

// 로그인 상태를 전혀 쓰지 않는 공개 읽기 페이지라 60초 단위로 정적 캐시한다.
// 관리자가 사진을 등록/삭제하면 app/api/archive 라우트의 revalidateTag("archive") 로 즉시 갱신된다.
export const revalidate = 60;

// 앨범 이름이 인자로 들어가 앨범별로 캐시 항목이 분리된다.
const getAlbumPhotos = unstable_cache(
  async (album: string) => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("archive_photos")
      .select("id, title, description, image_url, created_at")
      .eq("album", album)
      .order("created_at", { ascending: false });
    return data;
  },
  ["archive-album-photos"],
  { tags: ["archive"], revalidate: 60 },
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { album } = await params;
  return { title: `${decodeURIComponent(album)} — 아카이브` };
}

export default async function ArchiveAlbumPage({ params }: Props) {
  const { album: rawAlbum } = await params;
  const album = decodeURIComponent(rawAlbum);

  const photos = await getAlbumPhotos(album);

  if (!photos || photos.length === 0) {
    notFound();
  }

  return (
    <>
      <PageHeader title={album} description={`앨범 속 사진 ${photos.length}장`} />
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-16">
        <AlbumGallery photos={photos} />
      </div>
    </>
  );
}
