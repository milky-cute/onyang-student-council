import type { Metadata } from "next";

import { AdminBackLink } from "@/components/admin-back-link";
import { seoulToday } from "@/lib/calendar-utils";
import { retentionDeadline } from "@/lib/lost-found";
import { getPickupSettings } from "@/lib/lost-found-settings";
import { createClient } from "@/lib/supabase/server";

import { ItemForm } from "./item-form";
import { ItemRow } from "./item-row";
import { PickupSettingsForm } from "./pickup-settings-form";

// (protected) 레이아웃이 로그인 여부를 이미 확인하므로 이 페이지는 화면만 담당한다.

export const metadata: Metadata = {
  title: "분실물센터 관리",
};

export default async function AdminLostFoundPage() {
  const supabase = await createClient();
  const [{ data: items }, { data: privateRows }, pickup] = await Promise.all([
    supabase
      .from("lost_found_items")
      .select("id, title, description, location, storage_location, image_url, is_resolved, created_at")
      .order("is_resolved", { ascending: true })
      .order("created_at", { ascending: false }),
    // 임원 전용 정보. RLS 가 임원이 아니면 빈 결과를 돌려준다.
    supabase.from("lost_found_private").select("item_id, private_note, claimed_by, claimed_at"),
    getPickupSettings(),
  ]);

  const privateByItem = new Map((privateRows ?? []).map((row) => [row.item_id, row]));
  const todayKey = seoulToday().dateKey;

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

        <PickupSettingsForm place={pickup.place} hours={pickup.hours} />

        <ItemForm />

        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-slate-900">등록된 물품</h2>
          {!items || items.length === 0 ? (
            <p className="text-sm text-slate-600">아직 등록된 물품이 없습니다.</p>
          ) : (
            items.map((item) => {
              const deadline = retentionDeadline(item.created_at);
              return (
                <ItemRow
                  key={item.id}
                  item={item}
                  privateInfo={privateByItem.get(item.id) ?? null}
                  deadlineLabel={deadline.label}
                  // 자동 삭제는 하지 않는다. 기한이 지난 미완료 물건만 표시해서 임원이 판단하게 한다.
                  isExpired={!item.is_resolved && todayKey > deadline.dateKey}
                />
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
