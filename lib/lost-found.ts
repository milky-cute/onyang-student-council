/**
 * 분실물센터 공용 상수.
 *
 * 등록 폼(클라이언트)과 API 라우트(서버)가 같은 제한을 써야 해서 한곳에 모아둔다.
 * 로그인 없이 누구나 쓰는 게시판이라 길이 제한이 곧 스팸 방어선이다.
 */

export const LOST_FOUND_TYPES = ["found", "lost"] as const;

export type LostFoundTypeValue = (typeof LOST_FOUND_TYPES)[number];

export const TYPE_LABELS: Record<LostFoundTypeValue, string> = {
  found: "습득물",
  lost: "분실물",
};

/** 입력값 최대 길이. 서버에서 자르지 않고 초과하면 400 으로 돌려보낸다. */
export const FIELD_LIMITS = {
  title: 100,
  description: 1000,
  location: 100,
  storageLocation: 100,
  reporterName: 30,
  reporterClass: 30,
} as const;

/** 업로드 가능한 이미지 형식. Storage 버킷(0008)에도 같은 목록이 걸려 있다. */
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** 이미지 최대 크기 5MB. Storage 버킷 file_size_limit 와 같은 값. */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export const STORAGE_BUCKET_LOST_FOUND = "lost-found";

export function isLostFoundType(value: unknown): value is LostFoundTypeValue {
  return typeof value === "string" && LOST_FOUND_TYPES.includes(value as LostFoundTypeValue);
}
