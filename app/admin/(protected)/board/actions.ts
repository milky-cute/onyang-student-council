"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { BoardPostType } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type BoardFormState = { error: string } | null;

function readText(formData: FormData, key: string): string {
  return (formData.get(key) as string | null)?.trim() ?? "";
}

function isBoardPostType(value: string): value is BoardPostType {
  return value === "notice" || value === "poster";
}

/** id 가 있으면 수정, 없으면 새 글 작성. */
export async function saveBoardPost(
  _prevState: BoardFormState,
  formData: FormData,
): Promise<BoardFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
  }

  const id = readText(formData, "id");
  const type = readText(formData, "type");
  const title = readText(formData, "title");
  const content = readText(formData, "content");
  const imageUrl = readText(formData, "image_url");
  const isPinned = formData.get("is_pinned") === "on";

  if (!isBoardPostType(type)) {
    return { error: "글 종류를 선택해 주세요." };
  }
  if (!title) {
    return { error: "제목을 입력해 주세요." };
  }

  const values = {
    type,
    title,
    content: content || null,
    image_url: imageUrl || null,
    is_pinned: isPinned,
  };

  const { error } = id
    ? await supabase.from("board_posts").update(values).eq("id", id)
    : await supabase
        .from("board_posts")
        .insert({ ...values, author_id: user.id });

  if (error) {
    return { error: `저장하지 못했습니다: ${error.message}` };
  }

  revalidatePath("/board");
  revalidatePath("/admin/board");
  if (id) {
    revalidatePath(`/board/${id}`);
  }

  redirect("/admin/board");
}

export async function deleteBoardPost(formData: FormData) {
  const id = readText(formData, "id");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("board_posts").delete().eq("id", id);

  revalidatePath("/board");
  revalidatePath("/admin/board");

  redirect("/admin/board");
}
