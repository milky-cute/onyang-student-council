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
} as const;
