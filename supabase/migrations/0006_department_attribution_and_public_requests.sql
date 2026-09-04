-- =============================================================================
-- 담당 부서 표시 + 답변 완료된 요구사항 공개
--
-- 실행 방법: Supabase 대시보드 > SQL Editor 에 붙여넣고 Run
--            (0001_initial_schema.sql 실행 이후 언제든 실행 가능)
--
-- officers 테이블은 임원만 조회 가능해서(RLS) 방문자가 join 으로 부서명을 볼 수
-- 없다. 그래서 "누가 썼는지/답변했는지"가 아니라 "그 시점 어느 부서였는지"만
-- 스냅샷으로 board_posts / requests 에 그대로 저장해 공개 화면에 쓴다.
-- 부서가 없는 임원(예: 회장단)이 쓰거나 답변하면 이 컬럼은 null 로 남고,
-- 화면에서는 null 을 "학생자치회" 로 표시한다(coalesce(..., '학생자치회')).
-- =============================================================================

alter table public.board_posts
  add column if not exists department text;

comment on column public.board_posts.department is
  '작성 시점 담당 임원의 officers.department 스냅샷. null 이면 화면에서 "학생자치회"로 표시.';

alter table public.requests
  add column if not exists answered_department text;

comment on column public.requests.answered_department is
  '답변 시점 담당 임원의 officers.department 스냅샷. null 이면 화면에서 "학생자치회"로 표시.';

alter table public.requests
  add column if not exists is_public boolean not null default true;

comment on column public.requests.is_public is
  '답변 완료된 요구사항을 get_public_requests() 로 공개할지 여부. 임원이 글 단위로 켜고 끈다.';


-- =============================================================================
-- 답변 완료 + 공개(is_public) 요구사항만 익명 조회. get_my_requests() 와 마찬가지로
-- requests 테이블에 직접 select 정책을 주지 않고 이 함수로만 접근하게 한다.
-- 학생 개인정보(student_name, student_number, pin_hash, answered_by)는
-- 반환 컬럼에 포함하지 않는다.
-- =============================================================================
create or replace function public.get_public_requests()
returns table (
  id                   uuid,
  title                text,
  category             text,
  content              text,
  answer               text,
  answered_department  text,
  created_at           timestamptz,
  answered_at          timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select r.id, r.title, r.category, r.content, r.answer,
         r.answered_department, r.created_at, r.answered_at
  from public.requests r
  where r.status = '답변완료'
    and r.is_public = true
  order by r.answered_at desc nulls last, r.created_at desc;
$$;

grant execute on function
  public.get_public_requests()
  to anon, authenticated;
