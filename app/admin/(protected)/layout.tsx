import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { signOut } from "./actions";

/**
 * 임원 전용 레이아웃.
 *
 * `(protected)` 는 URL 에 나타나지 않는 라우트 그룹이라
 * 이 레이아웃은 /admin 이하에만 적용되고 /admin/login 에는 적용되지 않는다.
 *
 * proxy.ts 에서 이미 미로그인 접근을 막지만, 프록시 설정이 바뀌어도
 * 데이터가 새지 않도록 여기서 한 번 더 확인한다(이중 방어).
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  // 로그인은 했지만 officers 테이블에 등록되지 않은 계정일 수 있다.
  const { data: officer } = await supabase
    .from("officers")
    .select("name, department, role")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="text-caption font-semibold text-brand-700">임원 전용</p>
          <p className="mt-1 text-card-title font-bold text-slate-900">
            {officer?.name ?? user.email}
          </p>
          {officer?.department && (
            <p className="text-body-sm text-slate-600">
              {officer.department} · {officer.role}
            </p>
          )}
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="rounded-chip border border-slate-300 px-4 py-2 text-body-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-100 hover:text-slate-900"
          >
            로그아웃
          </button>
        </form>
      </div>

      {!officer && (
        <p
          role="alert"
          className="mt-6 rounded-chip border border-amber-300 bg-amber-50 px-4 py-3 text-body-sm text-amber-900"
        >
          이 계정({user.email})은 아직 officers 테이블에 등록되지 않았습니다.
          등록 전에는 글 작성·사진 업로드가 거부됩니다. README 의 “임원 계정
          만들기”를 참고하세요.
        </p>
      )}

      <div className="mt-8">{children}</div>
    </div>
  );
}
