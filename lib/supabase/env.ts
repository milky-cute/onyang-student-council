/**
 * Supabase 접속 정보. .env.local (배포 시에는 Vercel 환경변수)에서 읽는다.
 *
 * 두 값 모두 NEXT_PUBLIC_ 접두사가 붙어 브라우저에도 노출된다 — 정상이다.
 * anon 키는 공개용이며, 실제 접근 제어는 DB의 Row Level Security 가 담당한다.
 * service_role 키는 이 프로젝트 어디에서도 사용하지 않는다.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `환경변수 ${name} 가 설정되지 않았습니다. .env.example 을 참고해 .env.local 을 채워주세요.`,
    );
  }
  return value;
}

export const SUPABASE_URL = required(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);

export const SUPABASE_ANON_KEY = required(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/** 이미지 업로드에 공용으로 쓰는 Storage 버킷 이름 */
export const STORAGE_BUCKET = "media";
