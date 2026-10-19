import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { PassCard } from "@/components/pass-card";
import { PassLoginForm } from "@/components/pass-login-form";
import { PassLogoutButton } from "@/components/pass-logout-button";
import { seoulToday } from "@/lib/calendar-utils";
import { PASS_COOKIE } from "@/lib/pass";
import { isLinkEnabled, monthDayLabel, passLabel, projectStatus } from "@/lib/projects";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

// 학생 개인 화면이라 검색에 노출하지 않는다.
export const metadata: Metadata = {
  title: "내 입장권",
  robots: { index: false, follow: false },
};

/**
 * 입장권 화면. 이 휴대폰의 쿠키(토큰)로 pass_status() 를 불러 상태를 정한다.
 * 명단(pass_*) 테이블은 직접 조회하지 않는다 — 함수가 이 학생 한 명의 정보만 돌려준다.
 */
export default async function PassPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // 형식이 잘못된 id 나 아직 테이블이 없을 때는 data 가 null 이 되어 notFound 로 이어진다.
  const { data: project } = await supabase
    .from("projects")
    .select("id, title, pass_label, has_pass, is_always, start_date, end_date, apply_start, apply_end")
    .eq("id", id)
    .maybeSingle();

  if (!project) notFound();
  if (!project.has_pass) redirect(`/projects/${project.id}`);

  const token = (await cookies()).get(PASS_COOKIE)?.value;
  let student = null;
  if (token) {
    const { data } = await supabase.rpc("pass_status", {
      p_token: token,
      p_project_id: project.id,
    });
    student = data?.[0] ?? null;
  }

  const name = passLabel(project);
  const todayKey = seoulToday().dateKey;
  const status = projectStatus(project, todayKey);

  let content: React.ReactNode;
  if (!student) {
    content = <PassLoginForm />;
  } else if (!student.is_listed) {
    const { data: links } = await supabase
      .from("project_links")
      .select("id, label, url, kind")
      .eq("project_id", project.id)
      .eq("kind", "apply")
      .order("sort_order", { ascending: true });
    const applyLinks = (links ?? []).filter((link) => isLinkEnabled(link, project, todayKey));

    content = (
      <Notice
        title="아직 입장권이 발급되지 않았어요"
        message="신청했다면 승인될 때까지 기다려 주세요."
      >
        {applyLinks.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {applyLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-12 items-center justify-center rounded-xl bg-brand-700 px-4 text-base font-semibold text-white transition-colors hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </Notice>
    );
  } else if (student.is_suspended) {
    content = (
      <Notice title="사용이 정지된 입장권이에요" message="학생회실에 문의해 주세요." />
    );
  } else if (status === "ended") {
    content = <Notice title="기간이 끝난 입장권이에요" />;
  } else if (status === "upcoming" && project.start_date) {
    content = (
      <Notice
        title="아직 사용할 수 없어요"
        message={`${monthDayLabel(project.start_date)}부터 사용할 수 있어요.`}
      />
    );
  } else {
    const end = project.end_date ?? project.start_date;
    content = (
      <PassCard
        passName={name}
        projectTitle={project.title}
        studentName={student.student_name}
        studentNumber={student.student_number}
        validLabel={project.is_always || !end ? "상시" : `${monthDayLabel(end)}까지`}
      />
    );
  }

  return (
    <>
      <PageHeader title={name} description={project.title} backHref={`/projects/${project.id}`} />

      <div className="mx-auto w-full max-w-6xl px-4 pt-3 pb-10 lg:pt-6 lg:pb-14">
        <div className="flex max-w-md flex-col gap-4">
          {content}

          {student && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
              <span>
                {student.student_name}({student.student_number})으로 로그인됨
              </span>
              <PassLogoutButton />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Notice({
  title,
  message,
  children,
}: {
  title: string;
  message?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <p className="text-lg font-bold text-slate-900">{title}</p>
      {message && <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{message}</p>}
      {children}
    </div>
  );
}
