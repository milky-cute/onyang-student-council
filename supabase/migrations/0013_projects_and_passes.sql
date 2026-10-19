-- =============================================================================
-- 학생회 사업 + 입장권
--   projects / project_photos / project_links  — 사업 (조회는 누구나, 쓰기는 임원)
--   projects Storage 버킷                        — 사업 사진
--   pass_holders / pass_credentials / pass_sessions — 입장권 (anon 직접 접근 불가)
--   pass_login / pass_status / pass_logout        — 학생이 입장권에 접근하는 유일한 통로
--
-- 실행 방법: Supabase 대시보드 > SQL Editor 에 붙여넣고 Run
--            (0001_initial_schema.sql 실행 이후. public.is_officer() · pgcrypto 사용)
--            다시 실행해도 안전하다.
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;


-- -----------------------------------------------------------------------------
-- 1. projects — 학생회 사업
--
-- 상태(상시 / 진행 예정 / 진행중 / 끝남)와 신청 상태는 저장하지 않고
-- 날짜로 매번 계산한다(lib/projects.ts). 날짜는 언제든 고칠 수 있다.
-- -----------------------------------------------------------------------------
create table if not exists public.projects (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  summary     text,                                   -- 한 줄 소개 (선택)
  description text        not null,
  is_always   boolean     not null default false,     -- 상시 사업
  start_date  date,                                   -- 행사 시작일 (상시가 아니면 필수)
  end_date    date,                                   -- 행사 종료일 (비우면 시작일 하루)
  apply_start date,                                   -- 신청 시작일 (선택)
  apply_end   date,                                   -- 신청 마감일 (선택)
  target      text,                                   -- 대상
  place       text,                                   -- 장소
  contact     text,                                   -- 문의처
  has_pass    boolean     not null default false,     -- 입장권 사용 여부
  pass_label  text,                                   -- 입장권 이름 (비우면 '{제목} 입장권')
  is_pinned   boolean     not null default false,     -- 상단 고정
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint projects_start_required check (is_always or start_date is not null),
  constraint projects_end_after_start check (
    end_date is null or start_date is null or end_date >= start_date
  ),
  constraint projects_apply_end_after_start check (
    apply_end is null or apply_start is null or apply_end >= apply_start
  )
);

comment on table public.projects is
  '학생회 사업. 상태는 날짜로 계산한다. 끝난 사업도 지우지 않고 보관한다. 조회는 누구나, 쓰기는 임원만.';

create index if not exists projects_created_at_idx
  on public.projects (created_at desc);

-- 수정 시각은 DB 가 채운다.
create or replace function public.projects_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.projects_set_updated_at();


