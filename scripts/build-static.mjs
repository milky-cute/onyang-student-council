#!/usr/bin/env node
/**
 * GitHub Pages(github.io)용 "읽기 전용" 정적 사이트를 만든다.
 *
 * 왜 필요한가: 학교 와이파이(교육청 필터)가 *.vercel.app 을 막아서,
 * 학교 안에서도 열리는 github.io 주소에 같은 화면을 올려 둔다.
 *
 * 원본 코드는 건드리지 않는다. 저장소를 .static-build/ 로 복사한 뒤
 * 복사본에만 아래 변환을 적용하고 `next build`(output: "export")를 돌린다.
 * 결과물은 ./out 에 생긴다. Vercel 배포는 이 스크립트와 무관하게 그대로다.
 *
 * 정적 버전에서 빠지는 것 (서버가 필요해서 github.io 에서는 동작 불가):
 *   - 임원 로그인·관리 화면(/admin), 모든 API(/api)
 *   - 입장권(/projects/[id]/pass), 요구사항 제출·조회 폼
 *   - "이달의 학생자치회"의 달 선택 (가장 최근 달만 보임)
 * 이 기능들은 Vercel 주소로 연결되는 링크로 바꾼다(데이터로 접속하면 동작).
 *
 * 데이터(급식·사업·분실물·일정 등)는 빌드하는 순간의 내용으로 고정된다.
 * .github/workflows/pages.yml 이 주기적으로 다시 빌드해서 최신으로 맞춘다.
 *
 * 원본 코드가 바뀌어 변환할 문구를 못 찾으면 일부러 실패한다.
 * (조용히 깨진 사이트가 올라가는 것보다 빌드가 멈추는 게 낫다.)
 *
 * 사용법:  node scripts/build-static.mjs
 *   필요한 환경변수: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   선택: PAGES_BASE_PATH (기본 /onyang-student-council), NEIS_API_KEY
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const BUILD = path.join(ROOT, ".static-build");
const OUT = path.join(ROOT, "out");
const BASE_PATH = process.env.PAGES_BASE_PATH ?? "/onyang-student-council";
const VERCEL_URL = "https://onyang-student-council.vercel.app";

for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]) {
  if (!process.env[key]) {
    console.error(`환경변수 ${key} 가 없습니다.`);
    process.exit(1);
  }
}

// 1) 복사 ---------------------------------------------------------------
const SKIP = new Set(["node_modules", ".git", ".next", "out", ".static-build", ".vercel"]);
fs.rmSync(BUILD, { recursive: true, force: true });
fs.mkdirSync(BUILD);
for (const entry of fs.readdirSync(ROOT)) {
  if (SKIP.has(entry)) continue;
  fs.cpSync(path.join(ROOT, entry), path.join(BUILD, entry), { recursive: true });
}
fs.symlinkSync(path.join(ROOT, "node_modules"), path.join(BUILD, "node_modules"), "dir");

const p = (rel) => path.join(BUILD, rel);
const remove = (rel) => fs.rmSync(p(rel), { recursive: true, force: true });
const write = (rel, text) => fs.writeFileSync(p(rel), text);
const append = (rel, text) => fs.appendFileSync(p(rel), text);

/** 정확히 일치하는 문구를 바꾼다. 못 찾으면 실패. */
function replace(rel, from, to, { all = false } = {}) {
  const file = p(rel);
  const src = fs.readFileSync(file, "utf8");
  if (!src.includes(from)) {
    throw new Error(`[build-static] ${rel} 에서 바꿀 문구를 찾지 못했습니다:\n${from}`);
  }
  fs.writeFileSync(file, all ? src.split(from).join(to) : src.replace(from, to));
}

// 2) 서버가 필요한 부분 제거 ----------------------------------------------
remove("app/api");
remove("app/admin");
remove("app/projects/[id]/pass");
remove("app/requests/check");
remove("proxy.ts");
remove("app/robots.ts");
remove("app/sitemap.ts");

// 3) next.config: 정적 내보내기 ------------------------------------------
write(
  "next.config.ts",
  `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: ${JSON.stringify(BASE_PATH)},
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
`,
);

// 4) 쿠키를 읽는 서버 클라이언트 → 쿠키 없는 공개 클라이언트 --------------
write(
  "lib/supabase/server.ts",
  `import { createPublicClient } from "./public";

/** 정적 빌드용: 로그인 상태가 없으므로 공개(anon) 클라이언트를 돌려준다. */
export async function createClient() {
  return createPublicClient();
}
`,
);

