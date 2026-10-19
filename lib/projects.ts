/**
 * 학생회 사업 공용 상수 · 상태 계산.
 *
 * 등록 폼(클라이언트) · API 라우트(서버) · 목록/상세/홈 화면이 모두 같은 규칙을 써야 해서
 * 한곳에 모아둔다. todayKey 는 항상 seoulToday().dateKey('YYYY-MM-DD', 한국 시간)를 넘긴다.
 * 날짜는 전부 'YYYY-MM-DD' 문자열이라 문자열 비교로 앞뒤를 판단한다.
 */
import { diffDays } from "@/lib/calendar-utils";
import type {
  Project,
  ProjectLink,
  ProjectLinkKind,
  ProjectPhoto,
} from "@/lib/supabase/database.types";

export type { Project, ProjectLink, ProjectLinkKind, ProjectPhoto };

/** 사업 사진 전용 버킷 (0013) */
export const STORAGE_BUCKET_PROJECTS = "projects";

/** 업로드 가능한 이미지 형식. Storage 버킷(0013)에도 같은 목록이 걸려 있다. */
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** 사진 한 장 최대 크기 4MB. 배포(Vercel) 요청 본문 한도 4.5MB 안에 들도록 버킷 한도(5MB)보다 작게 둔다. */
export const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

/** 사업당 사진 최대 장수 */
export const MAX_PHOTOS = 8;

/** 사업당 링크 최대 개수 */
export const MAX_LINKS = 5;

/** 입력값 최대 길이. 초과하면 400 으로 돌려보낸다. */
export const FIELD_LIMITS = {
  title: 100,
  summary: 100,
  description: 3000,
  target: 100,
  place: 100,
  contact: 100,
  passLabel: 30,
  linkLabel: 20,
  linkUrl: 500,
} as const;

/** 사업 + 사진·링크(sort_order 순으로 정렬된 상태) */
export type ProjectWithMedia = Project & {
  photos: ProjectPhoto[];
  links: ProjectLink[];
};

export type ProjectStatus = "always" | "upcoming" | "ongoing" | "ended";

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  always: "상시",
  upcoming: "진행 예정",
  ongoing: "진행중",
  ended: "끝남",
};

type DateFields = Pick<
  Project,
  "is_always" | "start_date" | "end_date" | "apply_start" | "apply_end"
>;

/** 'YYYY-MM-DD' → 'M월 D일' */
export function monthDayLabel(dateKey: string) {
  const [, month, day] = dateKey.split("-").map(Number);
  return `${month}월 ${day}일`;
}

/**
 * 사업 상태.
 * 상시 → always / 오늘 < 시작일 → upcoming / 시작일 ≤ 오늘 ≤ 종료일 → ongoing / 오늘 > 종료일 → ended.
 * 종료일이 비어 있으면 시작일 하루짜리 사업이다.
 */
export function projectStatus(project: DateFields, todayKey: string): ProjectStatus {
  // 상시가 아니면 시작일은 DB 제약(projects_start_required)으로 반드시 있다.
  if (project.is_always || !project.start_date) return "always";

  const end = project.end_date ?? project.start_date;
  if (todayKey < project.start_date) return "upcoming";
  if (todayKey > end) return "ended";
  return "ongoing";
}

export type ApplyStatus =
  /** 신청 예정. startLabel = 'M월 D일' */
  | { kind: "upcoming"; label: string; startLabel: string }
  /** 신청 중. daysLeft = 마감까지 남은 일수(마감일 당일 0, 마감일이 없으면 null) */
  | { kind: "open"; label: string; daysLeft: number | null }
  | { kind: "closed"; label: string };

/**
 * 신청 상태. 신청 기간(시작·마감 중 하나라도)이 없으면 null.
 * 사업이 끝났으면 신청 기간과 상관없이 마감으로 본다.
 */
export function applyStatus(project: DateFields, todayKey: string): ApplyStatus | null {
  const { apply_start, apply_end } = project;
  if (!apply_start && !apply_end) return null;

  if (projectStatus(project, todayKey) === "ended") {
    return { kind: "closed", label: "신청 마감" };
  }

  if (apply_start && todayKey < apply_start) {
    const startLabel = monthDayLabel(apply_start);
    return { kind: "upcoming", label: `신청 예정 (${startLabel}부터)`, startLabel };
  }

  if (apply_end && todayKey > apply_end) {
    return { kind: "closed", label: "신청 마감" };
  }

  if (!apply_end) return { kind: "open", label: "신청 중", daysLeft: null };

  const daysLeft = diffDays(apply_end, todayKey);
  return {
    kind: "open",
    label: daysLeft === 0 ? "신청 중 D-day" : `신청 중 D-${daysLeft}`,
    daysLeft,
  };
}

/**
 * 링크를 지금 열 수 있는지.
 * - 'other' 링크는 사업이 끝나도 항상 열 수 있다.
 * - 'apply' 링크는 사업이 끝났거나, 신청 기간이 있는데 신청 중이 아니면 비활성.
 *   신청 기간이 없으면 사업이 끝나기 전까지 항상 열 수 있다.
 */
export function isLinkEnabled(
  link: Pick<ProjectLink, "kind">,
  project: DateFields,
  todayKey: string,
) {
  if (link.kind !== "apply") return true;
  if (projectStatus(project, todayKey) === "ended") return false;

  const apply = applyStatus(project, todayKey);
  return apply === null || apply.kind === "open";
}

const STORAGE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

/**
 * next/image 는 next.config.ts 에 등록된 Supabase Storage 호스트만 최적화할 수 있다.
 * 시드 사업의 대표 사진(사이트 로고 절대 URL)처럼 다른 주소면 true → <Image unoptimized> 로 그대로 띄운다.
 */
export function needsUnoptimized(imageUrl: string) {
  try {
    return new URL(imageUrl).hostname !== STORAGE_HOST;
  } catch {
    return true;
  }
}

/** 입장권 이름. 비어 있으면 '{제목} 입장권' */
export function passLabel(project: Pick<Project, "title" | "pass_label">) {
  return project.pass_label?.trim() || `${project.title} 입장권`;
}