-- -----------------------------------------------------------------------------
-- 2. project_photos — 사업 사진 (sort_order 가 가장 작은 것이 대표 사진)
-- -----------------------------------------------------------------------------
create table if not exists public.project_photos (
  id         uuid        primary key default gen_random_uuid(),
  project_id uuid        not null references public.projects (id) on delete cascade,
  image_url  text        not null,
  sort_order integer     not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists project_photos_project_sort_idx
  on public.project_photos (project_id, sort_order);


-- -----------------------------------------------------------------------------
-- 3. project_links — 사업 링크 (신청 구글폼, 오픈채팅 등. 사업당 최대 5개는 앱에서 검사)
--
-- kind = 'apply' 인 링크는 신청 기간 규칙을 따르고, 'other' 는 사업이 끝나도 열 수 있다.
-- -----------------------------------------------------------------------------
create table if not exists public.project_links (
  id         uuid        primary key default gen_random_uuid(),
  project_id uuid        not null references public.projects (id) on delete cascade,
  label      text        not null,                    -- 버튼 이름
  url        text        not null check (url like 'https://%'),
  kind       text        not null default 'other' check (kind in ('apply', 'other')),
  show_qr    boolean     not null default false,      -- 상세 페이지에서 QR 로도 보여주기
  sort_order integer     not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists project_links_project_sort_idx
  on public.project_links (project_id, sort_order);


-- -----------------------------------------------------------------------------
-- 4. pass_holders — 사업별 입장권 명단 (임원이 구글폼 응답을 보고 승인한 학생)
-- -----------------------------------------------------------------------------
create table if not exists public.pass_holders (
  id             uuid        primary key default gen_random_uuid(),
  project_id     uuid        not null references public.projects (id) on delete cascade,
  student_number text        not null,
  student_name   text        not null,
  is_suspended   boolean     not null default false,  -- 사용 정지
  created_at     timestamptz not null default now(),
  unique (project_id, student_number)
);

comment on table public.pass_holders is
  '입장권 명단. 임원만 접근한다. 학생은 pass_login / pass_status 함수로만 자기 정보를 확인한다.';

-- pass_login 이 이름 + 학번으로 명단을 찾는다.
create index if not exists pass_holders_student_idx
  on public.pass_holders (student_number, student_name);


-- -----------------------------------------------------------------------------
-- 5. pass_credentials — 학번별 PIN (모든 사업 공통)
--
-- 처음 입장권을 열 때 입력한 PIN 이 그 학생의 PIN 이 된다. bcrypt 해시로만 저장한다.
-- 5번 틀리면 10분 잠금.
-- -----------------------------------------------------------------------------
create table if not exists public.pass_credentials (
  student_number  text        primary key,
  student_name    text        not null,
  pin_hash        text        not null,              -- crypt(pin, gen_salt('bf'))
  failed_attempts integer     not null default 0,
  locked_until    timestamptz,
  created_at      timestamptz not null default now()
);


-- -----------------------------------------------------------------------------
-- 6. pass_sessions — 휴대폰 로그인 유지(180일)
--
-- 원래 토큰은 httpOnly 쿠키에만 있고, DB 에는 sha256 해시만 저장한다.
-- -----------------------------------------------------------------------------
create table if not exists public.pass_sessions (
  token_hash     text        primary key,             -- encode(digest(token, 'sha256'), 'hex')
  student_number text        not null,
  created_at     timestamptz not null default now(),
  expires_at     timestamptz not null
);

create index if not exists pass_sessions_student_idx
  on public.pass_sessions (student_number);


-- =============================================================================
-- Row Level Security
--
-- 사업 3개 테이블: 조회는 누구나, 쓰기는 임원만.
-- 입장권 3개 테이블: anon 정책 없음(직접 select 불가). 아래 security definer 함수로만 접근.
-- 애플리케이션(API 라우트)에서도 officers 테이블을 한 번 더 확인한다(이중 방어).
-- =============================================================================
alter table public.projects         enable row level security;
alter table public.project_photos   enable row level security;
alter table public.project_links    enable row level security;
alter table public.pass_holders     enable row level security;
alter table public.pass_credentials enable row level security;
alter table public.pass_sessions    enable row level security;

-- 정책이 실수로 생겨도 anon 은 테이블 권한 자체가 없도록 한 번 더 막는다.
revoke all on public.pass_holders, public.pass_credentials, public.pass_sessions from anon;

-- 이 파일을 다시 실행해도 "policy already exists" 로 막히지 않도록 먼저 지운다.
do $$
declare
  r record;
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'projects', 'project_photos', 'project_links',
        'pass_holders', 'pass_credentials', 'pass_sessions'
      )
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end
$$;


-- projects -------------------------------------------------------------------
create policy "누구나 사업 조회"
  on public.projects for select
  to anon, authenticated
  using (true);

create policy "임원만 사업 등록"
  on public.projects for insert
  to authenticated
  with check (public.is_officer());

create policy "임원만 사업 수정"
  on public.projects for update
  to authenticated
  using (public.is_officer())
  with check (public.is_officer());

create policy "임원만 사업 삭제"
  on public.projects for delete
  to authenticated
  using (public.is_officer());


-- project_photos -------------------------------------------------------------
create policy "누구나 사업 사진 조회"
  on public.project_photos for select
  to anon, authenticated
  using (true);

create policy "임원만 사업 사진 등록"
  on public.project_photos for insert
  to authenticated
  with check (public.is_officer());

create policy "임원만 사업 사진 수정"
  on public.project_photos for update
  to authenticated
  using (public.is_officer())
  with check (public.is_officer());

create policy "임원만 사업 사진 삭제"
  on public.project_photos for delete
  to authenticated
  using (public.is_officer());


-- project_links --------------------------------------------------------------
create policy "누구나 사업 링크 조회"
  on public.project_links for select
  to anon, authenticated
  using (true);

create policy "임원만 사업 링크 등록"
  on public.project_links for insert
  to authenticated
  with check (public.is_officer());

create policy "임원만 사업 링크 수정"
  on public.project_links for update
  to authenticated
  using (public.is_officer())
  with check (public.is_officer());

create policy "임원만 사업 링크 삭제"
  on public.project_links for delete
  to authenticated
  using (public.is_officer());


-- pass_holders — 임원만 전부 ----------------------------------------------------
create policy "임원만 입장권 명단 조회"
  on public.pass_holders for select
  to authenticated
  using (public.is_officer());

create policy "임원만 입장권 명단 추가"
  on public.pass_holders for insert
  to authenticated
  with check (public.is_officer());

create policy "임원만 입장권 명단 수정"
  on public.pass_holders for update
  to authenticated
  using (public.is_officer())
  with check (public.is_officer());

create policy "임원만 입장권 명단 삭제"
  on public.pass_holders for delete
  to authenticated
  using (public.is_officer());


-- pass_credentials — 임원만 조회·삭제(PIN 초기화). 등록·수정은 pass_login 함수만 ----------
create policy "임원만 입장권 PIN 조회"
  on public.pass_credentials for select
  to authenticated
  using (public.is_officer());

create policy "임원만 입장권 PIN 삭제"
  on public.pass_credentials for delete
  to authenticated
  using (public.is_officer());


-- pass_sessions — 임원만 삭제(PIN 초기화). 생성은 pass_login 함수만 ------------------
-- delete ... where student_number = ? 는 행을 읽어야 하므로 조회 정책도 함께 둔다.
create policy "임원만 입장권 세션 조회"
  on public.pass_sessions for select
  to authenticated
  using (public.is_officer());

create policy "임원만 입장권 세션 삭제"
  on public.pass_sessions for delete
  to authenticated
  using (public.is_officer());


-- =============================================================================
-- Storage — projects 버킷 (사업 사진). 조회는 누구나, 쓰기는 임원만.
-- =============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'projects',
  'projects',
  true,                       -- 공개 버킷: 이미지 URL 을 그대로 <img> 에 쓸 수 있다
  5242880,                    -- 파일당 5MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;


do $$
declare
  r record;
begin
  for r in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname like 'projects %'
  loop
    execute format('drop policy %I on storage.objects', r.policyname);
  end loop;
end
$$;

create policy "projects 누구나 조회"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'projects');

