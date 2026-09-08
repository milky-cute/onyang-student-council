import type { Metadata } from "next";

import { AdminBackLink } from "@/components/admin-back-link";
import { createClient } from "@/lib/supabase/server";

import { ItemForm } from "./item-form";
import { ItemRow } from "./item-row";

// (protected) 레이아웃이 로그인 여부를 이미 확인하므로 이 페이지는 화면만 담당한다.

export const metadata: Metadata = {
  title: "분실물센터 관리",
};

export default async function AdminLostFoundPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("lost_found_items")
    .select("id, title, description, location, storage_location, image_url, is_resolved, created_at")
    .order("is_resolved", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <>
      <AdminBackLink />
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">분실물센터 관리</h1>
          <p className="mt-2 text-sm text-slate-600">
            학생이 맡긴 습득물을 등록하면 로그인 없이 누구나 /lost-found 에서 볼 수 있습니다.
            주인이 찾아가면 <strong>완료 표시</strong>를 눌러주세요 — 목록에는 남지만 흐리게
            표시되어 같은 물건을 다시 문의하는 일이 줄어듭니다.
          </p>
        </div>

        <ItemForm />

        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-slate-900">등록된 물품</h2>
          {!items || items.length === 0 ? (
            <p className="text-sm text-slate-600">아직 등록된 물품이 없습니다.</p>
          ) : (
            items.map((item) => <ItemRow key={item.id} item={item} />)
          )}
        </div>
      </div>
    </>
  );
}
