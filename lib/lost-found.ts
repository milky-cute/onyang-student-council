/**
 * 분실물센터 공용 상수.
 *
 * 등록 폼(클라이언트)과 API 라우트(서버)가 같은 제한을 써야 해서 한곳에 모아둔다.
 */

/** 분실물 사진 전용 버킷. media(게시판·아카이브)와 분리해서 쓴다. */
export const STORAGE_BUCKET_LOST_FOUND = "lost-found";

/** 업로드 가능한 이미지 형식. Storage 버킷(0010)에도 같은 목록이 걸려 있다. */
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** 이미지 최대 크기 4MB. 배포(Vercel) 요청 본문 한도 4.5MB 안에 들도록 버킷 한도(5MB)보다 작게 둔다. */
export const MAX_IMAGE_SIZE = 4 * 1024 * 1024;

/** 입력값 최대 길이. 초과하면 400 으로 돌려보낸다. */
export const FIELD_LIMITS = {
  title: 100,
  description: 1000,
  location: 100,
  storageLocation: 100,
  privateNote: 500,
  claimedBy: 50,
  pickupPlace: 50,
  pickupHours: 100,
} as const;

/**
 * "찾으러 오는 법" 안내 문구.
 * place · hours 는 임원이 관리 화면에서 고치는 lost_found_settings 값을 쓰고,
 * 여기 값은 그 테이블을 읽지 못했을 때의 대체값이다. verifyNote 는 항상 이 상수를 쓴다.
 */
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

  const deadlineMonth = deadline.getUTCMonth() + 1;
  const deadlineDay = deadline.getUTCDate();

  return {
    dateKey: deadline.toISOString().slice(0, 10),
    label: `${deadlineMonth}월 ${deadlineDay}일`,
    /** 목록 카드처럼 좁은 자리에 쓰는 'MM.DD' (예: '10.31') */
    shortLabel: `${String(deadlineMonth).padStart(2, "0")}.${String(deadlineDay).padStart(2, "0")}`,
  };
}