create policy "projects 임원만 업로드"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'projects' and public.is_officer());

create policy "projects 임원만 수정"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'projects' and public.is_officer())
  with check (bucket_id = 'projects' and public.is_officer());

create policy "projects 임원만 삭제"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'projects' and public.is_officer());


-- =============================================================================
-- 입장권 전용 함수 (RLS 를 우회하는 유일한 통로)
-- =============================================================================

-- 로그인. 이름 + 학번이 어느 사업 명단에든 있어야 한다.
--   - 처음이면 입력한 PIN 을 그 학번의 PIN 으로 정한다(is_new_pin = true).
--   - 명단에 없거나 PIN 이 틀리면 token = null 인 행을 돌려준다(같은 결과 → 명단 추측 방지).
--     예외를 던지면 늘린 실패 횟수까지 롤백되므로 틀린 경우는 예외 대신 null 을 돌려준다.
--   - 5번 틀리면 10분 잠금. 잠긴 동안은 'PASS_LOCKED' 예외.
--   - 형식이 틀리면(PIN 4자리 숫자가 아님 등) 'PASS_INVALID_INPUT' 예외.
-- 성공하면 무작위 토큰을 만들어 해시만 저장하고, 원래 토큰은 한 번만 돌려준다.
create or replace function public.pass_login(
  p_name   text,
  p_number text,
  p_pin    text
)
returns table (token text, is_new_pin boolean)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_name   text := trim(coalesce(p_name, ''));
  v_number text := trim(coalesce(p_number, ''));
  v_cred   public.pass_credentials%rowtype;
  v_token  text;
  v_new    boolean := false;
