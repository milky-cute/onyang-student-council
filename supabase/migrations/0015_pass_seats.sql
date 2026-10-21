-- =============================================================================
-- 입장권 좌석 표시 (사업별 선택 기능)
--   projects.pass_seat_enabled / pass_seat_label — 좌석 표시 사용 여부 · 표시 이름
--   pass_holders.seat                            — 학생별 좌석 (임원이 명단에 직접 입력)
--   pass_status                                  — 반환 칸 끝에 seat 추가
--
-- 좌석은 사업 기간 내내 고정이다(날짜별 좌석표 · 자동 배정 없음).
-- 같은 좌석이 두 명에게 있어도 DB 에서 막지 않는다(자리 맞바꾸기 중간 상태를 위해). 관리 화면에서 "중복"으로 알려준다.
--
-- 실행 방법: Supabase 대시보드 > SQL Editor 에 붙여넣고 Run
--            (0013_projects_and_passes.sql 실행 이후)
--            다시 실행해도 안전하다.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. projects — 좌석 표시 설정
-- -----------------------------------------------------------------------------
alter table public.projects
  add column if not exists pass_seat_enabled boolean not null default false,  -- 좌석 표시 사용
  add column if not exists pass_seat_label   text;                            -- 표시 이름 (비우면 '좌석')

alter table public.projects
  drop constraint if exists projects_pass_seat_label_length;
alter table public.projects
  add constraint projects_pass_seat_label_length
  check (pass_seat_label is null or char_length(pass_seat_label) <= 10);


-- -----------------------------------------------------------------------------
-- 2. pass_holders — 학생별 좌석 (null = 미배정)
-- -----------------------------------------------------------------------------
alter table public.pass_holders
  add column if not exists seat text;

alter table public.pass_holders
  drop constraint if exists pass_holders_seat_length;
alter table public.pass_holders
  add constraint pass_holders_seat_length
  check (seat is null or char_length(seat) <= 10);


-- -----------------------------------------------------------------------------
-- 3. pass_status — 반환 칸 끝에 seat 추가
--
-- 반환 형식이 바뀌면 create or replace 가 안 되므로 지우고 다시 만든다.
-- 기존 칸(student_name, student_number, is_listed, is_suspended)과 동작은 0013 과 같다.
-- -----------------------------------------------------------------------------
drop function if exists public.pass_status(text, uuid);

create function public.pass_status(
  p_token      text,
  p_project_id uuid
)
returns table (
  student_name   text,
  student_number text,
  is_listed      boolean,
  is_suspended   boolean,
  seat           text
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select coalesce(h.student_name, c.student_name),
         s.student_number,
         h.id is not null,
         coalesce(h.is_suspended, false),
         h.seat
  from public.pass_sessions s
  join public.pass_credentials c on c.student_number = s.student_number
  left join public.pass_holders h
    on h.student_number = s.student_number and h.project_id = p_project_id
  where s.token_hash = encode(digest(coalesce(p_token, ''), 'sha256'), 'hex')
    and s.expires_at > now();
$$;

grant execute on function public.pass_status(text, uuid) to anon, authenticated;
