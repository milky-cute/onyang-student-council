"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type MonthlyFormState = { error: string } | null;

function readText(formData: FormData, key: string): string {
  return (formData.get(key) as string | null)?.trim() ?? "";
}

/** id 가 있으면 수정, 없으면 새 활동 등록. */
export async function saveMonthlyActivity(
  _prevState: MonthlyFormState,
  formData: FormData,
): Promise<MonthlyFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "로그인이 만료되었습니다. 다시 로그인해 주세요." };
  }

  const id = readText(formData, "id");
  const yearMonth = readText(formData, "year_month");
  const department = readText(formData, "department");
  const title = readText(formData, "title");
  const description = readText(formData, "description");
  const imageUrl = readText(formData, "image_url");

  // DB 의 check 제약(^\d{4}-\d{2}$)과 같은 조건을 미리 확인해 에러 메시지를 친절하게 만든다.
  if (!/^\d{4}-\d{2}$/.test(yearMonth)) {
    return { error: "연월을 선택해 주세요." };
  }
  if (!department) {
    return { error: "부서명을 입력해 주세요." };
  }
  if (!title) {
    return { error: "활동명을 입력해 주세요." };
  }

  const values = {
    year_month: yearMonth,
    department,
    title,
    description: description || null,
    image_url: imageUrl || null,
  };

  const { error } = id
    ? await supabase.from("monthly_activities").update(values).eq("id", id)
    : await supabase
        .from("monthly_activities")
        .insert({ ...values, author_id: user.id });

  if (error) {
    return { error: `저장하지 못했습니다: ${error.message}` };
  }

  revalidatePath("/monthly");
  revalidatePath("/admin/monthly");

  redirect("/admin/monthly");
}

export async function deleteMonthlyActivity(formData: FormData) {
  const id = readText(formData, "id");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("monthly_activities").delete().eq("id", id);

  revalidatePath("/monthly");
  revalidatePath("/admin/monthly");

  redirect("/admin/monthly");
}
