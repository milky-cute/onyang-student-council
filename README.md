# 온양고등학교 학생회 웹사이트

학생회 공지·활동·사진·요구사항을 한곳에서 볼 수 있는 공식 웹사이트입니다.

- **프레임워크**: Next.js 16 (App Router) · TypeScript · Tailwind CSS v4
- **백엔드**: Supabase (Postgres · Auth · Storage) — 무료 티어 기준
- **배포**: Vercel

---

## 1. 현재 상태 (1단계 완료)

기반 공사만 끝난 상태입니다. 4개 라우트는 **껍데기(“준비중입니다”)** 이고, 실제 기능은 2단계에서 붙입니다.

| 경로            | 내용                          | 상태            |
| --------------- | ----------------------------- | --------------- |
| `/`             | 홈                            | 완료            |
| `/board`        | 학생회 게시판 (공지·포스터)   | 껍데기          |
| `/monthly`      | 이달의 학생회 (부서별 활동)   | 껍데기          |
| `/archive`      | 아카이브 (활동 사진)          | 껍데기          |
| `/requests`     | 요구사항 (제출·조회)          | 껍데기          |
| `/admin/login`  | 임원 로그인                   | 완료            |
| `/admin`        | 임원 대시보드 (로그인 필요)   | 껍데기 + 인증   |

DB 스키마 5개 테이블, RLS 정책, 요구사항 조회 함수, Storage 버킷은 **모두 작성 완료**되어 있어 2단계에서 바로 쓰면 됩니다.

---

## 2. 처음 실행하기

```bash
npm install
cp .env.example .env.local   # 그리고 실제 값 채우기 (아래 3번 참고)
npm run dev                  # http://localhost:3000
```

> `.env.local` 은 자리표시자 값이 들어간 채로 커밋되지 않은 상태입니다.
> 값을 채우기 전에도 공개 페이지는 정상적으로 뜨지만, 로그인은 동작하지 않습니다.

기타 명령:

```bash
npm run build   # 프로덕션 빌드
npm run lint    # ESLint
npx tsc --noEmit  # 타입 검사
```

---

## 3. Supabase 설정

### 3-1. 프로젝트 만들고 환경변수 채우기

1. <https://supabase.com> 에서 새 프로젝트 생성 (Region 은 `Northeast Asia (Seoul)` 권장)
2. **Project Settings → API** 에서 두 값을 복사해 `.env.local` 에 붙여넣기

| 환경변수                        | 설명                              | 어디서 쓰나            |
| ------------------------------- | --------------------------------- | ---------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Project URL                       | 브라우저 + 서버 + 프록시 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key                   | 브라우저 + 서버 + 프록시 |

두 값 모두 **공개되어도 되는 값**입니다 (`NEXT_PUBLIC_` 접두사). 실제 접근 제어는 DB 의 Row Level Security 가 담당합니다.
`service_role` 키는 이 프로젝트에서 사용하지 않으며 **절대 커밋하지 마세요.**

### 3-2. 마이그레이션 실행

Supabase 대시보드 → **SQL Editor** 에서 아래 두 파일을 **순서대로** 붙여넣고 실행합니다.

1. `supabase/migrations/0001_initial_schema.sql` — 테이블 5개 + RLS + 함수
2. `supabase/migrations/0002_storage.sql` — 이미지 버킷 + Storage 정책

(두 파일 모두 **여러 번 실행해도 안전**하도록 작성되어 있습니다.)

### 3-3. 임원 계정 만들기

임원으로 인정되려면 **Auth 계정**과 **`officers` 테이블 행**이 둘 다 있어야 합니다.

1. 대시보드 → **Authentication → Users → Add user** 에서 이메일/비밀번호로 계정 생성
   (“Auto Confirm User” 체크 — 학교 계정이라 이메일 인증 메일을 쓰지 않습니다)
2. 생성된 유저의 **UID** 를 복사
3. SQL Editor 에서 실행:

