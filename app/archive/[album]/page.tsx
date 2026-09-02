import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";

import { AlbumGallery } from "./album-gallery";

type Props = {
  params: Promise<{ album: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { album } = await params;
  return { title: `${decodeURIComponent(album)} — 아카이브` };
}

export default async function ArchiveAlbumPage({ params }: Props) {
  const { album: rawAlbum } = await params;
  const album = decodeURIComponent(rawAlbum);

  const supabase = await createClient();
  const { data: photos } = await supabase
    .from("archive_photos")
    .select("id, title, description, image_url, created_at")
    .eq("album", album)
    .order("created_at", { ascending: false });

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
