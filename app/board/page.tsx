import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { formatDate } from "@/lib/format-date";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "학생자치회 게시판",
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
    .select("id, type, title, content, image_url, is_pinned, department, created_at")
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
        title="학생자치회 게시판"
        description="진행중인 활동 포스터와 학생자치회 공지사항을 확인하세요."
        backHref="/"
      />

      <div className="mx-auto w-full max-w-6xl px-4 pt-4 pb-10 lg:pt-6 lg:pb-14">
        {/* 종류 필터 */}
        <nav aria-label="게시글 종류 필터" className="flex flex-wrap gap-2">
          {FILTERS.map((filter) => {
            const isActive = filter.value === activeFilter;
            return (
              <Link
                key={filter.value}
                href={filter.value === "all" ? "/board" : `/board?type=${filter.value}`}
                aria-current={isActive ? "true" : undefined}
                className={`press inline-flex min-h-11 items-center rounded-full px-4 text-body-sm font-semibold ${
                  isActive
                    ? "bg-brand-700 text-white"
                    : "border border-slate-300 text-slate-600 hover:border-brand-100 hover:text-brand-700"
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
            className="mt-8 rounded-chip border border-red-300 bg-red-50 px-4 py-3 text-body-sm text-red-800"
          >
            게시글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </p>
        )}

        {!error && posts && posts.length === 0 && (
          <div className="mt-8 rounded-card border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-body-sm text-slate-600">
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
                  className="card press group flex h-full flex-col overflow-hidden hover:border-brand-100"
                >
                  {post.image_url && (
                    <div className="relative aspect-[4/3] w-full bg-slate-100">
                      <Image
                        src={post.image_url}
                        alt=""
                        fill
                        sizes="(min-width: 1152px) 363px, (min-width: 1024px) calc((100vw - 64px) / 3), (min-width: 640px) calc((100vw - 48px) / 2), calc(100vw - 32px)"
                        className="object-cover"
                      />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      {post.is_pinned && (
                        <span className="badge badge-active">
                          고정
                        </span>
                      )}
                      <span
                        className={`badge ${
                          post.type === "notice"
                            ? "badge-info"
                            : "badge-muted"
                        }`}
                      >
                        {post.type === "notice" ? "공지" : "포스터"}
                      </span>
                      <span className="badge badge-muted">
                        {post.department ?? "학생자치회"}
                      </span>
                    </div>

                    <h2 className="mt-3 text-card-title font-semibold text-slate-900 group-hover:text-brand-700">
                      {post.title}
                    </h2>

                    {post.content && (
                      <p className="mt-2 line-clamp-2 text-body-sm leading-relaxed text-slate-600">
                        {post.content}
                      </p>
                    )}

                    <time
                      dateTime={post.created_at}
                      className="mt-4 text-caption text-slate-600"
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
