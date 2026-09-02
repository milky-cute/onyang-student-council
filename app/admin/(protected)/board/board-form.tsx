"use client";

import Link from "next/link";
import { useActionState } from "react";

import { ImageUploadField } from "@/components/image-upload-field";
import type { BoardPost } from "@/lib/supabase/database.types";

import { saveBoardPost, type BoardFormState } from "./actions";

const FIELD_CLASS =
  "rounded-md border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-brand-700 focus:ring-1 focus:ring-brand-700";

/** 새 글 작성과 수정에 함께 쓰는 폼. post 가 있으면 수정 모드. */
export function BoardForm({ post }: { post?: BoardPost }) {
  const [state, formAction, pending] = useActionState<BoardFormState, FormData>(
    saveBoardPost,
    null,
  );

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      {post && <input type="hidden" name="id" value={post.id} />}

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-slate-700">글 종류</legend>
        <div className="mt-1 flex gap-4">
          {(
            [
              { value: "notice", label: "공지" },
              { value: "poster", label: "포스터" },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 text-sm text-slate-700"
            >
              <input
                type="radio"
                name="type"
                value={option.value}
                defaultChecked={(post?.type ?? "notice") === option.value}
                className="size-4 accent-brand-700"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="title" className="text-sm font-medium text-slate-700">
          제목
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={post?.title ?? ""}
          className={FIELD_CLASS}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="content" className="text-sm font-medium text-slate-700">
          본문
        </label>
        <textarea
          id="content"
          name="content"
          rows={10}
          defaultValue={post?.content ?? ""}
          className={FIELD_CLASS}
        />
      </div>

      <ImageUploadField
        name="image_url"
        folder="board"
        defaultValue={post?.image_url}
      />

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="is_pinned"
          defaultChecked={post?.is_pinned ?? false}
          className="size-4 accent-brand-700"
        />
        목록 맨 위에 고정하기
      </label>

      {state?.error && (
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800 disabled:opacity-60"
        >
          {pending ? "저장 중…" : "저장"}
        </button>
        <Link
          href="/admin/board"
          className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          취소
        </Link>
      </div>
    </form>
  );
}
