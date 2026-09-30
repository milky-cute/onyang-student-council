/**
 * 분실물센터 공용 상수.
 *
 * 등록 폼(클라이언트)과 API 라우트(서버)가 같은 제한을 써야 해서 한곳에 모아둔다.
 */

/** 분실물 사진 전용 버킷. media(게시판·아카이브)와 분리해서 쓴다. */
export const STORAGE_BUCKET_LOST_FOUND = "lost-found";

/** 업로드 가능한 이미지 형식. Storage 버킷(0010)에도 같은 목록이 걸려 있다. */
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** 이미지 최대 크기 5MB. Storage 버킷 file_size_limit 와 같은 값. */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/** 입력값 최대 길이. 초과하면 400 으로 돌려보낸다. */
export const FIELD_LIMITS = {
  title: 100,
  description: 1000,
  location: 100,
  storageLocation: 100,
  privateNote: 500,
  claimedBy: 50,
} as const;

/** /lost-found 맨 위 "찾으러 오는 법" 안내 문구. 운영 방식이 바뀌면 여기만 고친다. */
export const LOST_FOUND_PICKUP = {
  place: "학생회실",
  hours: "점심시간",
  verifyNote: "본인 물건인지 확인하기 위해 특징을 물어볼 수 있어요.",
} as const;

/** 등록일로부터 이 기간(일)까지 보관한다. 지나도 자동 삭제하지 않고 관리 화면에만 표시한다. */
export const LOST_FOUND_RETENTION_DAYS = 30;

const SEOUL_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * 보관 기한 = 등록일(한국 시간) + LOST_FOUND_RETENTION_DAYS.
 * dateKey('YYYY-MM-DD')는 seoulToday().dateKey 와 문자열로 비교할 수 있다.
 */
export function retentionDeadline(createdAt: string) {
  const [year, month, day] = SEOUL_DATE_FORMAT.format(new Date(createdAt))
    .split("-")
    .map(Number);
  const deadline = new Date(Date.UTC(year, month - 1, day + LOST_FOUND_RETENTION_DAYS));

  return {
    dateKey: deadline.toISOString().slice(0, 10),
    label: `${deadline.getUTCMonth() + 1}월 ${deadline.getUTCDate()}일`,
  };
}