begin
  if v_name = '' or v_number = '' or coalesce(p_pin, '') !~ '^[0-9]{4}$' then
    raise exception 'PASS_INVALID_INPUT';
  end if;

  if not exists (
    select 1 from public.pass_holders h
    where h.student_number = v_number and h.student_name = v_name
  ) then
    return query select null::text, null::boolean;
    return;
  end if;

  select * into v_cred
  from public.pass_credentials c
  where c.student_number = v_number
  for update;

  if not found then
    insert into public.pass_credentials (student_number, student_name, pin_hash)
    values (v_number, v_name, crypt(p_pin, gen_salt('bf')));
    v_new := true;
  else
    if v_cred.locked_until is not null and v_cred.locked_until > now() then
      raise exception 'PASS_LOCKED';
    end if;

    if v_cred.pin_hash <> crypt(p_pin, v_cred.pin_hash) then
      update public.pass_credentials c
      set failed_attempts = case when v_cred.failed_attempts + 1 >= 5 then 0
                                 else v_cred.failed_attempts + 1 end,
          locked_until    = case when v_cred.failed_attempts + 1 >= 5
                                 then now() + interval '10 minutes'
                                 else null end
      where c.student_number = v_number;

      return query select null::text, null::boolean;
      return;
    end if;

    update public.pass_credentials c
    set failed_attempts = 0,
        locked_until    = null,
        student_name    = v_name
    where c.student_number = v_number;
  end if;

  -- 만료된 세션은 이 기회에 정리한다.
  delete from public.pass_sessions s
  where s.student_number = v_number and s.expires_at <= now();

  v_token := encode(gen_random_bytes(32), 'hex');

  insert into public.pass_sessions (token_hash, student_number, expires_at)
  values (encode(digest(v_token, 'sha256'), 'hex'), v_number, now() + interval '180 days');

  return query select v_token, v_new;
end;
$$;

grant execute on function public.pass_login(text, text, text) to anon, authenticated;


-- 이 휴대폰(토큰)의 학생과 이 사업의 입장권 상태.
-- 세션이 없거나 만료됐으면 아무 행도 돌려주지 않는다.
create or replace function public.pass_status(
  p_token      text,
  p_project_id uuid
)
returns table (
  student_name   text,
  student_number text,
  is_listed      boolean,
  is_suspended   boolean
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select coalesce(h.student_name, c.student_name),
         s.student_number,
         h.id is not null,
         coalesce(h.is_suspended, false)
  from public.pass_sessions s
  join public.pass_credentials c on c.student_number = s.student_number
  left join public.pass_holders h
    on h.student_number = s.student_number and h.project_id = p_project_id
  where s.token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex')
    and s.expires_at > now();
$$;

grant execute on function public.pass_status(text, uuid) to anon, authenticated;


-- 로그아웃("다른 학생으로 로그인"). 이 토큰의 세션만 지운다.
create or replace function public.pass_logout(p_token text)
returns void
language sql
security definer
set search_path = public, extensions
as $$
  delete from public.pass_sessions
  where token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex');
$$;

grant execute on function public.pass_logout(text) to anon, authenticated;