// 5) ISR(revalidate) 은 정적 내보내기에서 지원되지 않는다 -----------------
for (const rel of ["app/archive/page.tsx", "app/archive/[album]/page.tsx"]) {
  replace(rel, "export const revalidate = 60;", "");
}

// 6) 동적 경로: 빌드 때 존재하는 항목만 미리 만든다 ------------------------
const staticParams = (table, column, key) => `

export const dynamicParams = false;

export async function generateStaticParams() {
  const { createPublicClient } = await import("@/lib/supabase/public");
  const { data, error } = await createPublicClient().from(${JSON.stringify(table)}).select(${JSON.stringify(column)});
  if (error) throw new Error("generateStaticParams(${table}): " + error.message);
  const values = [...new Set((data ?? []).map((row) => row[${JSON.stringify(column)}]).filter(Boolean))];
  // 항목이 하나도 없으면 빌드가 실패하므로 자리만 채우는 값을 하나 둔다(열면 '없음' 화면).
  return (values.length ? values : ["_"]).map((v) => ({ ${key}: String(v) }));
}
`;
append("app/lost-found/[id]/page.tsx", staticParams("lost_found_items", "id", "id"));
append("app/projects/[id]/page.tsx", staticParams("projects", "id", "id"));
append("app/archive/[album]/page.tsx", staticParams("archive_photos", "album", "album"));

// 7) 이달의 학생자치회: ?ym= 쿼리를 못 쓰므로 최신 달만 보여준다 -----------
replace(
  "app/monthly/page.tsx",
  "const requestedMonth = (await searchParams).ym;",
  "void searchParams;\n  const requestedMonth: string | undefined = undefined;",
);
replace("app/monthly/page.tsx", "<MonthSelect months={months} selected={selectedMonth} />", "");
replace("app/monthly/page.tsx", 'import { MonthSelect } from "./month-select";', "");
replace(
  "app/monthly/page.tsx",
  "searchParams: Promise<{ ym?: string }>;",
  "searchParams?: Promise<{ ym?: string }>;",
);

// 8) 요구사항: 제출·조회 폼 대신 Vercel 주소 안내 -------------------------
const vercelNotice = (what) =>
  `<div className="mt-6 rounded-card border border-slate-200 bg-white px-5 py-4 text-body-sm text-slate-700">${what}는 이 주소에서 할 수 없어요. 휴대폰 데이터로 <a href="${VERCEL_URL}/requests" className="font-semibold text-brand-700 underline">원래 사이트</a>에서 이용해 주세요.</div>`;
replace("app/requests/page.tsx", "<RequestForm />", vercelNotice("요구사항 제출·조회"));
replace("app/requests/page.tsx", 'import { RequestForm } from "./request-form";', "");
replace(
  "app/requests/page.tsx",
  'href="/requests/check"',
  `href="${VERCEL_URL}/requests/check"`,
);

// 9) 임원 로그인·입장권 링크 → Vercel 주소 --------------------------------
replace("components/site-header.tsx", 'href="/admin"', `href="${VERCEL_URL}/admin"`);
replace("components/site-footer.tsx", 'href="/admin"', `href="${VERCEL_URL}/admin"`);
replace(
  "app/projects/[id]/page.tsx",
  "href={`/projects/${project.id}/pass`}",
  `href={\`${VERCEL_URL}/projects/\${project.id}/pass\`}`,
);

// 10) public/ 파일 경로에 basePath 붙이기 (next/image 는 자동으로 안 붙인다)
replace("components/site-header.tsx", 'src="/logo.jpg"', `src="${BASE_PATH}/logo.jpg"`);

// 11) 빌드 ---------------------------------------------------------------
execSync("npx next build", { cwd: BUILD, stdio: "inherit", env: { ...process.env } });

fs.rmSync(OUT, { recursive: true, force: true });
fs.renameSync(path.join(BUILD, "out"), OUT);
// GitHub Pages 의 Jekyll 처리를 끈다(_next 폴더가 무시되지 않게).
fs.writeFileSync(path.join(OUT, ".nojekyll"), "");
console.log(`\n정적 사이트 생성 완료 → ${path.relative(process.cwd(), OUT) || "out"}/ (basePath ${BASE_PATH})`);
