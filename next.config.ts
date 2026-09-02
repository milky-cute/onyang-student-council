import type { NextConfig } from "next";

/**
 * Supabase Storage 의 공개 이미지를 next/image 로 띄울 수 있도록 호스트를 허용한다.
 * 호스트 이름은 NEXT_PUBLIC_SUPABASE_URL 에서 뽑아 쓴다.
 *
 * ⚠️ 2단계 이후 feature 브랜치에서는 이 파일을 수정하지 않는다.
 */
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
