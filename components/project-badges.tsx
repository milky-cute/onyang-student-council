import {
  applyStatus,
  PROJECT_STATUS_LABEL,
  projectStatus,
  type ApplyStatus,
  type Project,
} from "@/lib/projects";

/**
 * 색은 상태 뜻으로만 (globals.css 의 badge-*). 한 줄에 진한 파란 배지가 둘 이상 나오지 않도록
 * 진한 brand(badge-active)는 "신청 중" 하나에만 쓰고, 진행중 · 상시는 연한 brand, 예정 · 종료 · 입장권은 slate.
 */
const STATUS_CLASS = {
  always: "badge-info",
  ongoing: "badge-info",
  upcoming: "badge-muted",
  ended: "badge-muted",
} as const;

/** 마감까지 이 날수 이하로 남으면 "마감 임박"(amber) 으로 보여준다. */
const CLOSING_SOON_DAYS = 3;

function applyClass(apply: ApplyStatus) {
  if (apply.kind !== "open") return "badge-muted";
  return apply.daysLeft !== null && apply.daysLeft <= CLOSING_SOON_DAYS
    ? "badge-soon"
    : "badge-active";
}

/**
 * 사업 상태 · 신청 상태 · 입장권 배지. 홈 카드 · 목록 카드 · 상세 · 관리 화면이 같이 쓴다.
 * 끝난 사업은 "종료" 배지만 붙이고 신청 상태는 따로 보여주지 않는다(겹치는 정보).
 */
export function ProjectBadges({
  project,
  todayKey,
}: {
  project: Pick<Project, "is_always" | "start_date" | "end_date" | "apply_start" | "apply_end"> & {
    has_pass?: boolean;
  };
  todayKey: string;
}) {
  const status = projectStatus(project, todayKey);
  const apply = status === "ended" ? null : applyStatus(project, todayKey);

  return (
    <span className="flex flex-wrap items-center gap-1">
      <span className={`badge ${STATUS_CLASS[status]}`}>
        {status === "ended" ? "종료" : PROJECT_STATUS_LABEL[status]}
      </span>
      {apply && <span className={`badge ${applyClass(apply)}`}>{apply.label}</span>}
      {project.has_pass && <span className="badge badge-muted">입장권</span>}
    </span>
  );
}
