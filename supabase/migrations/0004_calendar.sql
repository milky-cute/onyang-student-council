-- =============================================================================
-- 일정 캘린더 — calendar_events 테이블
--
-- 실행 방법: Supabase 대시보드 > SQL Editor 에 붙여넣고 Run
--            (0001_initial_schema.sql 실행 이후 언제든 실행 가능, public.is_officer() 사용)
--
-- 접근 규칙: 방문자(anon) 조회만 가능, 임원만 등록/수정/삭제.
-- =============================================================================

create table if not exists public.calendar_events (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  description text,
  event_date  date        not null,
  author_id   uuid        references public.officers (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists calendar_events_event_date_idx
  on public.calendar_events (event_date);

alter table public.calendar_events enable row level security;

-- 이 파일을 실수로 두 번 실행해도 "policy already exists" 로 막히지 않도록,
-- calendar_events 의 기존 정책만 먼저 지운다.
do $$
declare
  r record;
begin
  for r in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'calendar_events'
  loop
    execute format('drop policy %I on public.calendar_events', r.policyname);
  end loop;
end
$$;

create policy "누구나 일정 조회"
  on public.calendar_events for select
  to anon, authenticated
  using (true);

create policy "임원만 일정 등록"
  on public.calendar_events for insert
  to authenticated
  with check (public.is_officer());

create policy "임원만 일정 수정"
  on public.calendar_events for update
  to authenticated
  using (public.is_officer())
  with check (public.is_officer());

create policy "임원만 일정 삭제"
  on public.calendar_events for delete
  to authenticated
  using (public.is_officer());
