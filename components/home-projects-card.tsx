import Image from "next/image";
import Link from "next/link";

import { ChevronRightIcon, FlagIcon } from "@/components/icons";
import { ProjectBadges } from "@/components/project-badges";
import { SectionHeader } from "@/components/section-header";
import { needsUnoptimized, type Project } from "@/lib/projects";

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
    <section aria-labelledby="home-projects-heading" className="card flex h-full flex-col p-5">
      <SectionHeader
        id="home-projects-heading"
        title="학생회 사업"
        icon={<FlagIcon />}
        action={{ href: "/projects", label: "전체 보기" }}
      />

      {projects.length === 0 ? (
        <p className="mt-4 rounded-control bg-slate-50 px-4 py-6 text-center text-body-sm text-slate-600">
          지금 진행 중인 사업이 없어요.
        </p>
      ) : projects.length === 1 ? (
        <Link
          href={`/projects/${projects[0].id}`}
          className="group mt-4 flex items-center gap-4 rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
        >
          <div className="relative size-24 shrink-0 overflow-hidden rounded-control bg-brand-50">
            {projects[0].image_url ? (
              <Image
                src={projects[0].image_url}
                alt={`${projects[0].title} 사진`}
                fill
                sizes="96px"
                unoptimized={needsUnoptimized(projects[0].image_url)}
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-brand-700">
                <FlagIcon className="size-7" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <ProjectBadges project={projects[0]} todayKey={todayKey} />
            <p className="mt-2 line-clamp-2 text-body font-semibold text-slate-900 group-hover:text-brand-700">
              {projects[0].title}
            </p>
            <p className="truncate text-body-sm text-slate-600">
              {projects[0].summary || projects[0].description}
            </p>
          </div>
          <ChevronRightIcon className="size-5 shrink-0 text-slate-400" />
        </Link>
      ) : (
        <ul className="-mx-5 mt-4 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-1 scrollbar-none">
          {projects.map((project) => {
            return (
              <li key={project.id} className="w-[72%] shrink-0 snap-start sm:w-[46%]">
                <Link
                  href={`/projects/${project.id}`}
                  className="group block rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-control bg-brand-50">
                    {project.image_url ? (
                      <Image
                        src={project.image_url}
                        alt={`${project.title} 사진`}
                        fill
                        sizes="(min-width: 1024px) 260px, 70vw"
                        unoptimized={needsUnoptimized(project.image_url)}
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-brand-700">
                        <FlagIcon className="size-7" />
                      </div>
                    )}
                    <span className="absolute top-2 left-2">
                      <ProjectBadges project={project} todayKey={todayKey} />
                    </span>
                  </div>
                  <p className="mt-2 truncate text-body-sm font-semibold text-slate-900">
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
