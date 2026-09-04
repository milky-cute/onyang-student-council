-- =============================================================================
-- D-day 표시 + 본인 요구사항 조회에 담당 부서 포함
--
-- 실행 방법: Supabase 대시보드 > SQL Editor 에 붙여넣고 Run
--            (0001_initial_schema.sql, 0004_calendar.sql, 0006_department_attribution_and_public_requests.sql
--             실행 이후 언제든 실행 가능)
-- =============================================================================

-- calendar_events.is_dday — 임원이 홈 화면 D-day 표시 대상으로 지정한 일정.
-- 여러 일정에 동시에 켜져 있을 수 있고, 화면에서는 오늘 이후로 가장 가까운
-- 하나만 골라 보여준다(app/page.tsx).
alter table public.calendar_events
  add column if not exists is_dday boolean not null default false;

comment on column public.calendar_events.is_dday is
  '홈 화면 D-day 표시 대상 여부. 여러 일정에 켜져 있어도 화면에서는 가장 가까운 미래 일정 하나만 표시.';


-- get_my_requests() — 본인 요구사항 조회 결과에 답변 담당 부서 스냅샷
-- (answered_department, 0006 에서 requests 테이블에 추가됨)을 포함하도록 갱신.
-- 반환 컬럼 구성만 바뀌고 조회 조건(이름 + 학번 + PIN 일치)은 그대로다.
create or replace function public.get_my_requests(
  p_student_name   text,
  p_student_number text,
  p_pin            text
)
returns table (
  id                  uuid,
  title               text,
  category            text,
  content             text,
  status              text,
  answer              text,
  answered_department text,
  created_at          timestamptz,
  answered_at         timestamptz
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select r.id, r.title, r.category, r.content,
         r.status, r.answer, r.answered_department, r.created_at, r.answered_at
  from public.requests r
  where r.student_name = trim(p_student_name)
    and r.student_number = trim(p_student_number)
    and r.pin_hash = crypt(p_pin, r.pin_hash)
  order by r.created_at desc;
$$;

grant execute on function
  public.get_my_requests(text, text, text)
  to anon, authenticated;
