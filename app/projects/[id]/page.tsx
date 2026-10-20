import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import {
  CalendarIcon,
  ChatIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
} from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { ProjectBadges } from "@/components/project-badges";
import { ProjectPhotoSlider } from "@/components/project-photo-slider";
import { dateLabel, seoulToday } from "@/lib/calendar-utils";
import { applyStatus, isLinkEnabled, projectStatus } from "@/lib/projects";
import { SITE } from "@/lib/site-config";
import { SITE_URL } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

import { ProjectLinks, type LinkButton } from "./project-links";

type Props = { params: Promise<{ id: string }> };

/**
 * 사업 + 사진 + 링크. generateMetadata 와 페이지가 같은 요청에서 한 번만 조회하도록 cache 로 감싼다.
 * 형식이 잘못된 id 는 DB 가 오류를 돌려주고 data 가 null 이 되어 notFound 로 이어진다.
 */
const getProject = cache(async (id: string) => {
  const supabase = await createClient();
  const [{ data: project }, { data: photos }, { data: links }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("project_photos")
      .select("image_url")
      .eq("project_id", id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("project_links")
      .select("*")
      .eq("project_id", id)
      .order("sort_order", { ascending: true }),
  ]);
  if (!project) return null;
  return {
    ...project,
    photos: (photos ?? []).map((photo) => photo.image_url),
    links: links ?? [],
  };
});

/** 설명 앞부분을 미리보기용 한 줄로 */
function excerpt(text: string, length = 80) {
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length > length ? `${oneLine.slice(0, length)}…` : oneLine;
}

/** 'A ~ B'. 끝이 없거나 같으면 하루짜리. */
function rangeLabel(start: string, end: string | null) {
  return !end || end === start ? dateLabel(start) : `${dateLabel(start)} ~ ${dateLabel(end)}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await getProject((await params).id);
  if (!project) return { title: "학생회 사업" };

  const description = project.summary || excerpt(project.description);

  // 포스터 QR · 단톡방 링크 미리보기에 대표 사진이 뜨게 한다. og 는 절대 URL 이어야 한다.
  return {
    title: `${project.title} — 학생회 사업`,
    description,
    openGraph: {
      title: `${project.title} — 학생회 사업`,
      description,
      url: `${SITE_URL}/projects/${project.id}`,
      siteName: SITE.fullName,
      images: project.photos[0] ? [{ url: project.photos[0], alt: project.title }] : undefined,
    },
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const project = await getProject((await params).id);
  if (!project) notFound();

  const todayKey = seoulToday().dateKey;
  const ended = projectStatus(project, todayKey) === "ended";
  const apply = applyStatus(project, todayKey);

  const info: { icon: React.ReactNode; label: string; value: string }[] = [];
  if (project.is_always) {
    info.push({ icon: <CalendarIcon className="size-4" />, label: "기간", value: "상시" });
  } else if (project.start_date) {
    info.push({
      icon: <CalendarIcon className="size-4" />,
      label: "기간",
      value: rangeLabel(project.start_date, project.end_date),
    });
  }
  if (project.apply_start || project.apply_end) {
    info.push({
      icon: <ClockIcon className="size-4" />,
      label: "신청 기간",
      value: project.apply_start
        ? project.apply_end
          ? rangeLabel(project.apply_start, project.apply_end)
          : `${dateLabel(project.apply_start)}부터`
        : `${dateLabel(project.apply_end!)}까지`,
    });
  }
  if (project.target) info.push({ icon: <CheckCircleIcon className="size-4" />, label: "대상", value: project.target });
  if (project.place) info.push({ icon: <MapPinIcon className="size-4" />, label: "장소", value: project.place });
  if (project.contact) info.push({ icon: <ChatIcon className="size-4" />, label: "문의처", value: project.contact });

  const links: LinkButton[] = project.links.map((link) => ({
    id: link.id,
    label: link.label,
    url: link.url,
    kind: link.kind,
    showQr: link.show_qr,
    enabled: isLinkEnabled(link, project, todayKey),
    disabledLabel:
      !ended && apply?.kind === "upcoming" ? `${apply.startLabel}부터 신청` : "신청 마감",
  }));

  return (
    <>
      <PageHeader
        title={project.title}
        description={project.summary || `${SITE.councilName}가 진행하는 사업이에요.`}
        backHref="/projects"
      />

      {/* 제목(PageHeader)과 같은 1152px 열의 왼쪽에 맞추고, 읽기 좋은 폭(768px)으로 둔다. */}
      <div className="mx-auto w-full max-w-6xl px-4 pt-3 pb-10 lg:pt-6 lg:pb-14">
        <div className="flex max-w-3xl flex-col gap-4">
          {ended && (
            <p
              role="status"
              className="rounded-control border border-slate-200 bg-slate-100 px-4 py-3 text-body-sm font-semibold text-slate-700"
            >
              끝난 사업이에요. 기록으로 남겨두고 있어요.
            </p>
          )}

          <article className="card overflow-hidden">
            {/* 사진은 선택 — 없으면 사진 영역을 그리지 않는다. */}
            {project.photos.length > 0 && (
              <ProjectPhotoSlider photos={project.photos} title={project.title} ended={ended} />
            )}

            <div className="flex flex-col gap-4 p-5">
              <div className="flex flex-col gap-2">
                <ProjectBadges project={project} todayKey={todayKey} />
                <h2 className="text-title font-bold text-slate-900">{project.title}</h2>
              </div>

              {info.length > 0 && (
                <dl className="flex flex-col gap-2 rounded-control bg-slate-50 px-4 py-3 text-body-sm">
                  {info.map((row) => (
                    <div key={row.label} className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0 text-slate-600">{row.icon}</span>
                      <dt className="w-16 shrink-0 text-slate-600">{row.label}</dt>
                      <dd className="min-w-0 font-semibold text-slate-800">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <p className="whitespace-pre-line text-body leading-relaxed text-slate-700">
                {project.description}
              </p>

              {(links.length > 0 || project.has_pass) && (
                <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
                  {links.length > 0 && <ProjectLinks links={links} />}
                  {project.has_pass && (
                    <Link
                      href={`/projects/${project.id}/pass`}
                      className="press flex min-h-14 w-full items-center justify-center rounded-control border border-brand-700 bg-white px-5 text-body font-bold text-brand-700 hover:bg-brand-50"
                    >
                      내 입장권 보기
                    </Link>
                  )}
                </div>
              )}
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
