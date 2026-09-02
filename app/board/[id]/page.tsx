import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { formatDate } from "@/lib/format-date";
import { createClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

async function getPost(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("board_posts")
    .select("id, type, title, content, image_url, is_pinned, created_at")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const post = await getPost((await params).id);
  return { title: post?.title ?? "게시글" };
}

export default async function BoardPostPage({ params }: Params) {
  const post = await getPost((await params).id);

  if (!post) {
    notFound();
  }

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <Link
        href={post.type === "notice" ? "/board?type=notice" : "/board?type=poster"}
        className="text-sm text-brand-700 hover:underline"
      >
        ← 게시판으로 돌아가기
      </Link>

      <header className="mt-6 border-b border-slate-200 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          {post.is_pinned && (
            <span className="rounded bg-brand-700 px-2 py-0.5 text-xs font-semibold text-white">
              고정
            </span>
          )}
          <span
            className={`rounded px-2 py-0.5 text-xs font-semibold ${
              post.type === "notice"
                ? "bg-brand-50 text-brand-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {post.type === "notice" ? "공지" : "포스터"}
          </span>
        </div>

        <h1 className="mt-3 text-2xl font-bold leading-snug text-slate-900 sm:text-3xl">
          {post.title}
        </h1>

        <time
          dateTime={post.created_at}
          className="mt-3 block text-sm text-slate-500"
        >
          {formatDate(post.created_at)}
        </time>
      </header>

      {post.image_url && (
        <Image
          src={post.image_url}
          alt={post.title}
          width={1200}
          height={900}
          sizes="(min-width: 768px) 768px, 100vw"
          className="mt-8 h-auto w-full rounded-lg border border-slate-200"
        />
      )}

      {post.content && (
        // DB 에 저장된 줄바꿈을 그대로 살린다 (HTML 을 넣지 않으므로 XSS 위험 없음)
        <div className="mt-8 whitespace-pre-wrap text-[15px] leading-relaxed text-slate-700">
          {post.content}
        </div>
      )}
    </article>
  );
}
