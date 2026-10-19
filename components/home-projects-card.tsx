import Image from "next/image";
import Link from "next/link";

import { ChevronRightIcon, FlagIcon } from "@/components/icons";
import {
  PROJECT_STATUS_LABEL,
  applyStatus,
  needsUnoptimized,
  projectStatus,
  type Project,
} from "@/lib/projects";

/** 홈 카드에 필요한 컬럼만 + 대표 사진 */
export type HomeProject = Pick<
  Project,
  | "id"
  | "title"
  | "summary"
  | "description"
  | "is_always"
  | "start_date"
  | "end_date"
  | "apply_start"
  | "apply_end"
> & { image_url: string | null };

/** 상태 배지 + 신청 배지. inline 이면 흰 바탕 위(가로형), 아니면 사진 위에 얹는다. */
function StatusBadges({
  project,
  todayKey,
  inline = false,
}: {
  project: HomeProject;
  todayKey: string;
  inline?: boolean;
}) {
  const status = projectStatus(project, todayKey);
  const apply = applyStatus(project, todayKey);
  return (
    <>
      <span className="rounded-md bg-violet-700 px-1.5 py-0.5 text-[11px] font-semibold text-white">
        {PROJECT_STATUS_LABEL[status]}
      </span>
      {apply && (
        <span
          className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
            apply.kind === "open"
              ? "bg-brand-700 text-white"
              : inline
                ? "bg-slate-100 text-slate-700"
                : "bg-white/90 text-slate-700"
          }`}
        >
          {apply.label}
        </span>
      )}
    </>
  );
}

/**
 * 홈 화면 학생회 사업 카드. 오늘의 급식 바로 아래(컴퓨터에서는 오른쪽)에 둔다.
 * 고를 사업(lib/projects.ts 의 sortForHome, 최대 3개)은 홈 페이지가 정해서 넘긴다.
 * 1개면 납작한 가로형 한 줄, 2~3개면 가로 스크롤 카드.
 * 조회에 실패해도 빈 목록으로 받아 안내 문구만 보여준다.
 */
export function HomeProjectsCard({
  projects,
  todayKey,
}: {
  projects: HomeProject[];
  todayKey: string;
}) {
  return (
    <section aria-labelledby="home-projects-heading" className="card flex flex-col p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
          <FlagIcon />
        </span>
        <h2 id="home-projects-heading" className="min-w-0 flex-1 text-lg font-bold text-slate-900">
          학생회 사업
        </h2>
        <Link
          href="/projects"
          className="-mr-2 flex min-h-11 shrink-0 items-center gap-0.5 rounded-lg px-2 text-sm font-medium text-brand-700 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-brand-700"
        >
          전체 보기
          <ChevronRightIcon className="size-4" />
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
          지금 진행 중인 사업이 없어요.
        </p>
      ) : projects.length === 1 ? (
        <Link
          href={`/projects/${projects[0].id}`}
          className="group mt-4 flex items-center gap-4 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
        >
          <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-violet-50">
            {projects[0].image_url ? (
              <Image
                src={projects[0].image_url}
                alt={projects[0].title}
                fill
                sizes="96px"
                unoptimized={needsUnoptimized(projects[0].image_url)}
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-violet-700">
                <FlagIcon className="size-7" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-1">
              <StatusBadges project={projects[0]} todayKey={todayKey} inline />
            </div>
            <p className="mt-1.5 line-clamp-2 font-semibold text-slate-900 group-hover:text-brand-700">
              {projects[0].title}
            </p>
            <p className="mt-0.5 truncate text-sm text-slate-600">
              {projects[0].summary || projects[0].description}
            </p>
          </div>
          <ChevronRightIcon className="size-5 shrink-0 text-slate-400" />
        </Link>
      ) : (
        <ul className="-mx-5 mt-4 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1">
          {projects.map((project) => {
            return (
              <li key={project.id} className="w-[72%] shrink-0 snap-start sm:w-[46%]">
                <Link
                  href={`/projects/${project.id}`}
                  className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-violet-50">
                    {project.image_url ? (
                      <Image
                        src={project.image_url}
                        alt={project.title}
                        fill
                        sizes="(min-width: 1024px) 260px, 70vw"
                        unoptimized={needsUnoptimized(project.image_url)}
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-violet-700">
                        <FlagIcon className="size-7" />
                      </div>
                    )}
                    <span className="absolute left-1.5 top-1.5 flex flex-wrap gap-1">
                      <StatusBadges project={project} todayKey={todayKey} />
                    </span>
                  </div>
                  <p className="mt-1.5 truncate text-sm font-semibold text-slate-900">
                    {project.title}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
