-- =============================================================================
-- 온양고등학교 학생회 웹사이트 — 초기 스키마 (테이블 5개 + RLS + 함수)
--
-- 실행 방법: Supabase 대시보드 > SQL Editor 에 이 파일 전체를 붙여넣고 Run.
--            (Supabase CLI 를 연결했다면 `supabase db push`)
--
-- 접근 규칙 요약
--   - 방문자(anon)  : board_posts / monthly_activities / archive_photos 읽기만
--   - 방문자(anon)  : requests 는 직접 select 불가.
--                     submit_request() 로 제출하고 get_my_requests() 로만 조회
--   - 임원(officers): 모든 테이블에 쓰기 가능 (officers 테이블 자체는 예외, 아래 참고)
-- =============================================================================

-- PIN 해시(crypt/gen_salt)에 필요. Supabase 프로젝트에는 보통 이미 설치되어 있다.
create extension if not exists pgcrypto with schema extensions;


-- -----------------------------------------------------------------------------
-- 1. officers — 학생회 임원
--
-- id 는 auth.users.id 와 같은 값을 쓴다. 즉 "Supabase Auth 계정이 있고
-- 이 테이블에 행이 있는 사람" 만 임원으로 인정된다.
-- 계정 만드는 순서는 README 의 "임원 계정 만들기" 참고.
-- -----------------------------------------------------------------------------
create table if not exists public.officers (
  id         uuid        primary key references auth.users (id) on delete cascade,
  email      text        not null unique,
  name       text        not null,
  department text,                                  -- 예: '기획부', '홍보부'
  role       text        not null default 'member', -- 예: 'president', 'vice', 'department_head', 'member'
  created_at timestamptz not null default now()
);

comment on table public.officers is '학생회 임원. id 는 auth.users.id 와 동일해야 한다.';


-- -----------------------------------------------------------------------------
-- 헬퍼: 지금 요청한 사람이 임원인가?
--
-- security definer 라 RLS 를 우회한다. 이렇게 해야 officers 테이블의 정책이
-- 다시 이 함수를 호출하면서 무한 재귀에 빠지는 것을 막을 수 있다.
-- -----------------------------------------------------------------------------
create or replace function public.is_officer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.officers where id = auth.uid());
$$;

grant execute on function public.is_officer() to anon, authenticated;