```sql
insert into public.officers (id, email, name, department, role)
values (
  '여기에-복사한-UID',
  'student.council@example.com',
  '홍길동',
  '기획부',
  'president'   -- president | vice | department_head | member
);
```

> `officers` 행 추가/삭제는 RLS 정책으로 열어두지 않았습니다.
> 임원이 다른 임원을 마음대로 만들 수 있으면 권한 상승 문제가 생기기 때문에,
> **대시보드(service_role)에서만** 등록하도록 의도적으로 막아둔 것입니다.

---

## 4. DB 스키마 요약

| 테이블               | 용도                | 공개 읽기 | 임원 쓰기 |
| -------------------- | ------------------- | --------- | --------- |
| `officers`           | 학생회 임원 명단    | ✗ (임원만) | 대시보드에서만 |
| `board_posts`        | 게시판 공지·포스터  | ✓         | ✓         |
| `monthly_activities` | 월별 부서 활동      | ✓         | ✓         |
| `archive_photos`     | 활동 사진           | ✓         | ✓         |
| `requests`           | 학생 요구사항       | ✗ (함수로만) | ✓      |

### 요구사항(`requests`) 접근 방식 — 중요

학생은 계정 없이 **이름 + 학번 + PIN** 으로 글을 남깁니다. PIN 은 bcrypt 해시로만 저장됩니다.
`requests` 테이블은 방문자에게 `select` / `insert` 정책을 주지 않았기 때문에 **직접 접근이 불가능**하고,
아래 두 함수를 통해서만 다룰 수 있습니다.

```ts
// 제출
const { data: newId, error } = await supabase.rpc("submit_request", {
  p_student_name: "홍길동",
  p_student_number: "10101",
  p_pin: "1234",
  p_title: "급식 관련 건의",
  p_category: "급식",
  p_content: "...",
});

// 본인 글만 조회 (이름·학번·PIN 이 모두 맞아야 결과가 나온다)
const { data: myRequests, error } = await supabase.rpc("get_my_requests", {
  p_student_name: "홍길동",
  p_student_number: "10101",
  p_pin: "1234",
});
```

`is_officer()` 함수는 “지금 로그인한 사람이 임원인가”를 판정하며 모든 쓰기 정책이 이 함수를 씁니다.

---

## 5. Storage

버킷 하나(`media`)를 세 기능이 폴더로 나눠 씁니다.

```
media/board/<파일명>
media/monthly/<파일명>
media/archive/<파일명>
```

- 공개 버킷이라 업로드된 이미지 URL 을 그대로 `<img>` / `next/image` 에 쓸 수 있습니다.
- 파일당 5MB, 이미지 MIME 만 허용 (무료 티어 저장용량 1GB 고려)
- 업로드·삭제는 임원만 가능
- `next.config.ts` 에 Supabase 호스트가 이미 등록되어 있어 `next/image` 를 바로 쓸 수 있습니다.

---

## 6. 폴더 구조

```
app/
  layout.tsx                  전역 레이아웃 (헤더 + 푸터)      [공용·수정금지]
  page.tsx                    홈                               [공용]
  globals.css                 디자인 토큰 (브랜드 컬러)        [공용·수정금지]
  board/page.tsx              학생회 게시판                    → feature/board-monthly
  monthly/page.tsx            이달의 학생회                    → feature/board-monthly
  archive/page.tsx            아카이브                         → feature/archive-requests
  requests/page.tsx           요구사항                         → feature/archive-requests
  admin/
    login/                    /admin/login — 로그인 페이지     [공용]
    (protected)/              /admin — 로그인해야 접근 가능    [공용]

components/
  site-header.tsx             헤더 + 모바일 햄버거 메뉴        [공용·수정금지]
  site-footer.tsx             푸터                             [공용·수정금지]
  page-header.tsx             하위 페이지 제목 배너            [공용·가져다 쓰기만]

lib/
  site-config.ts              학교명 · 네비게이션 메뉴 정의    [공용·수정금지]
  supabase/                   ★ Supabase 관련은 전부 여기      [공용·수정금지]
    env.ts                    환경변수 + 버킷 이름
    client.ts                 브라우저용   createClient()
    server.ts                 서버용       await createClient()
    proxy.ts                  프록시 전용 세션 갱신
    database.types.ts         DB 타입 정의

proxy.ts                      인증 가드 + 세션 갱신            [공용·수정금지]
supabase/migrations/          SQL 마이그레이션                 [공용]
```

