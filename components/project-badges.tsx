import { applyStatus, PROJECT_STATUS_LABEL, projectStatus, type Project } from "@/lib/projects";

const STATUS_CLASS = {
  always: "bg-violet-50 text-violet-700",
  ongoing: "bg-brand-700 text-white",
  upcoming: "bg-brand-50 text-brand-700",
  ended: "bg-slate-200 text-slate-600",
} as const;

const APPLY_CLASS = {
  open: "bg-emerald-50 text-emerald-700",
  upcoming: "bg-slate-100 text-slate-700",
  closed: "bg-slate-100 text-slate-500",
} as const;

const badge = "rounded-full px-2.5 py-0.5 text-xs font-semibold";

/**
 * 사업 상태 · 신청 상태 · 입장권 배지. 목록 카드 · 상세 · 관리 화면이 같이 쓴다.
 * 끝난 사업은 "종료" 배지만 붙이고 신청 상태는 따로 보여주지 않는다(겹치는 정보).
 */
export function ProjectBadges({
  project,
  todayKey,
}: {
  project: Pick<
    Project,
    "is_always" | "start_date" | "end_date" | "apply_start" | "apply_end" | "has_pass"
  >;
  todayKey: string;
}) {
  const status = projectStatus(project, todayKey);
  const apply = status === "ended" ? null : applyStatus(project, todayKey);

  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <span className={`${badge} ${STATUS_CLASS[status]}`}>
        {status === "ended" ? "종료" : PROJECT_STATUS_LABEL[status]}
      </span>
      {apply && <span className={`${badge} ${APPLY_CLASS[apply.kind]}`}>{apply.label}</span>}
      {project.has_pass && <span className={`${badge} bg-amber-50 text-amber-700`}>입장권</span>}
    </span>
  );
}
