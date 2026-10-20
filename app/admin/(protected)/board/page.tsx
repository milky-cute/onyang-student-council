import type { Metadata } from "next";
import Link from "next/link";

import { AdminBackLink } from "@/components/admin-back-link";
import { formatDate } from "@/lib/format-date";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "게시판 관리",
};

export default async function AdminBoardPage() {
  const supabase = await createClient();

  const { data: posts, error } = await supabase
    .from("board_posts")
    .select("id, type, title, is_pinned, created_at")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <>
      <AdminBackLink />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-title font-bold text-slate-900">게시판 관리</h1>
          <p className="mt-1 text-body-sm text-slate-600">
            공지와 활동 포스터를 등록하고 수정합니다.
          </p>
        </div>
        <Link
          href="/admin/board/new"
          className="rounded-control bg-brand-700 px-4 py-3 text-body-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          새 글 작성
        </Link>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-8 rounded-chip border border-red-300 bg-red-50 px-4 py-3 text-body-sm text-red-800"
        >
          목록을 불러오지 못했습니다: {error.message}
        </p>
      )}

      {!error && posts && posts.length === 0 && (
        <div className="mt-8 rounded-chip border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
          <p className="text-body-sm text-slate-600">아직 작성한 글이 없습니다.</p>
        </div>
      )}

      {!error && posts && posts.length > 0 && (
        <ul className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
          {posts.map((post) => (
            <li
              key={post.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {post.is_pinned && (
                    <span className="rounded-chip bg-brand-700 px-2 py-0.5 text-caption font-semibold text-white">
                      고정
                    </span>
                  )}
                  <span
                    className={`rounded px-2 py-0.5 text-caption font-semibold ${
                      post.type === "notice"
                        ? "bg-brand-50 text-brand-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {post.type === "notice" ? "공지" : "포스터"}
                  </span>
                  <time
                    dateTime={post.created_at}
                    className="text-caption text-slate-600"
                  >
                    {formatDate(post.created_at)}
                  </time>
                </div>
                <p className="mt-1 truncate text-body font-semibold text-slate-900">
                  {post.title}
                </p>
              </div>

              <div className="flex shrink-0 gap-3 text-body-sm">
                <Link
                  href={`/board/${post.id}`}
                  className="text-slate-600 hover:text-brand-700"
                >
                  보기
                </Link>
                <Link
                  href={`/admin/board/${post.id}/edit`}
                  className="font-semibold text-brand-700 hover:underline"
                >
                  수정
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
