import { revalidatePath } from "next/cache";

import {
  FIELD_LIMITS,
  MAX_LINKS,
  MAX_PHOTOS,
  STORAGE_BUCKET_PROJECTS,
  type Project,
  type ProjectLinkKind,
} from "@/lib/projects";
import { SUPABASE_URL } from "@/lib/supabase/env";

/** 사진 공개 URL 앞부분. 이 버킷에 서버가 올린 파일만 사업 사진으로 받는다. */
const PHOTO_URL_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET_PROJECTS}/`;

/** photos/route.ts 가 만드는 파일 이름 형식: '{시각}-{uuid}.{확장자}' */
const PHOTO_PATH_PATTERN = /^\d+-[0-9a-f-]{36}\.(jpg|png|webp)$/;

/** 사진 공개 URL → Storage 오브젝트 경로. 이 버킷 파일이 아니면 null. */
export function photoPathFromUrl(url: string): string | null {
  if (!url.startsWith(PHOTO_URL_PREFIX)) return null;
  const path = url.slice(PHOTO_URL_PREFIX.length);
  return PHOTO_PATH_PATTERN.test(path) ? path : null;
}

export type ProjectInput = {
  row: Omit<Project, "id" | "created_at" | "updated_at">;
  photos: string[];
  links: { label: string; url: string; kind: ProjectLinkKind; show_qr: boolean }[];
};

/** 'YYYY-MM-DD' 이고 실제로 있는 날짜인지 */
function isDateKey(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/**
 * 등록 · 수정 요청 본문 검증. 실패하면 폼에 그대로 보여줄 한국어 문구를 돌려준다.
 * DB 제약(0013)도 같은 규칙을 걸고 있지만, 사용자에게 알아들을 수 있는 문구를 주려고 여기서 먼저 막는다.
 * savedPhotos: 수정할 때 이 사업에 이미 저장된 사진 URL. 버킷 밖 주소(시드의 임시 로고 등)여도 그대로 둘 수 있다.
 */
export function parseProjectInput(
  body: unknown,
  savedPhotos: string[] = [],
): { input: ProjectInput } | { error: string } {
  const raw = (body ?? {}) as Record<string, unknown>;
  const text = (key: string) => (typeof raw[key] === "string" ? (raw[key] as string).trim() : "");
  const flag = (key: string) => raw[key] === true;

  const title = text("title");
  const summary = text("summary");
  const description = text("description");
  const isAlways = flag("isAlways");
  const startDate = isAlways ? "" : text("startDate");
  const endDate = isAlways ? "" : text("endDate");
  const applyStart = text("applyStart");
  const applyEnd = text("applyEnd");
  const target = text("target");
  const place = text("place");
  const contact = text("contact");
  const hasPass = flag("hasPass");
  const passLabelText = hasPass ? text("passLabel") : "";

  if (!title) return { error: "제목을 입력해주세요." };
  if (!description) return { error: "설명을 입력해주세요." };

  const tooLong =
    title.length > FIELD_LIMITS.title ||
    summary.length > FIELD_LIMITS.summary ||
    description.length > FIELD_LIMITS.description ||
    target.length > FIELD_LIMITS.target ||
    place.length > FIELD_LIMITS.place ||
    contact.length > FIELD_LIMITS.contact ||
    passLabelText.length > FIELD_LIMITS.passLabel;
  if (tooLong) return { error: "입력값이 너무 깁니다. 글자 수를 줄여주세요." };

  for (const value of [startDate, endDate, applyStart, applyEnd]) {
    if (value && !isDateKey(value)) return { error: "날짜 형식이 올바르지 않습니다." };
  }
  if (!isAlways && !startDate) return { error: "상시 사업이 아니면 시작일을 입력해주세요." };
  if (endDate && endDate < startDate) return { error: "종료일은 시작일과 같거나 뒤여야 합니다." };
  if (applyStart && applyEnd && applyEnd < applyStart) {
    return { error: "신청 마감일은 신청 시작일과 같거나 뒤여야 합니다." };
  }

  // 사진: 선택(0장 가능), 최대 MAX_PHOTOS 장, 이 버킷에 올린 파일만.
  const photos = Array.isArray(raw.photos) ? raw.photos : [];
  if (photos.length > MAX_PHOTOS) return { error: `사진은 최대 ${MAX_PHOTOS}장까지 올릴 수 있습니다.` };
  if (
    photos.some(
      (url) => typeof url !== "string" || (!photoPathFromUrl(url) && !savedPhotos.includes(url)),
    ) ||
    new Set(photos).size !== photos.length
  ) {
    return { error: "사진 정보가 올바르지 않습니다. 다시 올려주세요." };
  }

  // 링크: 전부 선택. 버튼 이름 필수 · 20자, 주소 https:// · 500자, 종류 값.
  const rawLinks = Array.isArray(raw.links) ? raw.links : [];
  if (rawLinks.length > MAX_LINKS) return { error: `링크는 최대 ${MAX_LINKS}개까지 넣을 수 있습니다.` };
  const links: ProjectInput["links"] = [];
  for (const [index, item] of rawLinks.entries()) {
    const link = (item ?? {}) as Record<string, unknown>;
    const label = typeof link.label === "string" ? link.label.trim() : "";
    const url = typeof link.url === "string" ? link.url.trim() : "";
    const name = `${index + 1}번째 링크`;
    if (!label) return { error: `${name}의 버튼 이름을 입력해주세요.` };
    if (label.length > FIELD_LIMITS.linkLabel) {
      return { error: `${name}의 버튼 이름은 ${FIELD_LIMITS.linkLabel}자 이내로 써주세요.` };
    }
    if (!url.startsWith("https://") || url.length <= "https://".length) {
      return { error: `${name}의 주소는 https:// 로 시작해야 합니다.` };
    }
    if (url.length > FIELD_LIMITS.linkUrl) {
      return { error: `${name}의 주소는 ${FIELD_LIMITS.linkUrl}자 이내여야 합니다.` };
    }
    if (link.kind !== "apply" && link.kind !== "other") {
      return { error: `${name}의 종류가 올바르지 않습니다.` };
    }
    links.push({ label, url, kind: link.kind, show_qr: link.showQr === true });
  }

  return {
    input: {
      row: {
        title,
        summary: summary || null,
        description,
        is_always: isAlways,
        start_date: startDate || null,
        end_date: endDate || null,
        apply_start: applyStart || null,
        apply_end: applyEnd || null,
        target: target || null,
        place: place || null,
        contact: contact || null,
        has_pass: hasPass,
        pass_label: passLabelText || null,
        is_pinned: flag("isPinned"),
      },
      photos: photos as string[],
      links,
    },
  };
}

/** 사업이 보이는 화면을 모두 갱신한다. */
export function revalidateProject(id: string) {
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  revalidatePath("/admin/projects");
}
