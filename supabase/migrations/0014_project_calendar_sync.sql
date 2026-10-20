-- =============================================================================
-- 0014: 학생회 사업 → 일정 자동 추가
--
-- 사업(projects)을 등록 · 수정하면 DB 트리거가 그 사업의 일정(calendar_events)을
-- 지우고 규칙대로 다시 만든다. 사업을 지우면 project_id 외래키(on delete cascade)로
-- 일정도 같이 지워진다. 일정 페이지 · 홈 "이번 주 일정" · 관리 화면이 지금처럼
-- calendar_events 만 읽으면 되므로 화면 코드는 거의 바뀌지 않는다.
--
-- 규칙
--   상시 사업                    → 넣지 않음
--   행사가 하루(종료일 없음/같음)  → 시작일 "{제목}"
--   행사가 여러 날                → 시작일 "{제목} 시작", 종료일 "{제목} 종료"
--   신청 마감일이 있음            → 마감일 "{제목} 신청 마감" 추가
--   색은 기본값, D-day 표시는 끔.
--
-- 자동 일정은 관리 화면에서 고치거나 지울 수 없다(RLS + API 이중 방어). 사업에서 고친다.
-- =============================================================================

alter table public.calendar_events
  add column if not exists project_id uuid references public.projects (id) on delete cascade;

comment on column public.calendar_events.project_id is
  '학생회 사업에서 자동으로 만든 일정이면 그 사업 id. null 이면 임원이 직접 등록한 일정.';

create index if not exists calendar_events_project_id_idx
  on public.calendar_events (project_id);


-- 사업 하나의 자동 일정을 규칙대로 다시 만든다.
-- security definer: 트리거가 RLS(임원만 쓰기 · 자동 일정 수정 금지)에 막히지 않게 한다.
create or replace function public.refresh_project_calendar(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.projects%rowtype;
begin
  delete from public.calendar_events where project_id = p_project_id;

  select * into p from public.projects where id = p_project_id;
  if not found or p.is_always or p.start_date is null then
    return;
  end if;

  if p.end_date is null or p.end_date = p.start_date then
    insert into public.calendar_events (title, event_date, project_id)
    values (p.title, p.start_date, p.id);
  else
    insert into public.calendar_events (title, event_date, project_id)
    values (p.title || ' 시작', p.start_date, p.id),
           (p.title || ' 종료', p.end_date, p.id);
  end if;

  if p.apply_end is not null then
    insert into public.calendar_events (title, event_date, project_id)
    values (p.title || ' 신청 마감', p.apply_end, p.id);
  end if;
end;
$$;

revoke all on function public.refresh_project_calendar(uuid) from public, anon, authenticated;


create or replace function public.projects_sync_calendar()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_project_calendar(new.id);
  return new;
end;
$$;

revoke all on function public.projects_sync_calendar() from public, anon, authenticated;

drop trigger if exists projects_sync_calendar on public.projects;
create trigger projects_sync_calendar
  after insert or update of title, is_always, start_date, end_date, apply_end
  on public.projects
  for each row
  execute function public.projects_sync_calendar();


-- 자동 일정은 임원도 직접 수정 · 삭제할 수 없다(사업에서 고친다). 등록도 project_id 없이만.
drop policy if exists "임원만 일정 등록" on public.calendar_events;
create policy "임원만 일정 등록"
  on public.calendar_events for insert
  to authenticated
  with check (public.is_officer() and project_id is null);

drop policy if exists "임원만 일정 수정" on public.calendar_events;
create policy "임원만 일정 수정"
  on public.calendar_events for update
  to authenticated
  using (public.is_officer() and project_id is null)
  with check (public.is_officer() and project_id is null);

drop policy if exists "임원만 일정 삭제" on public.calendar_events;
create policy "임원만 일정 삭제"
  on public.calendar_events for delete
  to authenticated
  using (public.is_officer() and project_id is null);


-- 이미 등록된 사업도 한 번 채운다.
do $$
declare
  r record;
begin
  for r in select id from public.projects loop
    perform public.refresh_project_calendar(r.id);
  end loop;
end
$$;
