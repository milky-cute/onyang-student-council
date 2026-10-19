import Image from "next/image";
import Link from "next/link";

import { FlagIcon } from "@/components/icons";
import { ProjectBadges } from "@/components/project-badges";
import { needsUnoptimized, projectStatus, type Project } from "@/lib/projects";

/** /projects 목록 카드. 대표 사진(4:3) · 제목 · 한 줄 소개 · 배지. */
export function ProjectCard({
  project,
  coverUrl,
  todayKey,
}: {
  project: Project;
  coverUrl: string | null;
  todayKey: string;
}) {
  const ended = projectStatus(project, todayKey) === "ended";

  return (
    <Link
      href={`/projects/${project.id}`}
      className="card flex h-full flex-col overflow-hidden transition-colors hover:border-brand-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
    >
      <div className="relative aspect-[4/3] w-full bg-slate-100">
        {coverUrl ? (
          <Image
            src={coverUrl}
            unoptimized={needsUnoptimized(coverUrl)}
            alt={project.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            // 끝난 사업은 흑백 + 약간 투명. 블러는 쓰지 않는다.
            className={`object-cover ${ended ? "opacity-70 grayscale" : ""}`}
          />
        ) : (
          // 사진이 없어도 격자 높이를 맞추려고 자리는 남긴다.
          <div className="flex h-full items-center justify-center bg-violet-50 text-violet-700">
            <FlagIcon className="size-8" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <ProjectBadges project={project} todayKey={todayKey} />
        <h3 className="text-base font-bold text-slate-900">{project.title}</h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-slate-600">
          {project.summary || project.description}
        </p>
      </div>
    </Link>
  );
}
