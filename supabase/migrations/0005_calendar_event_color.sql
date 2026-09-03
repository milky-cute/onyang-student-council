-- =============================================================================
-- 일정 색상 — calendar_events.color 추가
--
-- 실행 방법: Supabase 대시보드 > SQL Editor 에 붙여넣고 Run
--            (0004_calendar.sql 실행 이후 언제든 실행 가능)
--
-- 색상은 캘린더에서 일정 종류를 구분하는 용도다.
-- 예) 빨강 = 공휴일, 파랑 = 일반 일정, 초록 = 행사, 보라 = 시험 · 평가
-- =============================================================================

alter table public.calendar_events
  add column if not exists color text not null default '#2563eb';

comment on column public.calendar_events.color is
  '캘린더에 표시할 일정 색상. #rrggbb 형식의 hex 값.';

-- check 제약은 add column if not exists 로 중복 생성되지 않으므로,
-- 0004 의 idempotent 패턴처럼 이미 있으면 건너뛰도록 감싼다.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.calendar_events'::regclass
      and conname = 'calendar_events_color_check'
  ) then
    alter table public.calendar_events
      add constraint calendar_events_color_check
      check (color ~* '^#[0-9a-f]{6}$');
  end if;
end
$$;
