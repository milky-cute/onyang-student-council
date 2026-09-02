import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { formatDate } from "@/lib/format-date";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "학생회 게시판",
};

const FILTERS = [
  { value: "all", label: "전체" },
  { value: "notice", label: "공지" },
  { value: "poster", label: "포스터" },
] as const;

type FilterValue = (typeof FILTERS)[number]["value"];

function parseFilter(value: string | undefined): FilterValue {
  return value === "notice" || value === "poster" ? value : "all";
}

export default async function BoardPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const activeFilter = parseFilter((await searchParams).type);

  const supabase = await createClient();

  let query = supabase
    .from("board_posts")
    .select("id, type, title, content, image_url, is_pinned, created_at")
    // 고정된 글이 항상 맨 위, 나머지는 최신순
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (activeFilter !== "all") {
    query = query.eq("type", activeFilter);
  }

  const { data: posts, error } = await query;

  return (
    <>
      <PageHeader
        title="학생회 게시판"
        description="진행중인 활동 포스터와 학생회 공지사항을 확인하세요."
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
        {/* 종류 필터 */}
        <nav aria-label="게시글 종류 필터" className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => {
            const isActive = filter.value === activeFilter;
            return (
              <Link
                key={filter.value}
                href={filter.value === "all" ? "/board" : `/board?type=${filter.value}`}
                aria-current={isActive ? "true" : undefined}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-700 text-white"
                    : "border border-slate-300 text-slate-600 hover:border-brand-300 hover:text-brand-700"
                }`}
              >
                {filter.label}
              </Link>
            );
          })}
        </nav>

        {error && (
          <p
            role="alert"
            className="mt-8 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            게시글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        )}

        {!error && posts && posts.length === 0 && (
          <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
            <p className="text-sm text-slate-600">
              {activeFilter === "all"
                ? "아직 등록된 글이 없습니다."
                : "이 종류의 글이 아직 없습니다."}
            </p>
          </div>
        )}

        {!error && posts && posts.length > 0 && (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <li key={post.id}>
                <Link
                  href={`/board/${post.id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition-colors hover:border-brand-300"
                >
                  {post.image_url && (
                    <div className="relative aspect-[4/3] w-full bg-slate-100">
                      <Image
                        src={post.image_url}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-5">
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

                    <h2 className="mt-3 text-base font-semibold text-slate-900 group-hover:text-brand-700">
                      {post.title}
                    </h2>

                    {post.content && (
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">
                        {post.content}
                      </p>
                    )}

                    <time
                      dateTime={post.created_at}
                      className="mt-4 text-xs text-slate-500"
                    >
                      {formatDate(post.created_at)}
                    </time>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
