import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { deleteBoardPost } from "../../actions";
import { BoardForm } from "../../board-form";

export const metadata: Metadata = {
  title: "글 수정",
};

export default async function EditBoardPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("board_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!post) {
    notFound();
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-slate-900">글 수정</h1>

      <div className="mt-8">
        <BoardForm post={post} />
      </div>

      <div className="mt-12 max-w-2xl border-t border-slate-200 pt-6">
        <h2 className="text-sm font-semibold text-slate-900">글 삭제</h2>
        <p className="mt-1 text-sm text-slate-600">
          삭제한 글은 되돌릴 수 없습니다.
        </p>
        <form action={deleteBoardPost} className="mt-3">
          <input type="hidden" name="id" value={post.id} />
          <button
            type="submit"
            className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-50"
          >
            이 글 삭제하기
          </button>
        </form>
      </div>
    </>
  );
}
