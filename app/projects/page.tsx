import type { Metadata } from "next";

import { PageHeader } from "@/components/page-header";
import { ProjectCard } from "@/components/project-card";
import { ProjectShowMore } from "@/components/project-show-more";
import { seoulToday } from "@/lib/calendar-utils";
import { projectStatus, type Project, type ProjectStatus } from "@/lib/projects";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "학생회 사업",
};

/** 끝난 사업은 처음에 이만큼만 보여준다. */
const ENDED_INITIAL = 4;

const SECTIONS: { status: ProjectStatus; title: string }[] = [
  { status: "always", title: "상시" },
  { status: "ongoing", title: "진행중" },
  { status: "upcoming", title: "진행 예정" },
  { status: "ended", title: "끝난 사업" },
];

/** 종료일(비어 있으면 시작일 하루). 상시가 아니면 시작일은 반드시 있다. */
const endKey = (p: Project) => p.end_date ?? p.start_date ?? "";

/** 섹션 안 정렬: 고정 먼저 → 섹션별 기준. 날짜는 'YYYY-MM-DD' 라 문자열 비교로 충분하다. */
const COMPARE: Record<ProjectStatus, (a: Project, b: Project) => number> = {
  always: (a, b) => b.created_at.localeCompare(a.created_at),
  ongoing: (a, b) => endKey(a).localeCompare(endKey(b)),
  upcoming: (a, b) => (a.start_date ?? "").localeCompare(b.start_date ?? ""),
  ended: (a, b) => endKey(b).localeCompare(endKey(a)),
};

export default async function ProjectsPage() {
  const supabase = await createClient();
  // 테이블이 아직 없거나 조회에 실패하면 data 가 null — 빈 화면 안내로 이어진다.
  const [{ data: projects }, { data: photos }] = await Promise.all([
    supabase.from("projects").select("*"),
    supabase
      .from("project_photos")
      .select("project_id, image_url, sort_order")
      .order("sort_order", { ascending: true }),
  ]);

  // sort_order 순으로 받았으니 사업별 첫 사진이 대표 사진이다.
  const coverByProject = new Map<string, string>();
  for (const photo of photos ?? []) {
    if (!coverByProject.has(photo.project_id)) {
      coverByProject.set(photo.project_id, photo.image_url);
    }
  }

  const todayKey = seoulToday().dateKey;
  const sections = SECTIONS.map((section) => ({
    ...section,
    items: (projects ?? [])
      .filter((p) => projectStatus(p, todayKey) === section.status)
      .sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned) || COMPARE[section.status](a, b)),
  })).filter((section) => section.items.length > 0);

  const card = (project: Project) => (
    <ProjectCard
      project={project}
      coverUrl={coverByProject.get(project.id) ?? null}
      todayKey={todayKey}
    />
  );

  return (
    <>
      <PageHeader
        title="학생회 사업"
        description="학생자치회가 진행하는 사업을 확인하고 신청하세요."
        backHref="/"
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-3 pb-10 lg:pt-6 lg:pb-14">
        {sections.length === 0 ? (
          <div className="card px-6 py-14 text-center">
            <p className="text-card-title font-semibold text-slate-900">아직 등록된 사업이 없어요</p>
            <p className="mt-2 text-body-sm text-slate-600">
              학생자치회가 사업을 올리면 이곳에서 확인하고 신청할 수 있어요.
            </p>
          </div>
        ) : (
          sections.map((section) => (
            <section
              key={section.status}
              aria-labelledby={`projects-${section.status}`}
              className="flex flex-col gap-3"
            >
              <h2
                id={`projects-${section.status}`}
                className="flex items-center gap-2 text-card-title font-bold text-slate-900"
              >
                {section.title}
                <span className="text-body-sm font-semibold text-slate-600">{section.items.length}</span>
              </h2>

              {section.status === "ended" ? (
                <ProjectShowMore
                  items={section.items.map((p) => ({ key: p.id, node: card(p) }))}
                  initial={ENDED_INITIAL}
                  label="끝난 사업 더 보기"
                />
              ) : (
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
                  {section.items.map((p) => (
                    <li key={p.id}>{card(p)}</li>
                  ))}
                </ul>
              )}
            </section>
          ))
        )}
      </div>
    </>
  );
}
