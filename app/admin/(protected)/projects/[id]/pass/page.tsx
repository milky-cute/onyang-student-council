import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminBackLink } from "@/components/admin-back-link";
import { DEFAULT_SEAT_LABEL } from "@/lib/pass";
import { passLabel } from "@/lib/projects";
import { createClient } from "@/lib/supabase/server";

import { HolderList } from "./holder-list";
import { RosterForm } from "./roster-form";

// (protected) 레이아웃이 로그인 여부를 이미 확인하므로 이 페이지는 화면만 담당한다.

export const metadata: Metadata = {
  title: "입장권 명단 관리",
};

type Props = { params: Promise<{ id: string }> };

export default async function AdminPassPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: project }, { data: holders }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, title, pass_label, has_pass, pass_seat_enabled, pass_seat_label")
      .eq("id", id)
      .maybeSingle(),
    // 임원 전용. RLS 가 임원이 아니면 빈 결과를 돌려준다.
    supabase
      .from("pass_holders")
      .select("id, student_number, student_name, is_suspended, seat")
      .eq("project_id", id)
      .order("student_number", { ascending: true }),
  ]);

  if (!project) notFound();

  const list = holders ?? [];
  // 좌석 표시를 쓰는 사업에서만 좌석 칸 · 고치기를 보여준다. 끈 사업은 화면이 예전과 같다.
  const seatLabel = project.pass_seat_enabled
    ? project.pass_seat_label || DEFAULT_SEAT_LABEL
    : null;

  return (
    <>
      <AdminBackLink href="/admin/projects" />
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-title font-bold text-slate-900">입장권 명단 — {passLabel(project)}</h1>
          <p className="mt-2 text-body-sm text-slate-600">
            {project.title} · 구글폼 응답을 보고 승인한 학생의 &ldquo;학번 이름&rdquo;을 붙여넣으면
            그 학생만 /projects/{project.id}/pass 에서 입장권을 열 수 있습니다. 학생은 처음 열 때
            정한 PIN 4자리로 본인 확인을 합니다.
          </p>
        </div>

        {!project.has_pass && (
          <p
            role="alert"
            className="rounded-chip border border-amber-300 bg-amber-50 px-4 py-3 text-body-sm text-amber-900"
          >
            이 사업은 지금 입장권을 사용하지 않도록 되어 있어 학생에게 입장권 화면이 열리지
            않습니다. 사업 수정에서 &ldquo;입장권 사용&rdquo;을 켜 주세요.
          </p>
        )}

        <RosterForm projectId={project.id} existing={list} seatLabel={seatLabel} />

        <HolderList holders={list} seatLabel={seatLabel} />
      </div>
    </>
  );
}
