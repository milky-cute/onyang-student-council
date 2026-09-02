"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/** 로그아웃 후 공개 홈으로 이동한다. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