### Supabase 클라이언트 쓰는 법

용도에 따라 **두 개 중 하나**만 import 하면 됩니다. 직접 `createBrowserClient` / `createServerClient` 를 호출하지 마세요.

```ts
// 클라이언트 컴포넌트 ("use client")
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();

// 서버 컴포넌트 · 서버 액션 · 라우트 핸들러
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();   // Next.js 16 에서 cookies() 가 async
```

> **참고**: Next.js 16 부터 `middleware.ts` 가 `proxy.ts` 로 이름이 바뀌었습니다.
> 이 프로젝트의 루트 `proxy.ts` 가 예전 미들웨어 역할을 합니다.

---

## 7. Vercel 배포

`vercel.json` 은 **필요 없습니다.** 표준 Next.js 구조라 Vercel 이 자동으로 인식합니다.

1. 이 저장소를 GitHub 에 push
2. <https://vercel.com/new> 에서 저장소 import
3. **Framework Preset**: Next.js (자동 감지) / **Root Directory**: 저장소 루트 그대로
4. **Environment Variables** 에 아래 두 개 추가 (Production · Preview · Development 모두 체크)

   | Key                             | Value                          |
   | ------------------------------- | ------------------------------ |
   | `NEXT_PUBLIC_SUPABASE_URL`      | Supabase Project URL           |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key       |

5. Deploy

> 환경변수를 나중에 바꾸면 **재배포해야** 반영됩니다 (`NEXT_PUBLIC_` 값은 빌드 시점에 코드로 박히기 때문).

배포 후 Supabase 대시보드 → **Authentication → URL Configuration** 의 Site URL 에 배포된 도메인을 넣어주세요.

---

## 8. 브랜치 전략

`main` 은 이 기반 작업(1단계)이 끝난 시점부터 **보호 브랜치**로 둡니다.
GitHub → Settings → Branches → Add rule 에서 `main` 에 “Require a pull request before merging” 을 켜세요.
2단계부터는 아래 두 브랜치에서 **각각 따로** 작업하고 PR 로 합칩니다.

### `feature/board-monthly`

수정 허용 범위:

```
app/board/**
app/monthly/**
app/api/board/**
app/api/monthly/**
```

### `feature/archive-requests`

수정 허용 범위:

```
app/archive/**
app/requests/**
app/api/archive/**
app/api/requests/**
```

### 두 브랜치 모두 수정 금지 (1단계 이후 고정)

충돌이 나는 지점이 바로 여기입니다. 바꿔야 할 일이 생기면 브랜치에서 고치지 말고 **`main` 에서 별도로 처리**하세요.

```
app/layout.tsx            전역 레이아웃
app/page.tsx              홈
app/globals.css           전역 스타일 · 디자인 토큰
app/admin/**              임원 로그인 · 임원 전용 영역
components/**             헤더 · 푸터 · 공용 컴포넌트
lib/site-config.ts        네비게이션 메뉴 정의
lib/supabase/**           Supabase 클라이언트 전부
proxy.ts                  인증 프록시
next.config.ts            Next.js 설정
supabase/migrations/**    DB 스키마
```

- 공용 컴포넌트(`PageHeader` 등)와 `lib/supabase/*` 는 **가져다 쓰기만** 합니다.
- DB 스키마 변경이 필요하면 브랜치에서 SQL 을 고치지 말고, `main` 에 새 마이그레이션 파일(`0003_...sql`)을 추가한 뒤 두 브랜치가 rebase 합니다.
- `package.json` 에 의존성을 추가해야 하면 상대 브랜치에 먼저 알리세요 (lock 파일 충돌이 잦습니다).