-- -----------------------------------------------------------------------------
-- 2. board_posts — 학생회 게시판 (공지 / 활동 포스터)
-- -----------------------------------------------------------------------------
create table if not exists public.board_posts (
  id         uuid        primary key default gen_random_uuid(),
  type       text        not null check (type in ('notice', 'poster')),
  title      text        not null,
  content    text,
  image_url  text,
  author_id  uuid        references public.officers (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists board_posts_created_at_idx
  on public.board_posts (created_at desc);
create index if not exists board_posts_type_created_at_idx
  on public.board_posts (type, created_at desc);


-- -----------------------------------------------------------------------------
-- 3. monthly_activities — 이달의 학생회 (월별 · 부서별 활동)
-- -----------------------------------------------------------------------------
create table if not exists public.monthly_activities (
  id          uuid        primary key default gen_random_uuid(),
  year_month  text        not null check (year_month ~ '^\d{4}-\d{2}$'), -- 'YYYY-MM'
  department  text        not null,
  title       text        not null,
  description text,
  image_url   text,
  author_id   uuid        references public.officers (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists monthly_activities_year_month_idx
  on public.monthly_activities (year_month desc, department);


-- -----------------------------------------------------------------------------
-- 4. archive_photos — 아카이브 (활동 사진)
-- -----------------------------------------------------------------------------
create table if not exists public.archive_photos (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  description text,
  image_url   text        not null,
  album       text,                                 -- 예: '2026 체육대회'
  uploaded_by uuid        references public.officers (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists archive_photos_album_created_at_idx
  on public.archive_photos (album, created_at desc);


-- -----------------------------------------------------------------------------
-- 5. requests — 학생 요구사항
--
-- 학생은 계정 없이 이름 + 학번 + PIN 으로 글을 남기고, 같은 세 가지를 다시
-- 입력해 본인 글만 조회한다. PIN 은 bcrypt 해시로만 저장한다.
-- -----------------------------------------------------------------------------
create table if not exists public.requests (
  id             uuid        primary key default gen_random_uuid(),
  student_name   text        not null,
  student_number text        not null,
  pin_hash       text        not null,              -- crypt(pin, gen_salt('bf'))
  title          text        not null,
  category       text,                              -- 예: '시설', '급식', '행사'
  content        text        not null,
  status         text        not null default '대기' check (status in ('대기', '답변완료')),
  answer         text,
  answered_by    uuid        references public.officers (id) on delete set null,
  created_at     timestamptz not null default now(),
  answered_at    timestamptz
);

create index if not exists requests_status_created_at_idx
  on public.requests (status, created_at desc);
-- 본인 글 조회(이름 + 학번)를 빠르게 하기 위한 인덱스
create index if not exists requests_student_idx
  on public.requests (student_name, student_number);


-- =============================================================================
-- Row Level Security
-- =============================================================================
alter table public.officers           enable row level security;
alter table public.board_posts        enable row level security;
alter table public.monthly_activities enable row level security;
alter table public.archive_photos     enable row level security;
alter table public.requests           enable row level security;

-- 이 파일을 실수로 두 번 실행해도 "policy already exists" 로 막히지 않도록,
-- 아래에서 만들 테이블들의 기존 정책을 먼저 전부 지운다.
do $$
declare
  r record;
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'officers', 'board_posts', 'monthly_activities', 'archive_photos', 'requests'
      )
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end
$$;


-- officers -------------------------------------------------------------------
-- 임원 명단은 임원끼리만 볼 수 있다.
--
-- 주의: 임원 추가/삭제는 정책으로 열어두지 않았다. 아무 임원이나 임원을
-- 만들 수 있으면 권한 상승이 되기 때문이다. 새 임원 등록은 Supabase 대시보드
-- (service_role 권한)에서 한다 — README 참고.
create policy "임원만 임원 명단 조회"
  on public.officers for select
  to authenticated
  using (public.is_officer());

create policy "본인 정보만 수정"
  on public.officers for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());


-- board_posts ----------------------------------------------------------------
create policy "누구나 게시글 조회"
  on public.board_posts for select
  to anon, authenticated
  using (true);

create policy "임원만 게시글 작성"
  on public.board_posts for insert
  to authenticated
  with check (public.is_officer());

create policy "임원만 게시글 수정"
  on public.board_posts for update
  to authenticated
  using (public.is_officer())
  with check (public.is_officer());

create policy "임원만 게시글 삭제"
  on public.board_posts for delete
  to authenticated
  using (public.is_officer());


-- monthly_activities ---------------------------------------------------------
create policy "누구나 월별 활동 조회"
  on public.monthly_activities for select
  to anon, authenticated
  using (true);

create policy "임원만 월별 활동 작성"
  on public.monthly_activities for insert
  to authenticated
  with check (public.is_officer());

create policy "임원만 월별 활동 수정"
  on public.monthly_activities for update
  to authenticated
  using (public.is_officer())
  with check (public.is_officer());

create policy "임원만 월별 활동 삭제"
  on public.monthly_activities for delete
  to authenticated
  using (public.is_officer());


-- archive_photos -------------------------------------------------------------
create policy "누구나 사진 조회"
  on public.archive_photos for select
  to anon, authenticated
  using (true);

create policy "임원만 사진 등록"
  on public.archive_photos for insert
  to authenticated
  with check (public.is_officer());

create policy "임원만 사진 수정"
  on public.archive_photos for update
  to authenticated
  using (public.is_officer())
  with check (public.is_officer());

create policy "임원만 사진 삭제"
  on public.archive_photos for delete
  to authenticated
  using (public.is_officer());


-- requests -------------------------------------------------------------------
-- select / insert 정책을 방문자에게 주지 않는다.
-- → 방문자는 requests 를 직접 읽을 수도, 직접 넣을 수도 없고
--   아래 두 함수(submit_request / get_my_requests)로만 접근한다.
create policy "임원만 요구사항 조회"
  on public.requests for select
  to authenticated
  using (public.is_officer());

create policy "임원만 요구사항 답변"
  on public.requests for update
  to authenticated
  using (public.is_officer())
  with check (public.is_officer());

create policy "임원만 요구사항 삭제"
  on public.requests for delete
  to authenticated
  using (public.is_officer());


-- =============================================================================
-- 요구사항 전용 함수 (RLS 를 우회하는 유일한 통로)
-- =============================================================================

-- 요구사항 제출. PIN 을 서버에서 해시하므로 원문 PIN 은 저장되지 않는다.
create or replace function public.submit_request(
  p_student_name   text,
  p_student_number text,
  p_pin            text,
  p_title          text,
  p_category       text,
  p_content        text
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_id uuid;
begin
  if length(coalesce(p_pin, '')) < 4 then
    raise exception 'PIN 은 4자리 이상이어야 합니다.';
  end if;

  if length(trim(coalesce(p_student_name, ''))) = 0
     or length(trim(coalesce(p_student_number, ''))) = 0 then
    raise exception '이름과 학번을 입력해주세요.';
  end if;

  if length(trim(coalesce(p_title, ''))) = 0
     or length(trim(coalesce(p_content, ''))) = 0 then
    raise exception '제목과 내용을 입력해주세요.';
  end if;

  insert into public.requests (
    student_name, student_number, pin_hash, title, category, content
  )
  values (
    trim(p_student_name),
    trim(p_student_number),
    crypt(p_pin, gen_salt('bf')),
    trim(p_title),
    nullif(trim(coalesce(p_category, '')), ''),
    p_content
  )
  returning id into v_id;

  return v_id;
end;
$$;

grant execute on function
  public.submit_request(text, text, text, text, text, text)
  to anon, authenticated;


-- 본인 요구사항 조회. 이름 + 학번 + PIN 이 모두 맞는 행만 돌려준다.
-- pin_hash 와 개인정보는 반환 컬럼에 포함하지 않는다.
create or replace function public.get_my_requests(
  p_student_name   text,
  p_student_number text,
  p_pin            text
)
returns table (
  id          uuid,
  title       text,
  category    text,
  content     text,
  status      text,
  answer      text,
  created_at  timestamptz,
  answered_at timestamptz
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select r.id, r.title, r.category, r.content,
         r.status, r.answer, r.created_at, r.answered_at
  from public.requests r
  where r.student_name = trim(p_student_name)
    and r.student_number = trim(p_student_number)
    and r.pin_hash = crypt(p_pin, r.pin_hash)
  order by r.created_at desc;
$$;

grant execute on function
  public.get_my_requests(text, text, text)
  to anon, authenticated;
