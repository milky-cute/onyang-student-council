import type { Metadata } from "next";
import Link from "next/link";

import { AdminBackLink } from "@/components/admin-back-link";
import { seoulToday } from "@/lib/calendar-utils";
import { SITE_URL } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

import { ProjectRow } from "./project-row";

// (protected) 레이아웃이 로그인 여부를 이미 확인하므로 이 페이지는 화면만 담당한다.

export const metadata: Metadata = {
  title: "학생회 사업 관리",
};

export default async function AdminProjectsPage() {
  const supabase = await createClient();
  const [{ data: projects }, { data: photos }] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("project_photos")
      .select("project_id, image_url, sort_order")
      .order("sort_order", { ascending: true }),
  ]);

  const coverByProject = new Map<string, string>();
  for (const photo of photos ?? []) {
    if (!coverByProject.has(photo.project_id)) {
      coverByProject.set(photo.project_id, photo.image_url);
    }
  }

  const todayKey = seoulToday().dateKey;

  return (
    <>
      <AdminBackLink />
      <div className="flex flex-col gap-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-title font-bold text-slate-900">학생회 사업 관리</h1>
            <p className="mt-2 max-w-2xl text-body-sm text-slate-600">
              등록한 사업은 로그인 없이 누구나 /projects 에서 볼 수 있습니다. 상태(진행 예정 ·
              진행중 · 끝남)는 날짜로 자동 계산되고, 끝난 사업도 지우지 않고 보관됩니다.
              포스터에는 각 사업의 <strong>QR 코드</strong>를 내려받아 넣으세요.
            </p>
          </div>
          <Link
            href="/admin/projects/new"
            className="rounded-control bg-brand-700 px-4 py-3 text-body-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            새 사업 등록
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-card-title font-semibold text-slate-900">등록된 사업</h2>
          {!projects || projects.length === 0 ? (
            <p className="text-body-sm text-slate-600">아직 등록된 사업이 없습니다.</p>
          ) : (
            projects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                coverUrl={coverByProject.get(project.id) ?? null}
                pageUrl={`${SITE_URL}/projects/${project.id}`}
                todayKey={todayKey}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
