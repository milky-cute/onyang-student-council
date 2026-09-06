import type { Metadata } from "next";

import { AdminBackLink } from "@/components/admin-back-link";
import { createClient } from "@/lib/supabase/server";

import { ItemRow } from "./item-row";

// (protected) 레이아웃이 로그인 여부를 이미 확인하므로 이 페이지는 화면만 담당한다.

export const metadata: Metadata = {
  title: "분실물센터 관리",
};

export default async function AdminLostFoundPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("lost_found_items")
    .select(
      "id, type, title, location, storage_location, reporter_name, reporter_class, is_resolved, created_at",
    )
    .order("is_resolved", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <>
      <AdminBackLink />
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">분실물센터 관리</h1>
          <p className="mt-2 text-sm text-slate-600">
            학생이 로그인 없이 등록한 습득물 · 분실물입니다. 주인을 찾았으면 완료 처리하세요.
            완료된 항목은 /lost-found 목록에서 흐리게 표시됩니다. 부적절한 글은 삭제할 수
            있습니다.
          </p>
        </div>

        {!items || items.length === 0 ? (
          <p className="text-sm text-slate-600">아직 등록된 항목이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
